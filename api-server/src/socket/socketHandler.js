const jwt = require('jsonwebtoken');

// Socket.io handler for real-time communication (FREE TIER optimized)
function socketHandler(io, supabase) {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const deviceId = socket.handshake.auth.deviceId;
      const type = socket.handshake.auth.type; // 'admin' or 'desktop-client'

      if (type === 'desktop-client') {
        // For desktop clients, use device ID authentication
        if (!deviceId) {
          return next(new Error('Device ID required'));
        }
        
        socket.deviceId = deviceId;
        socket.userType = 'device';
        return next();
      }

      // For admin connections, verify JWT token
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return next(new Error('Invalid token'));
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, full_name, role, organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return next(new Error('User profile not found'));
      }

      socket.userId = user.id;
      socket.userRole = profile.role;
      socket.organizationId = profile.organization_id;
      socket.userType = 'admin';
      
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (${socket.userType})`);

    if (socket.userType === 'device') {
      handleDeviceConnection(socket, supabase);
    } else if (socket.userType === 'admin') {
      handleAdminConnection(socket, supabase);
    }

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      handleDisconnection(socket, supabase);
    });
  });
}

// Handle desktop client connections
function handleDeviceConnection(socket, supabase) {
  const deviceId = socket.deviceId;
  
  // Join device-specific room
  socket.join(`device:${deviceId}`);
  
  // Update device status to online
  updateDeviceStatus(deviceId, 'online', supabase);

  // Handle device heartbeat
  socket.on('heartbeat', async (data) => {
    try {
      await supabase
        .from('devices')
        .update({
          status: data.status || 'online',
          last_seen: new Date().toISOString()
        })
        .eq('device_id', deviceId);
    } catch (error) {
      console.error('Heartbeat update error:', error);
    }
  });

  // Handle screenshot data from device
  socket.on('screenshot-data', (data) => {
    // Broadcast screenshot to admins monitoring this device
    socket.to(`monitor:${deviceId}`).emit('screenshot-received', {
      deviceId: data.deviceId,
      image: data.image,
      timestamp: data.timestamp
    });
  });

  // Handle screen lock/unlock confirmations
  socket.on('screen-locked', async (data) => {
    try {
      await supabase
        .from('devices')
        .update({ status: 'locked' })
        .eq('device_id', deviceId);

      // Log activity
      await supabase.from('activity_logs').insert({
        device_id: await getDeviceDbId(deviceId, supabase),
        action: 'screen_locked',
        details: data
      });

      // Notify admins
      socket.broadcast.emit('device-status-update', {
        deviceId,
        status: 'locked',
        timestamp: data.timestamp
      });
    } catch (error) {
      console.error('Screen locked update error:', error);
    }
  });

  socket.on('screen-unlocked', async (data) => {
    try {
      await supabase
        .from('devices')
        .update({ status: 'online' })
        .eq('device_id', deviceId);

      // Log activity
      await supabase.from('activity_logs').insert({
        device_id: await getDeviceDbId(deviceId, supabase),
        admin_id: data.adminId,
        action: 'screen_unlocked',
        details: data
      });

      // Notify admins
      socket.broadcast.emit('device-status-update', {
        deviceId,
        status: 'online',
        timestamp: data.timestamp
      });
    } catch (error) {
      console.error('Screen unlocked update error:', error);
    }
  });

  // Handle remote control acceptance/denial
  socket.on('remote-control-accepted', (data) => {
    socket.to(`admin:${data.adminId}`).emit('remote-control-accepted', data);
  });

  socket.on('remote-control-denied', (data) => {
    socket.to(`admin:${data.adminId}`).emit('remote-control-denied', data);
  });
}

// Handle admin connections
function handleAdminConnection(socket, supabase) {
  const userId = socket.userId;
  const organizationId = socket.organizationId;
  
  // Join admin rooms
  socket.join(`admin:${userId}`);
  socket.join(`org:${organizationId}:admins`);

  // Send current connected devices
  sendConnectedDevices(socket, supabase);

  // Handle remote control requests
  socket.on('request-remote-control', (data) => {
    const { deviceId, adminLevel, permissions } = data;
    
    // Send remote control request to device
    socket.to(`device:${deviceId}`).emit('remote-control-request', {
      adminId: userId,
      adminLevel,
      permissions,
      timestamp: new Date().toISOString()
    });
  });

  // Handle screenshot requests
  socket.on('request-screenshot', (data) => {
    const { deviceId } = data;
    
    // Join monitoring room for this device
    socket.join(`monitor:${deviceId}`);
    
    // Request screenshot from device
    socket.to(`device:${deviceId}`).emit('screenshot-request', {
      adminId: userId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle remote control commands
  socket.on('mouse-move', (data) => {
    socket.to(`device:${data.deviceId}`).emit('mouse-move', {
      x: data.x,
      y: data.y
    });
  });

  socket.on('mouse-click', (data) => {
    socket.to(`device:${data.deviceId}`).emit('mouse-click', {
      button: data.button || 'left'
    });
  });

  socket.on('key-press', (data) => {
    socket.to(`device:${data.deviceId}`).emit('key-press', {
      key: data.key,
      modifiers: data.modifiers || []
    });
  });

  // Handle permission request responses
  socket.on('resolve-permission-request', async (data) => {
    try {
      const { requestId, approved } = data;
      
      // Update permission request in database
      await supabase
        .from('permission_requests')
        .update({
          status: approved ? 'approved' : 'denied',
          approved_by: userId,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      // Notify requester
      const { data: request } = await supabase
        .from('permission_requests')
        .select('requested_by, device_id, devices(device_id)')
        .eq('id', requestId)
        .single();

      if (request) {
        socket.to(`admin:${request.requested_by}`).emit('permission-response', {
          requestId,
          approved,
          timestamp: new Date().toISOString()
        });

        // If approved and it's an unlock request, unlock the device
        if (approved) {
          socket.to(`device:${request.devices.device_id}`).emit('unlock-screen', {
            adminId: userId,
            requestId,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Resolve permission request error:', error);
    }
  });

  // Handle broadcast messages
  socket.on('broadcast-message', (data) => {
    const { message, targetDevices } = data;
    
    if (targetDevices && targetDevices.length > 0) {
      // Send to specific devices
      targetDevices.forEach(deviceId => {
        socket.to(`device:${deviceId}`).emit('broadcast-message', {
          message,
          adminId: userId,
          timestamp: new Date().toISOString()
        });
      });
    } else {
      // Send to all devices in organization
      socket.to(`org:${organizationId}:devices`).emit('broadcast-message', {
        message,
        adminId: userId,
        timestamp: new Date().toISOString()
      });
    }
  });
}

// Handle disconnections
async function handleDisconnection(socket, supabase) {
  if (socket.userType === 'device') {
    // Update device status to offline
    await updateDeviceStatus(socket.deviceId, 'offline', supabase);
  }
}

// Helper functions
async function updateDeviceStatus(deviceId, status, supabase) {
  try {
    await supabase
      .from('devices')
      .update({
        status,
        last_seen: new Date().toISOString()
      })
      .eq('device_id', deviceId);
  } catch (error) {
    console.error('Update device status error:', error);
  }
}

async function getDeviceDbId(deviceId, supabase) {
  try {
    const { data } = await supabase
      .from('devices')
      .select('id')
      .eq('device_id', deviceId)
      .single();
    return data?.id;
  } catch (error) {
    return null;
  }
}

async function sendConnectedDevices(socket, supabase) {
  try {
    let query = supabase
      .from('devices')
      .select('device_id, hostname, status, last_seen, platform');

    // Filter by organization for non-superadmins
    if (socket.userRole !== 'superadmin') {
      query = query.eq('organization_id', socket.organizationId);
    }

    const { data: devices } = await query;
    
    socket.emit('connected-devices', devices || []);
  } catch (error) {
    console.error('Send connected devices error:', error);
  }
}

module.exports = socketHandler;
