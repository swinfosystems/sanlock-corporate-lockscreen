# SanLock Free Tier Setup Guide

**100% Free Implementation - No Costs Involved**

This guide shows how to set up SanLock using only free services and tiers.

## Free Services Used

### 🆓 Supabase (Free Tier)
- **Database**: PostgreSQL with 500MB storage
- **Authentication**: Up to 50,000 monthly active users
- **API**: Unlimited API requests
- **Real-time**: Included
- **Cost**: $0/month

### 🆓 Cloudflare Pages (Free Tier)
- **Hosting**: Unlimited sites
- **Builds**: 500 builds per month
- **Bandwidth**: Unlimited
- **Custom domains**: Included
- **Cost**: $0/month

### 🆓 GitHub (Free Tier)
- **Repositories**: Unlimited public repos
- **Actions**: 2,000 minutes/month
- **Storage**: 500MB packages
- **Cost**: $0/month

## Setup Instructions

### 1. Supabase Setup (FREE)

1. **Create Account**: Go to [supabase.com](https://supabase.com) and sign up
2. **Create Project**: 
   - Project name: `sanlock-db`
   - Database password: Generate strong password
   - Region: Choose closest to your users
3. **Run Schema**: 
   - Go to SQL Editor
   - Copy contents from `database/supabase-schema-fixed.sql`
   - Execute the schema
4. **Get Credentials**:
   - Project URL: `https://your-project.supabase.co`
   - Anon Key: From Settings > API

### 2. Environment Variables

Create `.env.local` in admin-panel:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ddhywultuloiehvktavg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaHl3dWx0dWxvaWVodmt0YXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODA3NTUsImV4cCI6MjA3MTg1Njc1NX0.CrxPXaylvtlHNDgHtyyPU-qmURZ3QfuOYMrHLEt4rn4
NEXT_PUBLIC_SOCKET_URL=ws://localhost:3001
```

### 3. GitHub Repository (FREE)

1. Create new repository: `sanlock-corporate-lockscreen`
2. Push your code:
```bash
git init
git add .
git commit -m "Initial SanLock v1.0.0 setup"
git remote add origin https://github.com/yourusername/sanlock-corporate-lockscreen.git
git push -u origin main
```

### 4. Cloudflare Pages Deployment (FREE)

1. **Connect GitHub**: 
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Pages > Create a project > Connect to Git
   - Select your repository

2. **Build Settings**:
   - Framework preset: `Next.js`
   - Build command: `npm run build && npm run export`
   - Build output directory: `out`
   - Root directory: `admin-panel`

3. **Environment Variables**:
   - Add your Supabase URL and key
   - Add any other required variables

## Free Tier Limitations & Optimizations

### Supabase Free Tier Limits
- **Database**: 500MB storage (optimized schema)
- **Auth Users**: 50,000 monthly active users
- **API Requests**: Unlimited
- **Bandwidth**: 2GB included

### Storage Optimization
- Automatic log cleanup after 30 days
- Compressed JSON for device settings
- No file storage (screenshots handled in memory)
- Minimal indexes for performance

### Cloudflare Pages Limits
- **Sites**: Unlimited
- **Builds**: 500 per month (sufficient for development)
- **Functions**: 100,000 requests/day
- **Bandwidth**: Unlimited

## Development Workflow (FREE)

### Local Development
```bash
# Admin Panel
cd admin-panel
npm install
npm run dev

# Desktop Client
cd desktop-client
npm install
npm start

# API Server (when created)
cd api-server
npm install
npm run dev
```

### Deployment Process
1. **Push to GitHub**: Automatic with git
2. **Cloudflare Build**: Triggers automatically on push
3. **Database Updates**: Manual via Supabase dashboard

## Monitoring & Analytics (FREE)

### Supabase Dashboard
- Real-time database monitoring
- User authentication logs
- API usage statistics
- Performance metrics

### Cloudflare Analytics
- Page views and traffic
- Performance insights
- Error tracking
- Geographic distribution

## Scaling Within Free Limits

### Database Optimization
- Regular cleanup of old logs
- Efficient indexing strategy
- Compressed data storage
- Connection pooling

### Performance Tips
- Use Supabase Edge Functions for heavy operations
- Implement client-side caching
- Optimize database queries
- Use CDN for static assets

## Cost Monitoring

### Always Free Components
- ✅ Supabase database (500MB)
- ✅ Supabase authentication (50K users)
- ✅ Cloudflare Pages hosting
- ✅ GitHub repository
- ✅ Basic SSL certificates

### Potential Upgrade Triggers
- Database > 500MB (can optimize first)
- > 50K monthly active users
- > 500 builds/month on Cloudflare
- Need for advanced features

## Backup Strategy (FREE)

### Database Backups
- Weekly manual exports via Supabase dashboard
- Store backups in GitHub repository
- Use Supabase's built-in backup system

### Code Backups
- Git version control
- GitHub repository
- Local development copies

## Support & Documentation

### Free Resources
- Supabase documentation and community
- Cloudflare Pages documentation
- GitHub community support
- Stack Overflow for technical issues

---

**Total Monthly Cost: $0.00**

This setup can handle:
- Up to 50,000 users
- Hundreds of devices
- Thousands of daily operations
- Professional-grade security
- Real-time functionality

*Perfect for small to medium organizations without any hosting costs!*
