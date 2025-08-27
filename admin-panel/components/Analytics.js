import { useState, useEffect } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Monitor, Clock, Activity, Shield } from 'lucide-react'

export default function Analytics() {
  const { connectedDevices, onlineUsers } = useSocket()
  const [timeRange, setTimeRange] = useState('24h')
  const [loading, setLoading] = useState(false)

  // Mock analytics data - replace with real API calls
  const deviceUsageData = [
    { hour: '00:00', locked: 45, unlocked: 5 },
    { hour: '02:00', locked: 48, unlocked: 2 },
    { hour: '04:00', locked: 50, unlocked: 0 },
    { hour: '06:00', locked: 35, unlocked: 15 },
    { hour: '08:00', locked: 20, unlocked: 30 },
    { hour: '10:00', locked: 15, unlocked: 35 },
    { hour: '12:00', locked: 25, unlocked: 25 },
    { hour: '14:00', locked: 18, unlocked: 32 },
    { hour: '16:00', locked: 22, unlocked: 28 },
    { hour: '18:00', locked: 40, unlocked: 10 },
    { hour: '20:00', locked: 45, unlocked: 5 },
    { hour: '22:00', locked: 47, unlocked: 3 }
  ]

  const permissionRequestsData = [
    { day: 'Mon', approved: 12, rejected: 3, pending: 2 },
    { day: 'Tue', approved: 8, rejected: 1, pending: 4 },
    { day: 'Wed', approved: 15, rejected: 2, pending: 1 },
    { day: 'Thu', approved: 10, rejected: 4, pending: 3 },
    { day: 'Fri', approved: 18, rejected: 1, pending: 2 },
    { day: 'Sat', approved: 5, rejected: 0, pending: 1 },
    { day: 'Sun', approved: 3, rejected: 1, pending: 0 }
  ]

  const deviceTypeData = [
    { name: 'Desktop', value: 35, color: '#f97316' },
    { name: 'Laptop', value: 28, color: '#eab308' },
    { name: 'Workstation', value: 15, color: '#22c55e' },
    { name: 'Server', value: 8, color: '#3b82f6' },
    { name: 'Other', value: 4, color: '#8b5cf6' }
  ]

  const securityMetrics = [
    {
      title: 'Security Score',
      value: '94%',
      change: '+2%',
      trend: 'up',
      icon: Shield,
      color: 'text-success-600',
      bgColor: 'bg-success-50'
    },
    {
      title: 'Average Lock Time',
      value: '6.2h',
      change: '+0.3h',
      trend: 'up',
      icon: Clock,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'Remote Sessions',
      value: '23',
      change: '+5',
      trend: 'up',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Policy Violations',
      value: '2',
      change: '-3',
      trend: 'down',
      icon: TrendingUp,
      color: 'text-danger-600',
      bgColor: 'bg-danger-50'
    }
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'device_locked',
      message: 'DESKTOP-ABC123 was locked remotely',
      user: 'Admin User',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      severity: 'info'
    },
    {
      id: 2,
      type: 'permission_approved',
      message: 'Unlock request approved for John Doe',
      user: 'Manager User',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      severity: 'success'
    },
    {
      id: 3,
      type: 'security_alert',
      message: 'Multiple failed unlock attempts detected',
      user: 'System',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      severity: 'warning'
    },
    {
      id: 4,
      type: 'device_connected',
      message: 'New device LAPTOP-XYZ789 connected',
      user: 'Jane Smith',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      severity: 'info'
    }
  ]

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'success':
        return 'text-success-600 bg-success-50'
      case 'warning':
        return 'text-warning-600 bg-warning-50'
      case 'error':
        return 'text-danger-600 bg-danger-50'
      default:
        return 'text-primary-600 bg-primary-50'
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Analytics & Reports</h2>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {securityMetrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.title} className="card">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <span className={`text-sm font-medium ${
                      metric.trend === 'up' ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Usage Chart */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Usage (24h)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deviceUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="locked" stroke="#f97316" strokeWidth={2} />
                <Line type="monotone" dataKey="unlocked" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Locked</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Unlocked</span>
            </div>
          </div>
        </div>

        {/* Device Types */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Types</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {deviceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Permission Requests Chart */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Permission Requests (7 days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={permissionRequestsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="approved" fill="#22c55e" />
              <Bar dataKey="rejected" fill="#ef4444" />
              <Bar dataKey="pending" fill="#eab308" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Approved</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Rejected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Pending</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
              <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(activity.severity).split(' ')[1]}`}></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">by {activity.user}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Reports</h3>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary">Export Device Usage</button>
          <button className="btn-secondary">Export Permission Logs</button>
          <button className="btn-secondary">Export Security Report</button>
          <button className="btn-secondary">Export Activity Log</button>
        </div>
      </div>
    </div>
  )
}
