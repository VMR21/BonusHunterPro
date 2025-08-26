# Improved BonusHunter App

## Project Overview
An enhanced bonus hunting platform for slot machine enthusiasts and streamers with real-time tracking, sharing capabilities, and OBS integration. This is an improved version of bonushunter.app with better UI, performance, and features.

## Key Features
- Real-time bonus hunt tracking
- Multi-currency support (USD, CAD, AUD)
- OBS overlay integration (simple and advanced v2)
- Comprehensive slot database (3000+ slots)
- Admin panel for hunt management
- Public hunt sharing and viewing
- Dark theme UI with modern styling
- Live statistics and progress tracking

## Tech Stack
- Backend: Node.js + Express + better-sqlite3
- Frontend: Vanilla HTML/CSS/JS
- Database: SQLite
- Authentication: API key protected admin routes

## Project Architecture
```
.
├── server.js              # Express server with API routes
├── data/
│   └── hunts.db           # SQLite database (auto-created)
└── public/
    ├── index.html         # Public hunt list/detail view
    ├── admin.html         # Admin panel (API key gated)
    ├── overlay.html       # Simple OBS overlay
    ├── obs-v2.html        # Advanced OBS overlay
    └── assets/
        ├── styles.css     # Main stylesheet
        ├── common.js      # Shared JavaScript utilities
        └── slots.csv      # Slot database (3000+ entries)
```

## Database Schema
- **hunts**: Hunt metadata with currency support
- **bonuses**: Individual bonus entries per hunt
- **meta**: Key-value store for active hunt tracking

## User Preferences
- Dark theme with modern card-based UI
- Currency formatting using Intl API
- Real-time progress tracking
- OBS integration for streaming

## Recent Changes
- Initial project setup with full BonusHunter functionality
- Multi-currency support implementation
- Advanced OBS overlay matching original design
- Comprehensive slot database integration

## Environment Variables
- `ADMIN_KEY`: Required for admin panel access