const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify token with Supabase (FREE TIER)
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile and role (optimized for free tier)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, permissions, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      name: profile.full_name,
      role: profile.role,
      permissions: profile.permissions || [],
      organizationId: profile.organization_id
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Role-based access control helper
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role === 'superadmin') {
      return next(); // Superadmin has access to everything
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Permission-based access control
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role === 'superadmin') {
      return next(); // Superadmin has all permissions
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: `Permission required: ${permission}` });
    }

    next();
  };
};

module.exports = { authMiddleware, requireRole, requirePermission };
