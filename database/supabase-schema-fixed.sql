-- SanLock Database Schema for Supabase FREE TIER (FIXED VERSION)
-- Optimized for 500MB storage limit and 50K monthly active users

-- Enable necessary extensions (available on free tier)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table (lightweight for free tier)
CREATE TABLE organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(100),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends Supabase auth.users - free)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('superadmin', 'org_admin', 'user')),
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devices table (optimized storage)
CREATE TABLE devices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL UNIQUE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    hostname VARCHAR(100) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'locked')),
    last_seen TIMESTAMP WITH TIME ZONE,
    current_user_id UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permission requests (lightweight)
CREATE TABLE permission_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES user_profiles(id),
    request_type VARCHAR(30) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Activity logs (with automatic cleanup for storage optimization)
CREATE TABLE activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remote sessions (minimal data for free tier)
CREATE TABLE remote_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance (free tier allows basic indexes)
CREATE INDEX idx_user_profiles_org ON user_profiles(organization_id);
CREATE INDEX idx_devices_org ON devices(organization_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_permission_requests_status ON permission_requests(status);
CREATE INDEX idx_permission_requests_device ON permission_requests(device_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- Row Level Security (RLS) - Essential for free tier security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE remote_sessions ENABLE ROW LEVEL SECURITY;

-- FIXED RLS Policies with proper type casting
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Superadmins can view all profiles
CREATE POLICY "Superadmins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role = 'superadmin'
        )
    );

-- Organization members can view org devices
CREATE POLICY "Org members can view devices" ON devices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.organization_id = devices.organization_id
        )
    );

-- Superadmins can view all devices
CREATE POLICY "Superadmins can view all devices" ON devices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role = 'superadmin'
        )
    );

-- Admins can manage devices in their organization
CREATE POLICY "Admins can manage org devices" ON devices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role IN ('superadmin', 'org_admin')
            AND (up.role = 'superadmin' OR up.organization_id = devices.organization_id)
        )
    );

-- Permission request policies (FIXED)
CREATE POLICY "Users can create permission requests" ON permission_requests
    FOR INSERT WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Users can view own requests" ON permission_requests
    FOR SELECT USING (requested_by = auth.uid());

CREATE POLICY "Admins can view org requests" ON permission_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN devices d ON d.id = permission_requests.device_id
            WHERE up.id = auth.uid()
            AND up.role IN ('superadmin', 'org_admin')
            AND (up.role = 'superadmin' OR up.organization_id = d.organization_id)
        )
    );

CREATE POLICY "Admins can manage org requests" ON permission_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN devices d ON d.id = permission_requests.device_id
            WHERE up.id = auth.uid()
            AND up.role IN ('superadmin', 'org_admin')
            AND (up.role = 'superadmin' OR up.organization_id = d.organization_id)
        )
    );

-- Activity logs policies
CREATE POLICY "Users can view org activity" ON activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND (up.role = 'superadmin' OR up.organization_id = activity_logs.organization_id)
        )
    );

-- Remote sessions policies
CREATE POLICY "Admins can view sessions" ON remote_sessions
    FOR SELECT USING (
        admin_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role = 'superadmin'
        )
    );

-- Insert default organization for free tier setup
INSERT INTO organizations (name, domain) VALUES 
('Default Organization', 'localhost');

-- Function to clean old logs (storage optimization for free tier)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    -- Keep only last 30 days of logs to save storage
    DELETE FROM activity_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Clean expired permission requests
    DELETE FROM permission_requests 
    WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role (FIXED)
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM user_profiles
    WHERE id = user_uuid;
    
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = user_uuid
        AND role IN ('superadmin', 'org_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity (optimized for free tier)
CREATE OR REPLACE FUNCTION log_activity(
    p_organization_id UUID,
    p_action VARCHAR(50),
    p_device_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO activity_logs (
        organization_id,
        device_id,
        user_id,
        admin_id,
        action,
        details
    ) VALUES (
        p_organization_id,
        p_device_id,
        p_user_id,
        p_admin_id,
        p_action,
        p_details
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a default superadmin user (you'll need to update this with your actual user ID)
-- Run this after creating your first user through Supabase Auth
/*
INSERT INTO user_profiles (id, full_name, role, organization_id, permissions)
SELECT 
    auth.users.id,
    'System Administrator',
    'superadmin',
    (SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1),
    ARRAY['system:full_access', 'organization:manage', 'user:manage', 'device:full_control', 'remote:full_access', 'permission:approve_all']
FROM auth.users 
WHERE email = 'your-admin-email@example.com'  -- Replace with your email
ON CONFLICT (id) DO NOTHING;
*/
