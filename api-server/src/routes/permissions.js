const express = require('express');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

// Get permission requests (filtered by role)
router.get('/', async (req, res) => {
  try {
    const { supabase } = req.app.locals;
    
    let query = supabase
      .from('permission_requests')
      .select(`
        id,
        request_type,
        reason,
        status,
        created_at,
        expires_at,
        devices(hostname, device_id),
        user_profiles!requested_by(full_name, email)
      `);

    // Filter by organization for non-superadmins
    if (req.user.role !== 'superadmin') {
      query = query.eq('devices.organization_id', req.user.organizationId);
    }

    // Only show pending requests by default
    const status = req.query.status || 'pending';
    query = query.eq('status', status);

    const { data: requests, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ requests: requests || [] });
  } catch (error) {
    console.error('Get permission requests error:', error);
    res.status(500).json({ error: 'Failed to fetch permission requests' });
  }
});

// Create permission request (users can request access)
router.post('/', async (req, res) => {
  try {
    const { supabase } = req.app.locals;
    const { deviceId, requestType, reason } = req.body;

    if (!deviceId || !requestType) {
      return res.status(400).json({ error: 'Device ID and request type required' });
    }

    // Verify device exists and user has access to request
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, organization_id, hostname')
      .eq('device_id', deviceId)
      .single();

    if (deviceError || !device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check if user can request for this device (same organization or superadmin)
    if (req.user.role !== 'superadmin' && device.organization_id !== req.user.organizationId) {
      return res.status(403).json({ error: 'Cannot request access for this device' });
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from('permission_requests')
      .select('id')
      .eq('device_id', device.id)
      .eq('requested_by', req.user.id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return res.status(409).json({ error: 'Pending request already exists for this device' });
    }

    // Create permission request
    const { data: request, error } = await supabase
      .from('permission_requests')
      .insert({
        device_id: device.id,
        requested_by: req.user.id,
        request_type: requestType,
        reason: reason || '',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()
      .single();

    if (error) throw error;

    // Log the request
    await supabase.from('activity_logs').insert({
      organization_id: device.organization_id,
      device_id: device.id,
      user_id: req.user.id,
      action: 'permission_requested',
      details: { requestType, reason, deviceHostname: device.hostname }
    });

    // Emit socket event to admins
    req.app.locals.io.to(`org:${device.organization_id}:admins`).emit('permission-request', {
      requestId: request.id,
      deviceHostname: device.hostname,
      requestType,
      requesterName: req.user.name,
      reason
    });

    res.status(201).json({ 
      request,
      message: 'Permission request submitted successfully' 
    });
  } catch (error) {
    console.error('Create permission request error:', error);
    res.status(500).json({ error: 'Failed to create permission request' });
  }
});

// Approve/deny permission request (admin only)
router.put('/:requestId', requireRole(['superadmin', 'org_admin']), async (req, res) => {
  try {
    const { supabase } = req.app.locals;
    const { requestId } = req.params;
    const { approved, reason } = req.body;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'Approved status (true/false) required' });
    }

    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('permission_requests')
      .select(`
        id,
        device_id,
        requested_by,
        request_type,
        devices(organization_id, hostname),
        user_profiles!requested_by(full_name, email)
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Permission request not found' });
    }

    // Verify admin has access to this request
    if (req.user.role !== 'superadmin' && 
        request.devices.organization_id !== req.user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('permission_requests')
      .update({
        status: approved ? 'approved' : 'denied',
        approved_by: req.user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Log the decision
    await supabase.from('activity_logs').insert({
      organization_id: request.devices.organization_id,
      device_id: request.device_id,
      admin_id: req.user.id,
      user_id: request.requested_by,
      action: approved ? 'permission_approved' : 'permission_denied',
      details: { 
        requestType: request.request_type,
        reason,
        deviceHostname: request.devices.hostname,
        requesterName: request.user_profiles.full_name
      }
    });

    // If approved and request is for unlock, unlock the device
    if (approved && request.request_type === 'unlock') {
      await supabase
        .from('devices')
        .update({ status: 'online' })
        .eq('id', request.device_id);

      // Emit unlock command to device
      req.app.locals.io.to(`device:${request.devices.device_id}`).emit('unlock-screen', {
        adminId: req.user.id,
        requestId: request.id,
        timestamp: new Date().toISOString()
      });
    }

    // Notify requester
    req.app.locals.io.to(`user:${request.requested_by}`).emit('permission-response', {
      requestId: request.id,
      approved,
      reason,
      adminName: req.user.name,
      deviceHostname: request.devices.hostname
    });

    res.json({ 
      message: `Permission request ${approved ? 'approved' : 'denied'}`,
      approved 
    });
  } catch (error) {
    console.error('Update permission request error:', error);
    res.status(500).json({ error: 'Failed to update permission request' });
  }
});

// Get user's own permission requests
router.get('/my-requests', async (req, res) => {
  try {
    const { supabase } = req.app.locals;
    
    const { data: requests, error } = await supabase
      .from('permission_requests')
      .select(`
        id,
        request_type,
        reason,
        status,
        created_at,
        expires_at,
        approved_at,
        devices(hostname, device_id),
        user_profiles!approved_by(full_name)
      `)
      .eq('requested_by', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50); // Limit for free tier optimization

    if (error) throw error;

    res.json({ requests: requests || [] });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ error: 'Failed to fetch your requests' });
  }
});

// Delete expired requests (cleanup endpoint)
router.delete('/cleanup', requireRole(['superadmin']), async (req, res) => {
  try {
    const { supabase } = req.app.locals;
    
    const { error } = await supabase
      .from('permission_requests')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'pending');

    if (error) throw error;

    res.json({ message: 'Expired requests cleaned up' });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup expired requests' });
  }
});

module.exports = router;
