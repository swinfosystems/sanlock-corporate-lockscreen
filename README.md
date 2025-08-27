# SanLock v1.0.0

**Corporate Lockscreen Solution by Sanket Wanve Technologies**

A comprehensive lockscreen solution with corporate structure, remote access, and role-based permissions.

**Developer:** Sanket Wanve Technologies (swt.42web.io)  
**Version:** 1.0.0  
**Theme:** Dark UI with Orange Accents

## Features

- **Multi-tier Access Control**: Superadmins, Organizations, and Regular Users
- **Remote Desktop Control**: Full control capabilities for authorized personnel
- **Permission Request System**: Users can request elevated access from their organization
- **Web Admin Panel**: Centralized management interface
- **Real-time Monitoring**: Live desktop status and control

## Architecture

### Components
1. **Desktop Client** (Windows) - Lockscreen application with remote control capabilities
2. **Web Admin Panel** - Management interface hosted on Cloudflare Pages
3. **API Backend** - RESTful API for communication between components
4. **Database** - Supabase for user management, permissions, and logs

### User Roles
- **Superadmin**: Full system access, can control any desktop
- **Organization Admin**: Manage users within their organization
- **Regular User**: Minimal access, can request permissions

## Tech Stack

- **Frontend**: Next.js with React (Admin Panel)
- **Backend**: Node.js/Express (API)
- **Desktop**: Electron.js (Windows Application)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Cloudflare Pages
- **Authentication**: Supabase Auth
- **Theme**: Dark UI with Orange (#F59E0B) Accents
- **Real-time**: Socket.io for live communication

## Setup Instructions

1. Clone the repository
2. Install dependencies for each component
3. Configure Supabase connection
4. Deploy admin panel to Cloudflare Pages
5. Install desktop client on target machines

## Security Features

- End-to-end encryption for remote sessions
- JWT-based authentication
- Role-based access control (RBAC)
- Audit logging for all actions
- Session timeout and automatic lockout
