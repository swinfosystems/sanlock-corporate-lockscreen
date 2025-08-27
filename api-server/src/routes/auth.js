const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Login endpoint (uses Supabase Auth - FREE)
router.post('/login', async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({ error: authError.message });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        role,
        permissions,
        organization_id,
        is_active,
        organizations(name, domain)
      `)
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (!profile.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Log login activity
    await supabase.from('activity_logs').insert({
      organization_id: profile.organization_id,
      user_id: profile.id,
      action: 'user_login',
      details: { 
        email,
        deviceId: deviceId || 'unknown',
        userAgent: req.headers['user-agent']
      }
    });

    // Update last login
    await supabase
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', profile.id);

    res.json({
      success: true,
      user: {
        id: profile.id,
        email: authData.user.email,
        name: profile.full_name,
        role: profile.role,
        permissions: profile.permissions || [],
        organization: profile.organizations,
        token: authData.session.access_token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register endpoint (admin only for creating users)
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, role = 'user', organizationId } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name required' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        role,
        organization_id: organizationId,
        permissions: getDefaultPermissions(role)
      })
      .select()
      .single();

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    res.status(201).json({
      success: true,
      user: {
        id: profile.id,
        email: authData.user.email,
        name: profile.full_name,
        role: profile.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await supabase.auth.admin.signOut(token);
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, permissions, organization_id, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    res.json({
      valid: true,
      user: {
        id: profile.id,
        email: user.email,
        name: profile.full_name,
        role: profile.role,
        permissions: profile.permissions || []
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Token verification failed' });
  }
});

// Helper function for default permissions
function getDefaultPermissions(role) {
  const permissions = {
    superadmin: [
      'system:full_access',
      'organization:manage',
      'user:manage',
      'device:full_control',
      'remote:full_access',
      'permission:approve_all'
    ],
    org_admin: [
      'organization:view',
      'user:manage_org',
      'device:control_org',
      'remote:access_org',
      'permission:approve_org'
    ],
    user: [
      'device:view_own',
      'permission:request_basic'
    ]
  };

  return permissions[role] || permissions.user;
}

module.exports = router;
