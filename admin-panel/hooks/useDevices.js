import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export function useDevices() {
  const { user, supabase } = useAuth()
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user && supabase) {
      loadDevices()
    }
  }, [user, supabase])

  const loadDevices = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('devices')
        .select(`
          *,
          organization:organizations(id, name),
          user_profiles!devices_user_id_fkey(id, full_name, email)
        `)

      // Filter based on user role
      if (user.role === 'org_admin') {
        query = query.eq('organization_id', user.organization?.id)
      } else if (user.role === 'user') {
        query = query.eq('user_id', user.id)
      }
      // Superadmins see all devices (no filter)

      const { data, error } = await query.order('last_seen', { ascending: false })

      if (error) throw error

      setDevices(data || [])
    } catch (error) {
      console.error('Error loading devices:', error)
      setError(error.message)
      toast.error('Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  const registerDevice = async (deviceData) => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .insert({
          device_id: deviceData.deviceId,
          hostname: deviceData.hostname,
          platform: deviceData.platform,
          arch: deviceData.arch,
          user_id: deviceData.userId || user.id,
          organization_id: deviceData.organizationId || user.organization?.id,
          status: 'online',
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setDevices(prev => [data, ...prev])
      toast.success('Device registered successfully')
      return { success: true, device: data }
    } catch (error) {
      console.error('Error registering device:', error)
      toast.error('Failed to register device')
      return { success: false, error: error.message }
    }
  }

  const updateDeviceStatus = async (deviceId, status, additionalData = {}) => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .update({
          status,
          last_seen: new Date().toISOString(),
          ...additionalData
        })
        .eq('device_id', deviceId)
        .select()
        .single()

      if (error) throw error

      setDevices(prev => 
        prev.map(device => 
          device.device_id === deviceId 
            ? { ...device, ...data }
            : device
        )
      )

      return { success: true, device: data }
    } catch (error) {
      console.error('Error updating device status:', error)
      toast.error('Failed to update device status')
      return { success: false, error: error.message }
    }
  }

  const deleteDevice = async (deviceId) => {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('device_id', deviceId)

      if (error) throw error

      setDevices(prev => prev.filter(device => device.device_id !== deviceId))
      toast.success('Device removed successfully')
      return { success: true }
    } catch (error) {
      console.error('Error deleting device:', error)
      toast.error('Failed to remove device')
      return { success: false, error: error.message }
    }
  }

  const lockDevice = async (deviceId) => {
    return updateDeviceStatus(deviceId, 'locked')
  }

  const unlockDevice = async (deviceId) => {
    return updateDeviceStatus(deviceId, 'online')
  }

  const getDevicesByOrganization = (organizationId) => {
    return devices.filter(device => device.organization_id === organizationId)
  }

  const getDevicesByUser = (userId) => {
    return devices.filter(device => device.user_id === userId)
  }

  const getOnlineDevices = () => {
    return devices.filter(device => device.status === 'online')
  }

  const getLockedDevices = () => {
    return devices.filter(device => device.status === 'locked')
  }

  return {
    devices,
    loading,
    error,
    loadDevices,
    registerDevice,
    updateDeviceStatus,
    deleteDevice,
    lockDevice,
    unlockDevice,
    getDevicesByOrganization,
    getDevicesByUser,
    getOnlineDevices,
    getLockedDevices
  }
}
