import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import DeviceGrid from '../components/DeviceGrid'
import { 
  Users, 
  Monitor, 
  Shield, 
  Settings,
  Plus,
  Search,
  Filter
} from 'lucide-react'

export default function OrganizationDashboard() {
  const { user, supabase } = useAuth()
  const [activeTab, setActiveTab] = useState('devices')
  const [orgUsers, setOrgUsers] = useState([])
  const [orgDevices, setOrgDevices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.organization?.id) {
      loadOrganizationData()
    }
  }, [user])

  const loadOrganizationData = async () => {
    try {
      setLoading(true)
      
      // Load organization users
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('organization_id', user.organization.id)

      if (usersError) throw usersError
      setOrgUsers(users || [])

      // Load organization devices (mock for now)
      setOrgDevices([
        {
          id: 1,
          hostname: 'WORKSTATION-01',
          platform: 'Windows',
          arch: 'x64',
          status: 'online',
          lastSeen: new Date(),
          currentUser: 'john.doe',
          organizationId: user.organization.id
        },
        {
          id: 2,
          hostname: 'LAPTOP-HR-02',
          platform: 'Windows',
          arch: 'x64',
          status: 'locked',
          lastSeen: new Date(Date.now() - 300000),
          currentUser: 'jane.smith',
          organizationId: user.organization.id
        }
      ])

    } catch (error) {
      console.error('Error loading organization data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'devices', name: 'Devices', icon: Monitor },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings }
  ]

  const renderDevicesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white">Organization Devices</h3>
          <p className="text-dark-300">{orgDevices.length} devices in your organization</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Device</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orgDevices.map((device) => (
          <div key={device.id} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-white">{device.hostname}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                device.status === 'online' 
                  ? 'bg-success-500/20 text-success-400 border border-success-500/30'
                  : device.status === 'locked'
                  ? 'bg-danger-500/20 text-danger-400 border border-danger-500/30'
                  : 'bg-dark-700/50 text-dark-400 border border-dark-600/30'
              }`}>
                {device.status}
              </span>
            </div>
            <div className="space-y-2 text-sm text-dark-300">
              <p>Platform: {device.platform} {device.arch}</p>
              <p>User: {device.currentUser}</p>
              <p>Last seen: {device.lastSeen.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white">Organization Users</h3>
          <p className="text-dark-300">{orgUsers.length} users in your organization</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Invite User</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-dark-200">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-dark-200">Email</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-dark-200">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-dark-200">Last Login</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-dark-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {orgUsers.map((orgUser) => (
                <tr key={orgUser.id} className="hover:bg-dark-700/30">
                  <td className="px-6 py-4 text-sm text-white">{orgUser.full_name}</td>
                  <td className="px-6 py-4 text-sm text-dark-300">{orgUser.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-medium border border-primary-500/30">
                      {orgUser.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-dark-300">
                    {orgUser.last_login_at ? new Date(orgUser.last_login_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <button className="btn-sm btn-secondary">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Organization Settings</h3>
      
      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Organization Information</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Organization Name</label>
            <input 
              type="text" 
              className="input-field" 
              defaultValue={user?.organization?.name || ''} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Description</label>
            <textarea 
              className="input-field" 
              rows={3}
              placeholder="Organization description..."
            />
          </div>
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>

      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Security Settings</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Auto-lock devices</p>
              <p className="text-dark-300 text-sm">Automatically lock devices after inactivity</p>
            </div>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Require approval for unlock</p>
              <p className="text-dark-300 text-sm">Users must request approval to unlock devices</p>
            </div>
            <input type="checkbox" className="toggle" />
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <ProtectedRoute requiredRole="org_admin">
        <Layout>
          <div className="flex items-center justify-center min-h-96">
            <div className="glass-card p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-dark-300">Loading organization data...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="org_admin">
      <Layout>
        <div className="space-y-8">
          {/* Header */}
          <div className="glass-card p-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-3 text-white">
                  Organization Dashboard
                </h1>
                <p className="text-dark-300 text-lg">
                  Manage your organization's devices and users
                </p>
                <div className="flex items-center mt-4 space-x-4">
                  <span className="text-dark-200">Organization:</span>
                  <span className="text-primary-400 font-semibold">{user?.organization?.name}</span>
                  <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-medium border border-primary-500/30">
                    {user?.role}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-dark-400 mb-1">SanLock v1.0.0</div>
                <div className="text-xs text-dark-500">Sanket Wanve Technologies</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-300 text-sm font-medium">Total Devices</p>
                  <p className="text-3xl font-bold text-white">{orgDevices.length}</p>
                </div>
                <Monitor className="h-8 w-8 text-primary-400" />
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-300 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-white">{orgUsers.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary-400" />
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-300 text-sm font-medium">Online Devices</p>
                  <p className="text-3xl font-bold text-white">{orgDevices.filter(d => d.status === 'online').length}</p>
                </div>
                <Shield className="h-8 w-8 text-success-400" />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="glass-card p-6">
            <nav className="flex space-x-8 mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>

            {/* Tab Content */}
            {activeTab === 'devices' && renderDevicesTab()}
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'settings' && renderSettingsTab()}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
