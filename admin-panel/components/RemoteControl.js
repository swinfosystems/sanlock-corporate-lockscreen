import { useState, useEffect } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { Monitor, Lock, Unlock, Eye, EyeOff, Power, RefreshCw } from 'lucide-react'

export default function RemoteControl({ selectedDevice, onDeviceSelect }) {
  const { socket, connectedDevices } = useSocket()
  const [remoteSession, setRemoteSession] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLockDevice = async (deviceId) => {
    setLoading(true)
    try {
      socket?.emit('lock_device', { deviceId })
    } catch (error) {
      console.error('Failed to lock device:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlockDevice = async (deviceId) => {
    setLoading(true)
    try {
      socket?.emit('unlock_device', { deviceId })
    } catch (error) {
      console.error('Failed to unlock device:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartRemoteSession = async (deviceId) => {
    setLoading(true)
    try {
      socket?.emit('start_remote_session', { deviceId })
    } catch (error) {
      console.error('Failed to start remote session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStopRemoteSession = async (deviceId) => {
    setLoading(true)
    try {
      socket?.emit('stop_remote_session', { deviceId })
    } catch (error) {
      console.error('Failed to stop remote session:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Remote Control</h2>
        <div className="text-sm text-gray-500">
          {connectedDevices?.length || 0} devices available
        </div>
      </div>

      {!selectedDevice ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectedDevices?.map((device) => (
            <div
              key={device.id}
              onClick={() => onDeviceSelect(device)}
              className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  device.status === 'locked' ? 'bg-danger-50' : 'bg-success-50'
                }`}>
                  <Monitor className={`h-6 w-6 ${
                    device.status === 'locked' ? 'text-danger-600' : 'text-success-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{device.name}</h3>
                  <p className="text-sm text-gray-500">{device.user}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      device.status === 'locked' 
                        ? 'bg-danger-100 text-danger-800'
                        : 'bg-success-100 text-success-800'
                    }`}>
                      {device.status === 'locked' ? 'Locked' : 'Unlocked'}
                    </span>
                    {device.remoteSession && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Remote Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onDeviceSelect(null)}
              className="btn-secondary"
            >
              ← Back to Devices
            </button>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{selectedDevice.name}</h3>
              <p className="text-sm text-gray-500">User: {selectedDevice.user}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Device Status */}
            <div className="card">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Device Status</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lock Status</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    selectedDevice.status === 'locked' 
                      ? 'bg-danger-100 text-danger-800'
                      : 'bg-success-100 text-success-800'
                  }`}>
                    {selectedDevice.status === 'locked' ? 'Locked' : 'Unlocked'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Remote Session</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    selectedDevice.remoteSession 
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedDevice.remoteSession ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Seen</span>
                  <span className="text-sm text-gray-900">
                    {new Date(selectedDevice.lastSeen).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Control Actions */}
            <div className="card">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Control Actions</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleLockDevice(selectedDevice.id)}
                    disabled={loading || selectedDevice.status === 'locked'}
                    className="btn-danger flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Lock</span>
                  </button>
                  <button
                    onClick={() => handleUnlockDevice(selectedDevice.id)}
                    disabled={loading || selectedDevice.status === 'unlocked'}
                    className="btn-success flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Unlock className="h-4 w-4" />
                    <span>Unlock</span>
                  </button>
                </div>
                
                <div className="border-t pt-3">
                  {!selectedDevice.remoteSession ? (
                    <button
                      onClick={() => handleStartRemoteSession(selectedDevice.id)}
                      disabled={loading}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Start Remote Session</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStopRemoteSession(selectedDevice.id)}
                      disabled={loading}
                      className="btn-secondary w-full flex items-center justify-center space-x-2"
                    >
                      <EyeOff className="h-4 w-4" />
                      <span>Stop Remote Session</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Remote Session Viewer */}
          {selectedDevice.remoteSession && (
            <div className="card">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Remote Desktop View</h4>
              <div className="bg-gray-900 rounded-lg p-4 aspect-video flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Monitor className="h-12 w-12 mx-auto mb-2" />
                  <p>Remote desktop stream would appear here</p>
                  <p className="text-sm mt-1">Feature requires additional WebRTC implementation</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {connectedDevices?.length === 0 && (
        <div className="text-center py-12">
          <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Devices Connected</h3>
          <p className="text-gray-600">
            Install the desktop client on target machines to see them here.
          </p>
        </div>
      )}
    </div>
  )
}
