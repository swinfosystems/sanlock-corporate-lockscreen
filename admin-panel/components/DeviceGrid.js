import { useState } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { useAuth } from '../contexts/AuthContext'
import { useDevices } from '../hooks/useDevices'
import { 
  Monitor, 
  Lock, 
  Unlock, 
  Eye, 
  MousePointer, 
  Wifi, 
  WifiOff,
  MoreVertical,
  Clock,
  User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function DeviceGrid({ selectedDevice, onDeviceSelect }) {
  const { connectedDevices, requestRemoteControl, requestScreenshot } = useSocket()
  const { user, hasPermission } = useAuth()
  const { devices, loading, lockDevice, unlockDevice, deleteDevice } = useDevices()
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  // Combine real devices from database with connected devices from socket
  const allDevices = devices.map(dbDevice => {
    const socketDevice = connectedDevices?.find(cd => cd.deviceId === dbDevice.device_id)
    return {
      ...dbDevice,
      deviceId: dbDevice.device_id,
      hostname: dbDevice.hostname,
      platform: dbDevice.platform,
      arch: dbDevice.arch,
      status: socketDevice ? socketDevice.status : 'offline',
      lastSeen: socketDevice ? socketDevice.lastSeen : dbDevice.last_seen,
      currentUser: socketDevice ? socketDevice.currentUser : dbDevice.user_profiles?.full_name,
      lastScreenshot: socketDevice?.lastScreenshot,
      remoteSession: socketDevice?.remoteSession
    }
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-success-400 bg-success-500/20 border-success-500/30'
      case 'locked': return 'text-danger-400 bg-danger-500/20 border-danger-500/30'
      case 'offline': return 'text-dark-400 bg-dark-700/50 border-dark-600/30'
      default: return 'text-dark-400 bg-dark-700/50 border-dark-600/30'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return <Wifi className="h-4 w-4" />
      case 'locked': return <Lock className="h-4 w-4" />
      case 'offline': return <WifiOff className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  const handleDeviceAction = async (action, device) => {
    switch (action) {
      case 'lock':
        await lockDevice(device.deviceId)
        break
      case 'unlock':
        await unlockDevice(device.deviceId)
        break
      case 'remote':
        requestRemoteControl(device.deviceId)
        onDeviceSelect(device)
        break
      case 'screenshot':
        requestScreenshot(device.deviceId)
        break
      case 'delete':
        if (confirm('Are you sure you want to remove this device?')) {
          await deleteDevice(device.deviceId)
        }
        break
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="glass-card p-12 max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-dark-300">Loading devices...</p>
        </div>
      </div>
    )
  }

  if (!allDevices || allDevices.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="glass-card p-12 max-w-md mx-auto">
          <Monitor className="mx-auto h-16 w-16 text-dark-400 mb-6" />
          <h3 className="text-xl font-semibold text-dark-100 mb-3">No devices connected</h3>
          <p className="text-dark-300 leading-relaxed">
            Install the SanLock desktop client on devices to monitor and control them from this dashboard.
          </p>
          <button className="btn-primary mt-6">
            Download Desktop Client
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Device Management
          </h2>
          <p className="text-dark-300">
            {allDevices.length} device{allDevices.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-3 rounded-xl transition-all duration-200 ${
              viewMode === 'grid' 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
            }`}
          >
            <div className="grid grid-cols-2 gap-1 w-4 h-4">
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
            </div>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-3 rounded-xl transition-all duration-200 ${
              viewMode === 'list' 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
            }`}
          >
            <div className="space-y-1 w-4 h-4">
              <div className="bg-current h-1 rounded-sm"></div>
              <div className="bg-current h-1 rounded-sm"></div>
              <div className="bg-current h-1 rounded-sm"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Device Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allDevices.map((device) => (
            <DeviceCard 
              key={device.deviceId} 
              device={device} 
              onAction={handleDeviceAction}
              canControl={hasPermission('device-control')}
              isSelected={selectedDevice?.deviceId === device.deviceId}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <ul className="divide-y divide-dark-700/50">
            {allDevices.map((device) => (
              <DeviceListItem 
                key={device.deviceId} 
                device={device} 
                onAction={handleDeviceAction}
                canControl={hasPermission('device-control')}
                isSelected={selectedDevice?.deviceId === device.deviceId}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function DeviceCard({ device, onAction, canControl, isSelected }) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div 
      className={`glass-card relative cursor-pointer transition-all duration-300 hover:scale-105 ${
        isSelected ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/30' : ''
      }`}
      onClick={() => setShowActions(!showActions)}
    >
      {/* Device Screenshot Preview */}
      <div className="aspect-video bg-dark-800 rounded-xl mb-4 overflow-hidden border border-dark-700/50">
        {device.lastScreenshot ? (
          <img 
            src={`data:image/png;base64,${device.lastScreenshot}`}
            alt="Device screenshot"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Monitor className="h-12 w-12 text-dark-400" />
          </div>
        )}
      </div>

      {/* Device Info */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-white text-lg">{device.hostname}</h3>
            <p className="text-sm text-dark-300">{device.platform} {device.arch}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
            {getStatusIcon(device.status)}
            <span className="ml-2 capitalize">{device.status}</span>
          </span>
        </div>

        {/* Last Seen */}
        <div className="flex items-center text-sm text-dark-300">
          <Clock className="h-4 w-4 mr-2" />
          {device.lastSeen ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true }) : 'Never'}
        </div>

        {/* Current User */}
        {device.currentUser && (
          <div className="flex items-center text-sm text-dark-300">
            <User className="h-4 w-4 mr-2" />
            {device.currentUser}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && canControl && (
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-dark-700/50">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction(device.status === 'locked' ? 'unlock' : 'lock', device)
              }}
              className={`btn-sm flex items-center justify-center space-x-2 ${
                device.status === 'locked' ? 'btn-primary' : 'btn-danger'
              }`}
            >
              {device.status === 'locked' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              <span>{device.status === 'locked' ? 'Unlock' : 'Lock'}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction('remote', device)
              }}
              className="btn-sm btn-secondary flex items-center justify-center space-x-2"
            >
              <MousePointer className="h-4 w-4" />
              <span>Control</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction('screenshot', device)
              }}
              className="btn-sm btn-secondary col-span-2 flex items-center justify-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Screenshot</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function DeviceListItem({ device, onAction, canControl, isSelected }) {
  return (
    <li className={`transition-all duration-200 ${isSelected ? 'bg-primary-500/10' : 'hover:bg-dark-700/30'}`}>
      <div className="px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-xl bg-dark-700 flex items-center justify-center border border-dark-600">
              <Monitor className="h-6 w-6 text-dark-300" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4 mb-2">
              <p className="text-lg font-semibold text-white truncate">
                {device.hostname}
              </p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
                {getStatusIcon(device.status)}
                <span className="ml-2 capitalize">{device.status}</span>
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-dark-300">
              <span className="font-medium">{device.platform} {device.arch}</span>
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {device.lastSeen ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true }) : 'Never'}
              </span>
              {device.currentUser && (
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  {device.currentUser}
                </span>
              )}
            </div>
          </div>
        </div>

        {canControl && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onAction(device.status === 'locked' ? 'unlock' : 'lock', device)}
              className={`btn-sm flex items-center space-x-2 ${device.status === 'locked' ? 'btn-primary' : 'btn-danger'}`}
              title={device.status === 'locked' ? 'Unlock Device' : 'Lock Device'}
            >
              {device.status === 'locked' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              <span className="hidden sm:inline">{device.status === 'locked' ? 'Unlock' : 'Lock'}</span>
            </button>
            <button
              onClick={() => onAction('remote', device)}
              className="btn-sm btn-secondary flex items-center space-x-2"
              title="Remote Control"
            >
              <MousePointer className="h-4 w-4" />
              <span className="hidden sm:inline">Control</span>
            </button>
            <button
              onClick={() => onAction('screenshot', device)}
              className="btn-sm btn-secondary flex items-center space-x-2"
              title="Take Screenshot"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Screenshot</span>
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
