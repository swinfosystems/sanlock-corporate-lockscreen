import { useState } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { useAuth } from '../contexts/AuthContext'
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
  const { connectedDevices, lockDevice, unlockDevice, requestRemoteControl, requestScreenshot } = useSocket()
  const { user, hasPermission } = useAuth()
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100'
      case 'locked': return 'text-red-600 bg-red-100'
      case 'offline': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
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

  const handleDeviceAction = (action, device) => {
    switch (action) {
      case 'lock':
        lockDevice(device.deviceId)
        break
      case 'unlock':
        unlockDevice(device.deviceId)
        break
      case 'remote':
        requestRemoteControl(device.deviceId)
        onDeviceSelect(device)
        break
      case 'screenshot':
        requestScreenshot(device.deviceId)
        break
    }
  }

  if (!connectedDevices || connectedDevices.length === 0) {
    return (
      <div className="text-center py-12">
        <Monitor className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No devices connected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Install the desktop client on devices to see them here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">
          Connected Devices ({connectedDevices.length})
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
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
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
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
          {connectedDevices.map((device) => (
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
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {connectedDevices.map((device) => (
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
      className={`card relative cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-indigo-500' : ''
      }`}
      onClick={() => setShowActions(!showActions)}
    >
      {/* Device Screenshot Preview */}
      <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
        {device.lastScreenshot ? (
          <img 
            src={`data:image/png;base64,${device.lastScreenshot}`}
            alt="Device screenshot"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Monitor className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Device Info */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{device.hostname}</h3>
            <p className="text-sm text-gray-500">{device.platform} {device.arch}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
            {getStatusIcon(device.status)}
            <span className="ml-1 capitalize">{device.status}</span>
          </span>
        </div>

        {/* Last Seen */}
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          {device.lastSeen ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true }) : 'Never'}
        </div>

        {/* Current User */}
        {device.currentUser && (
          <div className="flex items-center text-sm text-gray-500">
            <User className="h-4 w-4 mr-1" />
            {device.currentUser}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && canControl && (
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction(device.status === 'locked' ? 'unlock' : 'lock', device)
              }}
              className={`btn-sm ${device.status === 'locked' ? 'btn-primary' : 'btn-danger'}`}
            >
              {device.status === 'locked' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {device.status === 'locked' ? 'Unlock' : 'Lock'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction('remote', device)
              }}
              className="btn-sm btn-secondary"
            >
              <MousePointer className="h-4 w-4" />
              Control
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction('screenshot', device)
              }}
              className="btn-sm btn-secondary col-span-2"
            >
              <Eye className="h-4 w-4" />
              Screenshot
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function DeviceListItem({ device, onAction, canControl, isSelected }) {
  return (
    <li className={`${isSelected ? 'bg-indigo-50' : ''}`}>
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <Monitor className="h-8 w-8 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <p className="text-sm font-medium text-gray-900 truncate">
                {device.hostname}
              </p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                {getStatusIcon(device.status)}
                <span className="ml-1 capitalize">{device.status}</span>
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{device.platform} {device.arch}</span>
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {device.lastSeen ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true }) : 'Never'}
              </span>
              {device.currentUser && (
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {device.currentUser}
                </span>
              )}
            </div>
          </div>
        </div>

        {canControl && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onAction(device.status === 'locked' ? 'unlock' : 'lock', device)}
              className={`btn-sm ${device.status === 'locked' ? 'btn-primary' : 'btn-danger'}`}
            >
              {device.status === 'locked' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </button>
            <button
              onClick={() => onAction('remote', device)}
              className="btn-sm btn-secondary"
            >
              <MousePointer className="h-4 w-4" />
            </button>
            <button
              onClick={() => onAction('screenshot', device)}
              className="btn-sm btn-secondary"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
