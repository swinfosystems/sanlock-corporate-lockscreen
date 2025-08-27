import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DeviceGrid from '../components/DeviceGrid'
import RemoteControl from '../components/RemoteControl'
import PermissionRequests from '../components/PermissionRequests'
import Analytics from '../components/Analytics'
import { Monitor, Users, Shield, Activity } from 'lucide-react'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const { connectedDevices, onlineUsers } = useSocket()
  const [activeTab, setActiveTab] = useState('devices')
  const [selectedDevice, setSelectedDevice] = useState(null)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const stats = [
    {
      name: 'Connected Devices',
      value: connectedDevices?.length || 0,
      icon: Monitor,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      name: 'Online Users',
      value: onlineUsers?.length || 0,
      icon: Users,
      color: 'text-success-600',
      bgColor: 'bg-success-50'
    },
    {
      name: 'Locked Screens',
      value: connectedDevices?.filter(d => d.status === 'locked').length || 0,
      icon: Shield,
      color: 'text-danger-600',
      bgColor: 'bg-danger-50'
    },
    {
      name: 'Active Sessions',
      value: connectedDevices?.filter(d => d.remoteSession).length || 0,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  const tabs = [
    { id: 'devices', name: 'Devices', component: DeviceGrid },
    { id: 'remote', name: 'Remote Control', component: RemoteControl },
    { id: 'permissions', name: 'Permission Requests', component: PermissionRequests },
    { id: 'analytics', name: 'Analytics', component: Analytics }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Corporate Lockscreen Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user.name} ({user.role})
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">System Online</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="card">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Active Tab Content */}
        <div className="mt-6">
          {ActiveComponent && (
            <ActiveComponent 
              selectedDevice={selectedDevice}
              onDeviceSelect={setSelectedDevice}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}
