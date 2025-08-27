import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useRouter } from 'next/router'
import { 
  Menu, 
  X, 
  Home, 
  Monitor, 
  Users, 
  Settings, 
  Shield, 
  LogOut,
  Bell,
  Search,
  Activity,
  BarChart3
} from 'lucide-react'

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const { isConnected, permissionRequests } = useSocket()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: router.pathname === '/' },
    { name: 'Devices', href: '/devices', icon: Monitor, current: router.pathname === '/devices' },
    { name: 'Users', href: '/users', icon: Users, current: router.pathname === '/users' },
    { name: 'Permissions', href: '/permissions', icon: Shield, current: router.pathname === '/permissions' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, current: router.pathname === '/analytics' },
    { name: 'Settings', href: '/settings', icon: Settings, current: router.pathname === '/settings' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full sidebar">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent navigation={navigation} user={user} signOut={signOut} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:fixed lg:inset-y-0 lg:z-40">
        <div className="flex flex-col w-72">
          <SidebarContent navigation={navigation} user={user} signOut={signOut} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="header-gradient sticky top-0 z-30 flex-shrink-0 flex h-20 shadow-xl">
          <button
            className="px-4 text-dark-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-6 flex justify-between items-center">
            <div className="flex-1 flex max-w-2xl">
              <div className="w-full flex">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-4">
                    <Search className="h-5 w-5 text-dark-400" />
                  </div>
                  <input
                    className="input-field pl-12 py-3 w-full"
                    placeholder="Search devices, users, permissions..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            
            <div className="ml-6 flex items-center space-x-6">
              {/* Connection status */}
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success-400 shadow-lg shadow-success-400/50 animate-pulse' : 'bg-danger-400'}`} />
                <span className="text-sm font-medium text-dark-200">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-xl text-dark-300 hover:text-primary-400 hover:bg-dark-700/50 transition-all duration-200">
                <Bell className="h-6 w-6" />
                {permissionRequests?.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {permissionRequests.length}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-semibold text-dark-100">{user?.name}</div>
                  <div className="text-xs text-primary-400 capitalize font-medium">{user?.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ navigation, user, signOut }) {
  const router = useRouter()

  return (
    <div className="flex flex-col h-full sidebar">
      {/* Logo */}
      <div className="flex items-center h-20 flex-shrink-0 px-6 border-b border-dark-700/50">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-xl sanlock-brand">SanLock</span>
            <div className="text-xs text-dark-400 font-medium">v1.0.0</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto py-6">
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  item.current
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'text-dark-300 hover:bg-dark-700/50 hover:text-dark-100'
                }`}
              >
                <Icon className={`mr-4 h-5 w-5 ${
                  item.current ? 'text-white' : 'text-dark-400 group-hover:text-dark-200'
                }`} />
                {item.name}
              </button>
            )
          })}
        </nav>

        {/* User info and logout */}
        <div className="flex-shrink-0 border-t border-dark-700/50 p-4 mt-6">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-100 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-primary-400 capitalize font-medium">
                    {user?.role}
                  </p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex-shrink-0 p-2 text-dark-400 hover:text-danger-400 hover:bg-danger-500/10 rounded-xl transition-all duration-200"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
