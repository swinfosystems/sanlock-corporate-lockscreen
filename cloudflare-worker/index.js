// SanLock API - Cloudflare Worker Version
// Simplified without WebSocket support

import { createClient } from '@supabase/supabase-js'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }
    
    // Initialize Supabase
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
    
    try {
      // Health check
      if (path === '/health') {
        return Response.json({ status: 'ok', service: 'SanLock API' }, { headers: corsHeaders })
      }
      
      // Get devices
      if (path === '/api/devices' && request.method === 'GET') {
        const { data, error } = await supabase
          .from('devices')
          .select('*')
        
        if (error) throw error
        return Response.json(data, { headers: corsHeaders })
      }
      
      // Lock device
      if (path.startsWith('/api/devices/') && path.endsWith('/lock') && request.method === 'POST') {
        const deviceId = path.split('/')[3]
        
        const { data, error } = await supabase
          .from('devices')
          .update({ status: 'locked', locked_at: new Date().toISOString() })
          .eq('id', deviceId)
          .select()
        
        if (error) throw error
        return Response.json({ success: true, device: data[0] }, { headers: corsHeaders })
      }
      
      // Unlock device
      if (path.startsWith('/api/devices/') && path.endsWith('/unlock') && request.method === 'POST') {
        const deviceId = path.split('/')[3]
        
        const { data, error } = await supabase
          .from('devices')
          .update({ status: 'unlocked', unlocked_at: new Date().toISOString() })
          .eq('id', deviceId)
          .select()
        
        if (error) throw error
        return Response.json({ success: true, device: data[0] }, { headers: corsHeaders })
      }
      
      // Get permission requests
      if (path === '/api/permission-requests' && request.method === 'GET') {
        const { data, error } = await supabase
          .from('permission_requests')
          .select(`
            *,
            user_profiles(full_name, email),
            devices(name)
          `)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return Response.json(data, { headers: corsHeaders })
      }
      
      // Approve permission request
      if (path.startsWith('/api/permission-requests/') && path.endsWith('/approve') && request.method === 'POST') {
        const requestId = path.split('/')[3]
        
        const { data, error } = await supabase
          .from('permission_requests')
          .update({ 
            status: 'approved', 
            approved_at: new Date().toISOString(),
            approved_by: 'API User' 
          })
          .eq('id', requestId)
          .select()
        
        if (error) throw error
        return Response.json({ success: true, request: data[0] }, { headers: corsHeaders })
      }
      
      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders })
      
    } catch (error) {
      return Response.json(
        { error: error.message }, 
        { status: 500, headers: corsHeaders }
      )
    }
  }
}
