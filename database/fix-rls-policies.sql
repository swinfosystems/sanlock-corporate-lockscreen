-- Fix RLS policies to prevent infinite recursion
-- Run this in Supabase SQL Editor

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow service role to access all profiles (for admin operations)
DROP POLICY IF EXISTS "Service role can access all profiles" ON user_profiles;
CREATE POLICY "Service role can access all profiles" ON user_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Fix devices table foreign key constraint
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_current_user_id_fkey;
ALTER TABLE devices ADD CONSTRAINT devices_current_user_id_fkey 
    FOREIGN KEY (current_user_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Add missing last_login_at column if it doesn't exist
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Insert demo superadmin user profile
INSERT INTO user_profiles (
    id, 
    full_name, 
    role, 
    permissions, 
    organization_id,
    created_at,
    last_login_at
) VALUES (
    'ee8037a9-b417-4862-8c4d-e6a4e0337230',
    'Sanket Wanve',
    'superadmin',
    '{"device-control", "user-management", "organization-management", "system-admin"}',
    NULL,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    last_login_at = NOW();
