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
CREATE POLICY "Service role can access all profiles" ON user_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Create a user profile for the demo user if it doesn't exist
INSERT INTO user_profiles (
    id, 
    full_name, 
    role, 
    organization_id, 
    permissions
) 
SELECT 
    u.id,
    'Demo Admin',
    'superadmin',
    (SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1),
    ARRAY['system:full_access', 'organization:manage', 'user:manage', 'device:full_control', 'remote:full_access', 'permission:approve_all']
FROM auth.users u
WHERE u.email = 'admin@example.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'superadmin',
    permissions = ARRAY['system:full_access', 'organization:manage', 'user:manage', 'device:full_control', 'remote:full_access', 'permission:approve_all'];
