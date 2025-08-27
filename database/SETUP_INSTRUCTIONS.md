# Database Setup Instructions

## Quick Fix for UUID Error

The error `operator does not exist: uuid = character varying` is now fixed in the updated schema.

## Setup Steps

### 1. Use the Fixed Schema
Use `supabase-schema-fixed.sql` instead of the original schema file.

### 2. Run in Supabase SQL Editor
1. Go to your Supabase project: https://ddhywultuloiehvktavg.supabase.co
2. Navigate to SQL Editor
3. Copy the entire contents of `supabase-schema-fixed.sql`
4. Execute the schema

### 3. Create Your Admin User
After running the schema, create your first admin user:

```sql
-- Replace 'your-email@example.com' with your actual email
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

### 4. Environment Variables
Update your `.env` files with your Supabase credentials:

**Admin Panel (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://ddhywultuloiehvktavg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaHl3dWx0dWxvaWVodmt0YXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODA3NTUsImV4cCI6MjA3MTg1Njc1NX0.CrxPXaylvtlHNDgHtyyPU-qmURZ3QfuOYMrHLEt4rn4
NEXT_PUBLIC_SOCKET_URL=ws://localhost:3001
```

**API Server (.env):**
```env
SUPABASE_URL=https://ddhywultuloiehvktavg.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaHl3dWx0dWxvaWVodmt0YXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODA3NTUsImV4cCI6MjA3MTg1Njc1NX0.CrxPXaylvtlHNDgHtyyPU-qmURZ3QfuOYMrHLEt4rn4
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 5. Test the Setup
Run these commands to test:

```bash
# Install API server dependencies
cd api-server
npm install
npm run dev

# Install admin panel dependencies (new terminal)
cd admin-panel
npm install
npm run dev

# Install desktop client dependencies (new terminal)
cd desktop-client
npm install
npm start
```

## What Was Fixed

The original schema had UUID/string type mismatches in the RLS policies. The fixed version:

1. ✅ Proper UUID type handling in all policies
2. ✅ Simplified policy structure for better performance
3. ✅ Added helper functions for role checking
4. ✅ Better indexing for free tier optimization
5. ✅ Fixed foreign key references

## Verification

After setup, you should be able to:
- ✅ Create users without UUID errors
- ✅ Login to the admin panel
- ✅ Register desktop clients
- ✅ Create permission requests
- ✅ View activity logs

The database is now ready for production use on Supabase free tier!
