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
          if (event === 'SIGNED_IN') {
            await handleSignIn(session)
          } else if (event === 'SIGNED_OUT') {
            handleSignOut()
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
        await handleSignIn(session)
      } else {
        console.log('No active session found')
      }
    } catch (error) {
      console.error('Error getting session:', error)
    } finally {
      setLoading(false)
    }
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
            name,
            type
          ),
          user_roles (
            role,
            permissions
          )
        `)
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      const userData = {
        id: session.user.id,
        email: session.user.email,
        name: profile.full_name,
        role: profile.user_roles?.role || 'user',
        permissions: profile.user_roles?.permissions || [],
        organization: profile.organizations,
        avatar: profile.avatar_url
      }

      setUser(userData)
      
      // Redirect based on role
      if (router.pathname === '/login') {
        if (userData.role === 'superadmin') {
          router.push('/')
        } else if (userData.role === 'org_admin') {
          router.push('/organization')
        } else {
          router.push('/user-dashboard')
        }
      }
    } catch (error) {
      console.error('Error handling sign in:', error)
      toast.error('Failed to load user profile')
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

      toast.success('Signed in successfully')
      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error(error.message || 'Failed to sign in')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      if (!supabase) {
        handleSignOut()
        return
      }
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
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
