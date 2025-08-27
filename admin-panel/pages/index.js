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
  const { user, loading, supabase } = useAuth()
  const { connectedDevices, onlineUsers } = useSocket()
  const [activeTab, setActiveTab] = useState('devices')
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [realTimeStats, setRealTimeStats] = useState({
    totalDevices: 0,
    totalUsers: 0,
    totalOrganizations: 0,
    activeConnections: 0
  })
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && supabase) {
      loadRealTimeStats()
    }
  }, [user, supabase])

  const loadRealTimeStats = async () => {
    try {
      // Load real statistics from database
      const [devicesResult, usersResult, orgsResult] = await Promise.all([
        supabase.from('devices').select('id', { count: 'exact' }),
        supabase.from('user_profiles').select('id', { count: 'exact' }),
        supabase.from('organizations').select('id', { count: 'exact' })
      ])

      setRealTimeStats({
        totalDevices: devicesResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalOrganizations: orgsResult.count || 0,
        activeConnections: connectedDevices?.length || 0
      })
    } catch (error) {
      console.error('Error loading real-time stats:', error)
    }
  }

  const stats = [
    {
      name: 'Total Devices',
      value: realTimeStats.totalDevices,
      icon: Monitor,
      color: 'text-primary-400',
      bgColor: 'from-primary-500/20 to-primary-600/30'
    },
    {
      name: 'Total Users',
      value: realTimeStats.totalUsers,
      icon: Users,
      color: 'text-success-400',
      bgColor: 'from-success-500/20 to-success-600/30'
    },
    {
      name: 'Organizations',
      value: realTimeStats.totalOrganizations,
      icon: Shield,
      color: 'text-warning-400',
      bgColor: 'from-warning-500/20 to-warning-600/30'
    },
    {
      name: 'Active Connections',
      value: connectedDevices?.length || 0,
      icon: Activity,
      color: 'text-purple-400',
      bgColor: 'from-purple-500/20 to-purple-600/30'
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
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="glass-card p-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-3 text-white">
                Welcome to <span className="sanlock-brand">SanLock</span>
              </h1>
              <p className="text-dark-300 text-lg">
                Corporate Lockscreen Management System
              </p>
              <div className="flex items-center mt-4 space-x-4">
                <span className="text-dark-200">Logged in as:</span>
                <span className="text-primary-400 font-semibold">{user.name}</span>
                <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-medium border border-primary-500/30">
                  {user.role}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-dark-400 mb-1">Version 1.0.0</div>
              <div className="text-xs text-dark-500">Sanket Wanve Technologies</div>
              <div className="flex items-center mt-3 space-x-2">
                <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                <span className="text-success-400 text-sm font-medium">System Operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="stat-card group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-400 text-sm font-medium mb-2">{stat.name}</p>
                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  </div>
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Navigation Tabs */}
        <div className="glass-card p-2 mb-8">
          <nav className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Active Tab Content */}
        <div className="glass-card p-8">
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
