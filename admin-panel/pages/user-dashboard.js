import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import { 
  Monitor, 
  Lock, 
  Unlock, 
  Clock, 
  User,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react'

export default function UserDashboard() {
  const { user } = useAuth()
  const [deviceStatus, setDeviceStatus] = useState({
    isLocked: false,
    lastActivity: new Date(),
    connectionStatus: 'connected'
  })

  const recentActivities = [
    { time: '2 minutes ago', action: 'Device unlocked', status: 'success' },
    { time: '15 minutes ago', action: 'Screen locked automatically', status: 'info' },
    { time: '1 hour ago', action: 'Connected to SanLock', status: 'success' },
    { time: '3 hours ago', action: 'Login attempt detected', status: 'warning' },
    { time: '1 day ago', action: 'Device registered', status: 'success' }
  ]

  const getActivityIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success-400" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning-400" />
      case 'info':
        return <Activity className="h-4 w-4 text-primary-400" />
      default:
        return <Clock className="h-4 w-4 text-dark-400" />
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-8">
          {/* Welcome Header */}
          <div className="glass-card p-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-3 text-white">
                  User Dashboard
                </h1>
                <p className="text-dark-300 text-lg">
                  Monitor your device status and access permissions
                </p>
                <div className="flex items-center mt-4 space-x-4">
                  <span className="text-dark-200">Welcome:</span>
                  <span className="text-primary-400 font-semibold">{user?.name}</span>
                  <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-medium border border-primary-500/30">
                    {user?.role}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-dark-400 mb-1">SanLock v1.0.0</div>
                <div className="text-xs text-dark-500">Sanket Wanve Technologies</div>
                <div className="flex items-center mt-3 space-x-2">
                  <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                  <span className="text-success-400 text-sm font-medium">Connected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Device Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Device Lock Status */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Device Status</h3>
                {deviceStatus.isLocked ? (
                  <Lock className="h-6 w-6 text-danger-400" />
                ) : (
                  <Unlock className="h-6 w-6 text-success-400" />
                )}
              </div>
              <div className="space-y-3">
                <div className={`flex items-center space-x-3 p-3 rounded-xl ${
                  deviceStatus.isLocked 
                    ? 'bg-danger-500/10 border border-danger-500/30' 
                    : 'bg-success-500/10 border border-success-500/30'
                }`}>
                  {deviceStatus.isLocked ? (
                    <XCircle className="h-5 w-5 text-danger-400" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-success-400" />
                  )}
                  <span className={`font-medium ${
                    deviceStatus.isLocked ? 'text-danger-400' : 'text-success-400'
                  }`}>
                    {deviceStatus.isLocked ? 'Device Locked' : 'Device Unlocked'}
                  </span>
                </div>
                <div className="text-sm text-dark-300">
                  Last activity: {deviceStatus.lastActivity.toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Connection</h3>
                <Monitor className="h-6 w-6 text-primary-400" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-success-500/10 border border-success-500/30">
                  <div className="w-3 h-3 bg-success-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-success-400">Online</span>
                </div>
                <div className="text-sm text-dark-300">
                  Connected to SanLock server
                </div>
              </div>
            </div>

            {/* Access Level */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Access Level</h3>
                <Shield className="h-6 w-6 text-primary-400" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-primary-500/10 border border-primary-500/30">
                  <User className="h-5 w-5 text-primary-400" />
                  <span className="font-medium text-primary-400 capitalize">{user?.role}</span>
                </div>
                <div className="text-sm text-dark-300">
                  Standard user permissions
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 rounded-xl bg-dark-700/30 border border-dark-600/30">
                  {getActivityIcon(activity.status)}
                  <div className="flex-1">
                    <p className="text-white font-medium">{activity.action}</p>
                    <p className="text-dark-400 text-sm">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="btn-secondary flex items-center justify-center space-x-3 p-4">
                <Lock className="h-5 w-5" />
                <span>Request Device Lock</span>
              </button>
              <button className="btn-secondary flex items-center justify-center space-x-3 p-4">
                <Shield className="h-5 w-5" />
                <span>Request Admin Access</span>
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
