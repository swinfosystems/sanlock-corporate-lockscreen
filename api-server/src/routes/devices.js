const express = require('express');
const { requireRole, requirePermission } = require('../middleware/auth');
const router = express.Router();

// Get all devices for user's organization (FREE TIER optimized)
router.get('/', async (req, res) => {
  try {
    const { supabase } = req.app.locals;
    
    let query = supabase
      .from('devices')
      .select(`
        id,
        device_id,
        hostname,
        platform,
        status,
        last_seen,
        current_user_id,
        user_profiles!current_user_id(full_name)
      `);

    // Filter by organization for non-superadmins
    if (req.user.role !== 'superadmin') {
      query = query.eq('organization_id', req.user.organizationId);
    }

    const { data: devices, error } = await query.order('last_seen', { ascending: false });

    if (error) throw error;

    res.json({ devices: devices || [] });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Register a new device (called by desktop client)
router.post('/register', async (req, res) => {
  try {
    const { supabase } = req.app.locals;
    const { deviceId, hostname, platform, arch, version } = req.body;

    if (!deviceId || !hostname || !platform) {
      return res.status(400).json({ error: 'Missing required device information' });
    }

    // Check if device already exists
    const { data: existingDevice } = await supabase
      .from('devices')
      .select('id, organization_id')
      .eq('device_id', deviceId)
      .single();

    if (existingDevice) {
      // Update existing device
      const { data, error } = await supabase
        .from('devices')
        .update({
          hostname,
          platform,
          status: 'online',
          last_seen: new Date().toISOString()
        })
        .eq('device_id', deviceId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ device: data, message: 'Device updated' });
    }

    // Create new device (assign to user's organization)
    const { data, error } = await supabase
      .from('devices')
      .insert({
        device_id: deviceId,
        hostname,
        platform,
        organization_id: req.user.organizationId,
        status: 'online',
        last_seen: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Log device registration
    await supabase.from('activity_logs').insert({
      organization_id: req.user.organizationId,
      device_id: data.id,
      user_id: req.user.id,
      action: 'device_registered',
      details: { hostname, platform }
    });

    res.status(201).json({ device: data, message: 'Device registered successfully' });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

// Update device status (heartbeat from desktop client)
router.put('/:deviceId/status', async (req, res) => {
  try {
    const { supabase } = req.app.locals;
    const { deviceId } = req.params;
    const { status, currentUser } = req.body;

    const { data, error } = await supabase
      .from('devices')
      .update({
        status,
        last_seen: new Date().toISOString(),
        ...(currentUser && { current_user_id: currentUser })
      })
      .eq('device_id', deviceId)
      .select()
      .single();

    if (error) throw error;

    res.json({ device: data });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update device status' });
  }
});

// Lock device (admin only)
router.post('/:deviceId/lock', requireRole(['superadmin', 'org_admin']), async (req, res) => {
  try {
    const { supabase } = req.app.locals;
    const { deviceId } = req.params;

    // Verify device belongs to user's organization (unless superadmin)
    let query = supabase.from('devices').select('id, organization_id').eq('device_id', deviceId);
    
    if (req.user.role !== 'superadmin') {
      query = query.eq('organization_id', req.user.organizationId);
    }

    const { data: device, error: deviceError } = await query.single();
    if (deviceError || !device) {
      return res.status(404).json({ error: 'Device not found or access denied' });
    }

    // Update device status
    const { error } = await supabase
      .from('devices')
      .update({ status: 'locked' })
      .eq('device_id', deviceId);

    if (error) throw error;

    // Log action
    await supabase.from('activity_logs').insert({
      organization_id: device.organization_id,
      device_id: device.id,
      admin_id: req.user.id,
      action: 'device_locked',
      details: { admin: req.user.name }
    });

    // Emit socket event to device
    req.app.locals.io.to(`device:${deviceId}`).emit('lock-screen', {
      adminId: req.user.id,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Device lock command sent' });
  } catch (error) {
    console.error('Lock device error:', error);
    res.status(500).json({ error: 'Failed to lock device' });
  }
});

// Unlock device (admin only)
router.post('/:deviceId/unlock', requireRole(['superadmin', 'org_admin']), async (req, res) => {
  try {
    const { supabase } = req.app.locals;
    const { deviceId } = req.params;

    // Verify device access
    let query = supabase.from('devices').select('id, organization_id').eq('device_id', deviceId);
    
    if (req.user.role !== 'superadmin') {
      query = query.eq('organization_id', req.user.organizationId);
    }

    const { data: device, error: deviceError } = await query.single();
    if (deviceError || !device) {
      return res.status(404).json({ error: 'Device not found or access denied' });
    }

    // Update device status
    const { error } = await supabase
      .from('devices')
      .update({ status: 'online' })
      .eq('device_id', deviceId);

    if (error) throw error;

    // Log action
    await supabase.from('activity_logs').insert({
      organization_id: device.organization_id,
      device_id: device.id,
      admin_id: req.user.id,
      action: 'device_unlocked',
      details: { admin: req.user.name }
    });

    // Emit socket event to device
    req.app.locals.io.to(`device:${deviceId}`).emit('unlock-screen', {
      adminId: req.user.id,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Device unlock command sent' });
  } catch (error) {
    console.error('Unlock device error:', error);
    res.status(500).json({ error: 'Failed to unlock device' });
  }
});

// Request screenshot (admin only)
router.post('/:deviceId/screenshot', requireRole(['superadmin', 'org_admin']), async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Emit socket event to device
    req.app.locals.io.to(`device:${deviceId}`).emit('screenshot-request', {
      adminId: req.user.id,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Screenshot request sent' });
  } catch (error) {
    console.error('Screenshot request error:', error);
    res.status(500).json({ error: 'Failed to request screenshot' });
  }
});

// Delete device (superadmin only)
router.delete('/:deviceId', requireRole(['superadmin']), async (req, res) => {
  try {
    const { supabase } = req.app.locals;
    const { deviceId } = req.params;

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('device_id', deviceId);

    if (error) throw error;

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

module.exports = router;
