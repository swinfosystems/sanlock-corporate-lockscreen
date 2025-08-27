import { createContext, useContext, useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext({})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [connectedDevices, setConnectedDevices] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [permissionRequests, setPermissionRequests] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (user) {
      initializeSocket()
    } else {
      disconnectSocket()
    }

    return () => disconnectSocket()
  }, [user])

  const initializeSocket = () => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://sanlock-corporate-lockscreen.onrender.com'
    
    const newSocket = io(socketUrl, {
      auth: {
        userId: user.id,
        role: user.role,
        organizationId: user.organization?.id
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to control server')
      toast.success('Connected to SanLock server')
    })

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false)
      console.log('Disconnected from control server:', reason)
      if (reason === 'io server disconnect') {
        // Server disconnected the socket, reconnect manually
        newSocket.connect()
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts')
      toast.success('Reconnected to SanLock server')
    })

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection failed:', error)
    })

    // Device management events
    newSocket.on('device-connected', (device) => {
      setConnectedDevices(prev => {
        const existing = prev.find(d => d.deviceId === device.deviceId)
        if (existing) {
          return prev.map(d => d.deviceId === device.deviceId ? { ...d, ...device } : d)
        }
        return [...prev, device]
      })
      toast.success(`Device ${device.hostname} connected`)
    })

    newSocket.on('device-disconnected', (deviceId) => {
      setConnectedDevices(prev => prev.filter(d => d.deviceId !== deviceId))
      toast.error(`Device disconnected`)
    })

    newSocket.on('device-status-update', (update) => {
      setConnectedDevices(prev => 
        prev.map(d => 
          d.deviceId === update.deviceId 
            ? { ...d, status: update.status, lastSeen: update.timestamp }
            : d
        )
      )
    })

    // Permission request events
    newSocket.on('permission-request', (request) => {
      setPermissionRequests(prev => [...prev, request])
      toast(`New permission request from ${request.deviceHostname}`, {
        icon: '🔐',
        duration: 6000
      })
    })

    newSocket.on('permission-request-resolved', (requestId) => {
      setPermissionRequests(prev => prev.filter(r => r.id !== requestId))
    })

    // Remote control events
    newSocket.on('remote-control-accepted', (data) => {
      toast.success(`Remote control accepted for ${data.deviceHostname}`)
    })

    newSocket.on('remote-control-denied', (data) => {
      toast.error(`Remote control denied: ${data.reason}`)
    })

    newSocket.on('screenshot-data', (data) => {
      // Handle screenshot data for remote viewing
      setConnectedDevices(prev => 
        prev.map(d => 
          d.deviceId === data.deviceId 
            ? { ...d, lastScreenshot: data.image, lastScreenshotTime: data.timestamp }
            : d
        )
      )
    })

    // User activity events
    newSocket.on('users-online', (users) => {
      setOnlineUsers(users)
    })

    newSocket.on('user-joined', (user) => {
      setOnlineUsers(prev => [...prev.filter(u => u.id !== user.id), user])
    })

    newSocket.on('user-left', (userId) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== userId))
    })

    setSocket(newSocket)
  }

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
      setConnectedDevices([])
      setOnlineUsers([])
      setPermissionRequests([])
    }
  }

  // Control functions
  const lockDevice = (deviceId) => {
    if (socket && user.role === 'superadmin') {
      socket.emit('lock-device', { deviceId, adminId: user.id })
      toast.success('Lock command sent')
    } else {
      toast.error('Insufficient permissions')
    }
  }

  const unlockDevice = (deviceId) => {
    if (socket && (user.role === 'superadmin' || user.role === 'org_admin')) {
      socket.emit('unlock-device', { deviceId, adminId: user.id })
      toast.success('Unlock command sent')
    } else {
      toast.error('Insufficient permissions')
    }
  }

  const requestRemoteControl = (deviceId) => {
    if (socket) {
      socket.emit('request-remote-control', {
        deviceId,
        adminId: user.id,
        adminLevel: user.role,
        permissions: user.permissions
      })
      toast.success('Remote control request sent')
    }
  }

  const requestScreenshot = (deviceId) => {
    if (socket) {
      socket.emit('request-screenshot', { deviceId, adminId: user.id })
    }
  }

  const sendMouseMove = (deviceId, x, y) => {
    if (socket) {
      socket.emit('mouse-move', { deviceId, x, y })
    }
  }

  const sendMouseClick = (deviceId, button = 'left') => {
    if (socket) {
      socket.emit('mouse-click', { deviceId, button })
    }
  }

  const sendKeyPress = (deviceId, key, modifiers = []) => {
    if (socket) {
      socket.emit('key-press', { deviceId, key, modifiers })
    }
  }

  const approvePermissionRequest = (requestId, approved = true) => {
    if (socket) {
      socket.emit('resolve-permission-request', {
        requestId,
        approved,
        adminId: user.id
      })
      toast.success(approved ? 'Permission granted' : 'Permission denied')
    }
  }

  const broadcastMessage = (message, targetDevices = []) => {
    if (socket && user.role === 'superadmin') {
      socket.emit('broadcast-message', {
        message,
        targetDevices,
        adminId: user.id
      })
      toast.success('Message broadcasted')
    }
  }

  const value = {
    socket,
    isConnected,
    connectedDevices,
    onlineUsers,
    permissionRequests,
    lockDevice,
    unlockDevice,
    requestRemoteControl,
    requestScreenshot,
    sendMouseMove,
    sendMouseClick,
    sendKeyPress,
    approvePermissionRequest,
    broadcastMessage
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
