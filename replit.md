# Enhanced BonusHunter App

## Project Overview
A comprehensive bonus hunting platform for slot machine enthusiasts and streamers with real-time tracking, admin authentication, gameplay functionality, and OBS integration. Built with modern React + PostgreSQL architecture.

## Key Features
- **Admin Authentication**: Secure API key-based login/logout system with session management
- **Real-time Hunt Tracking**: Live bonus hunt progress with payout recording
- **Gameplay Functionality**: "Start Playing" feature with multiplier calculation and win tracking
- **Multi-currency Support**: USD, CAD, AUD with proper formatting
- **OBS Overlay Integration**: Protected admin-only overlays for streaming
- **Comprehensive Slot Database**: 3,376+ slots with images and provider information
- **Public Hunt Sharing**: Shareable links for hunt viewing
- **Dark Theme UI**: Modern card-based design with responsive layout

## Tech Stack
- **Backend**: Node.js + Express + PostgreSQL + Drizzle ORM
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL with comprehensive schema
- **Authentication**: JWT-based admin sessions with Bearer token security

## Project Architecture
```
.
├── server/
│   ├── index.ts           # Express server entry point
│   ├── routes.ts          # API routes with admin protection
│   ├── auth.ts            # Admin authentication middleware
│   ├── storage.ts         # Database storage layer
│   └── db.ts              # PostgreSQL connection
├── client/src/
│   ├── components/        # React components
│   │   ├── admin-login-modal.tsx
│   │   ├── start-playing-button.tsx
│   │   └── navigation.tsx
│   ├── hooks/
│   │   ├── use-admin.ts   # Admin authentication hook
│   │   └── use-hunts.ts   # Hunt data hooks
│   └── pages/             # Application pages
└── shared/
    └── schema.ts          # Drizzle database schema
```

## Database Schema
- **hunts**: Hunt metadata with gameplay state (isPlaying, currentSlotIndex)
- **bonuses**: Bonus entries with payout tracking (isPlayed, winAmount, multiplier)
- **slotDatabase**: 3,376+ slots with images and provider data
- **adminSessions**: Secure session management for admin users
- **meta**: Key-value store for application state

## User Preferences
- Dark theme with modern card-based UI
- Currency formatting using Intl API
- Real-time progress tracking
- OBS integration for streaming
- Simple file-based admin key management using admin-keys.txt format "DisplayName - KeyValue"

## Key Features Available to All Users
- **Hunt Management**: Create, edit, and delete bonus hunts
- **Gameplay Control**: Start playing sessions and record payouts
- **Payout Recording**: Click bonuses to input win amounts with automatic multiplier calculation
- **OBS Overlay Access**: Streaming overlay URLs accessible to all
- **Edit Functionality**: Edit bet amounts and hunt details without restrictions

## Recent Changes
- **Multi-Admin Platform Complete**: Successfully implemented hunt isolation where admins see only their hunts in main view, while Live Hunts shows everyone's hunts with admin names (Aug 2025)
- **Live Hunts Readability**: Enhanced text contrast and admin name display for better readability in live hunt views (Aug 2025)
- **Database Cleanup**: Cleared all existing bonus hunts to start fresh with proper admin isolation system (Aug 2025)
- **Admin Key Management Working**: GambiZard admin (GZ-239-2932-92302) can successfully access admin key management functionality (Aug 2025)
- **Authentication System Fixed**: Resolved database schema issues with admin_sessions table and API request structure (Aug 2025)
- **Hardcoded Admin Keys Removed**: Cleaned up login modal by removing demo admin keys list as requested (Aug 2025)
- **File-based Admin Key Management**: Created admin-keys.txt for easy admin key addition with simple format "DisplayName - KeyValue" (Aug 2025)
- **Auto-sync System**: Added adminKeyLoader.ts to automatically sync text file keys with database on server startup (Aug 2025)
- **Multi-admin Platform**: Complete separation of admin logins with isolated hunts while maintaining unified live hunts view (Aug 2025)
- **Admin Keys Management**: Full CRUD functionality for admin keys via AdminKeys page and API routes (Aug 2025)
- **Database Migration**: Migrated from SQLite to PostgreSQL for enhanced performance (Jan 2025)
- **Admin Authentication Removal**: Removed admin authentication system in favor of existing login system (Aug 2025)
- **Public API Access**: Made all functionality accessible without admin requirements (Aug 2025)
- **UI Enhancement**: Removed total cost display from hunt page and OBS view as requested (Aug 2025)
- **Live OBS Overlay**: Added new scrolling bonuses overlay with images and next bonus highlighting (Aug 2025)
- **Hunt Status Management**: Implemented automatic status changes - "collecting" → "playing" → "completed" (Aug 2025)
- **Payout Recording**: Enhanced with total payout display and real-time updates (Aug 2025)
- **Bug Fixes**: Fixed slot image display by correcting CSV field mapping from "image" to "imageUrl" (Aug 2025)
- **Button Functionality**: All buttons now have proper URL/API functionality without admin restrictions (Aug 2025)
- **Gameplay Functionality**: Added "Start Playing" with payout recording and multiplier calculation
- **Slot Database**: Imported 3,376 slots with complete metadata and real image URLs
- **Backwards Compatibility**: Admin routes still available for legacy support

## Environment Variables
- `ADMIN_KEY`: Required for admin authentication
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: JWT session signing key