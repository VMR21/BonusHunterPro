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

## Admin Features (API Key Protected)
- **Hunt Management**: Create, edit, and delete bonus hunts
- **Gameplay Control**: Start playing sessions and record payouts
- **Payout Recording**: Click bonuses to input win amounts with automatic multiplier calculation
- **OBS Overlay Access**: Protected streaming overlay URLs
- **Session Management**: Secure login/logout with 24-hour session expiry

## Recent Changes
- **Database Migration**: Migrated from SQLite to PostgreSQL for enhanced performance (Jan 2025)
- **Admin Authentication**: Implemented comprehensive JWT-based session system
- **Gameplay Functionality**: Added "Start Playing" with payout recording and multiplier calculation
- **Security Enhancement**: All admin routes now require authentication
- **Slot Database**: Imported 3,376 slots with complete metadata
- **UI Improvements**: Updated navigation with admin login/logout controls

## Environment Variables
- `ADMIN_KEY`: Required for admin authentication
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: JWT session signing key