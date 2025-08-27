import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug environment variables
console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  url: supabaseUrl?.substring(0, 30) + '...',
  key: supabaseKey?.substring(0, 30) + '...'
})

// Only create client if we have valid environment variables
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    getSession()

    // Listen for auth changes only if supabase is available
    let subscription = null
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state change:', event, session?.user?.email)
          if (event === 'SIGNED_IN' && session) {
            await handleSignIn(session)
          } else if (event === 'SIGNED_OUT') {
            handleSignOut()
          } else if (event === 'TOKEN_REFRESHED' && session) {
            // Handle token refresh to maintain session
            await handleSignIn(session)
          }
        }
      )
      subscription = data
    }

    return () => subscription?.unsubscribe()
  }, [])

  const getSession = async () => {
    try {
      if (!supabase) {
        console.log('No Supabase client available - environment variables missing')
        setLoading(false)
        return
      }
      
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      
      if (session) {
        console.log('Found existing session for:', session.user.email)
        await handleSignIn(session)
      } else {
        console.log('No active session found')
        // Only redirect to login if we're not already on login page and not on public pages
        if (router.pathname !== '/login' && !isPublicRoute(router.pathname)) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Error getting session:', error)
      // On session error, redirect to login unless already there
      if (router.pathname !== '/login') {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const isPublicRoute = (pathname) => {
    const publicRoutes = ['/login', '/signup', '/forgot-password']
    return publicRoutes.includes(pathname)
  }

  const handleSignIn = async (session) => {
    try {
      if (!supabase) {
        console.warn('Supabase client not available')
        return
      }
      
      // Get user profile with role and permissions
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          organizations (
            id,
            name
          )
        `)
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        // If profile doesn't exist, create a basic one
        if (error.code === 'PGRST116') {
          await createUserProfile(session.user)
          return
        }
        throw error
      }

      const userData = {
        id: session.user.id,
        email: session.user.email,
        name: profile.full_name || session.user.email.split('@')[0],
        role: profile.role || 'user',
        permissions: profile.permissions || [],
        organization: profile.organizations,
        avatar: profile.avatar_url,
        lastLoginAt: new Date().toISOString()
      }

      setUser(userData)
      console.log('User signed in:', userData.email, 'Role:', userData.role)
      
      // Update last login time
      await updateLastLogin(userData.id)
      
      // Redirect based on role only if coming from login page
      if (router.pathname === '/login') {
        const redirectPath = getRedirectPath(userData.role)
        router.push(redirectPath)
      }
    } catch (error) {
      console.error('Error handling sign in:', error)
      toast.error('Failed to load user profile')
      // Don't sign out on profile error, just show error
    }
  }

  const createUserProfile = async (user) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.email.split('@')[0],
          role: 'user',
          permissions: [],
          created_at: new Date().toISOString()
        })

      if (error) throw error
      
      // Retry handleSignIn after creating profile
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await handleSignIn(session)
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
      toast.error('Failed to create user profile')
    }
  }

  const updateLastLogin = async (userId) => {
    try {
      await supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId)
    } catch (error) {
      console.error('Error updating last login:', error)
    }
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

  const handleSignOut = () => {
    setUser(null)
    router.push('/login')
  }

  const signIn = async (email, password) => {
    try {
      if (!supabase) {
        toast.error('Authentication service not available')
        return { success: false, error: 'Service unavailable' }
      }
      
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Session will be handled by onAuthStateChange
      toast.success('Signed in successfully')
      return { success: true, user: data.user }
    } catch (error) {
      console.error('Sign in error:', error)
      const errorMessage = getAuthErrorMessage(error.message)
      toast.error(errorMessage)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const getAuthErrorMessage = (errorMessage) => {
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Invalid email or password'
    }
    if (errorMessage.includes('Email not confirmed')) {
      return 'Please check your email and confirm your account'
    }
    if (errorMessage.includes('Too many requests')) {
      return 'Too many login attempts. Please try again later'
    }
    return errorMessage || 'Failed to sign in'
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      if (!supabase) {
        handleSignOut()
        return
      }
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear user state and redirect
      handleSignOut()
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
      // Force sign out even if API call fails
      handleSignOut()
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!supabase) {
        toast.error('Database service not available')
        return { success: false, error: 'Service unavailable' }
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      setUser(prev => ({ ...prev, ...updates }))
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('Failed to update profile')
      return { success: false, error: error.message }
    }
  }

  const hasPermission = (permission) => {
    if (!user) return false
    if (user.role === 'superadmin') return true
    return user.permissions?.includes(permission) || false
  }

  const canAccessDevice = (deviceId) => {
    if (!user) return false
    if (user.role === 'superadmin') return true
    
    // Organization admins can access devices in their organization
    if (user.role === 'org_admin') {
      // This would need to be implemented based on device-organization relationships
      return true
    }
    
    return false
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
    updateProfile,
    hasPermission,
    canAccessDevice,
    supabase
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
