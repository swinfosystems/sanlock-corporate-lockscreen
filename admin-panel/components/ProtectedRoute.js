import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, requiredRole = null, requiredPermission = null }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If no user, redirect to login
      if (!user) {
        router.push('/login')
        return
      }

      // Check role requirement
      if (requiredRole && user.role !== requiredRole && user.role !== 'superadmin') {
        // Redirect to appropriate dashboard based on user role
        const redirectPath = getRedirectPath(user.role)
        router.push(redirectPath)
        return
      }

      // Check permission requirement
      if (requiredPermission && !hasPermission(user, requiredPermission)) {
        // Redirect to appropriate dashboard based on user role
        const redirectPath = getRedirectPath(user.role)
        router.push(redirectPath)
        return
      }
    }
  }, [user, loading, router, requiredRole, requiredPermission])

  const hasPermission = (user, permission) => {
    if (!user) return false
    if (user.role === 'superadmin') return true
    return user.permissions?.includes(permission) || false
  }

  const getRedirectPath = (role) => {
    switch (role) {
      case 'superadmin':
        return '/'
      case 'org_admin':
        return '/organization'
      default:
        return '/user-dashboard'
    }
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-dark-300">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children until authentication is verified
  if (!user) {
    return null
  }

  // Check role and permission requirements
  if (requiredRole && user.role !== requiredRole && user.role !== 'superadmin') {
    return null
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return null
  }

  return children
}
