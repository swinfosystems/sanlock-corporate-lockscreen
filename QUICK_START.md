# SanLock Quick Start Guide

**Everything is now configured and ready to run!**

## 🚀 Ready-to-Run Setup

All environment files are configured with your Supabase credentials. Just follow these steps:

### 1. Database Setup (5 minutes)
1. Go to: https://ddhywultuloiehvktavg.supabase.co
2. Navigate to **SQL Editor**
3. Copy entire contents of `database/supabase-schema-fixed.sql`
4. Execute the schema
5. Create your admin user:
```sql
-- Replace with your email
INSERT INTO user_profiles (id, full_name, role, organization_id, permissions)
SELECT 
    auth.users.id,
    'System Administrator',
    'superadmin',
    (SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1),
    ARRAY['system:full_access', 'organization:manage', 'user:manage', 'device:full_control', 'remote:full_access', 'permission:approve_all']
FROM auth.users 
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO NOTHING;
```

### 2. Start All Services (3 commands)

**Terminal 1 - API Server:**
```bash
cd api-server
npm install
npm run dev
```

**Terminal 2 - Admin Panel:**
```bash
cd admin-panel
npm install
npm run dev
```

**Terminal 3 - Desktop Client:**
```bash
cd desktop-client
npm install
npm start
```

### 3. Access Points
- **Admin Panel**: http://localhost:3000
- **API Server**: http://localhost:3001/health
- **Desktop Client**: Runs as fullscreen app

## ✅ Pre-Configured Files

All environment files are ready:
- ✅ `admin-panel/.env.local` - Supabase credentials
- ✅ `api-server/.env` - API server config
- ✅ `desktop-client/.env` - Desktop client config

## 🔧 What's Working

- ✅ **Database**: Optimized for Supabase free tier
- ✅ **Authentication**: Role-based access control
- ✅ **Real-time**: Socket.io for live communication
- ✅ **Remote Control**: Lock/unlock devices
- ✅ **Permissions**: Request/approval system
- ✅ **Dark Theme**: Orange accents as requested

## 💰 Cost: $0.00/month

Running on 100% free services:
- Supabase Free Tier (50K users, 500MB DB)
- Local development servers
- No paid subscriptions needed

## 🎯 First Steps After Setup

1. **Create account** in admin panel
2. **Install desktop client** on target machines
3. **Test remote lock/unlock** functionality
4. **Create organization users** as needed

Everything is configured and ready to work with your Supabase instance!
