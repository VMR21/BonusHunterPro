# Essential Files for BonusHunter Deployment

Since downloading all files at once isn't working, here are the **essential files** you need to manually copy to deploy your BonusHunter app:

## Core Files to Copy (Priority Order)

### 1. Configuration Files (Copy First)
- `package.json` - Dependencies and scripts
- `package-lock.json` - Exact dependency versions
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Styling configuration
- `drizzle.config.ts` - Database configuration
- `postcss.config.js` - CSS processing

### 2. Server Files (Backend)
- `server/index.ts` - Main server entry point
- `server/routes.ts` - API routes
- `server/auth.ts` - Authentication middleware
- `server/storage.ts` - Database storage layer
- `server/db.ts` - Database connection

### 3. Shared Files (Types & Schema)
- `shared/schema.ts` - Database schema and types

### 4. Client Files (Frontend)
Create these folder structures and copy the files:

#### Main App Structure
- `client/src/App.tsx` - Main React app
- `client/src/main.tsx` - React entry point
- `client/index.html` - HTML template

#### Components
- `client/src/components/ui/` (all files) - UI components
- `client/src/components/navigation.tsx` - Navigation bar
- `client/src/components/hunt-card.tsx` - Hunt display cards
- `client/src/components/admin-login-modal.tsx` - Login modal
- `client/src/components/start-playing-button.tsx` - Game controls

#### Pages
- `client/src/pages/home.tsx` - Homepage
- `client/src/pages/admin.tsx` - Admin panel
- `client/src/pages/hunt-detail.tsx` - Hunt details
- `client/src/pages/latest-hunt.tsx` - Latest hunt view
- `client/src/pages/obs-overlay.tsx` - Basic OBS overlay
- `client/src/pages/live-obs-overlay.tsx` - Live OBS overlay with 4-column layout

#### Hooks & Utils
- `client/src/hooks/use-admin.ts` - Admin authentication
- `client/src/hooks/use-hunts.ts` - Hunt data management
- `client/src/hooks/use-bonuses.ts` - Bonus data management
- `client/src/hooks/use-toast.ts` - Toast notifications
- `client/src/lib/queryClient.ts` - API client setup
- `client/src/lib/utils.ts` - Utility functions

#### Styling
- `client/src/index.css` - Global styles and Tailwind

### 5. Data Files
- `data/slots.csv` - Slot machine database (3,376 slots)

## How to Copy Files Manually

### Method 1: Individual File Download
1. Click on each file in the Replit file explorer
2. Copy the content (Ctrl+A, Ctrl+C)
3. Create the same file on your local machine
4. Paste the content

### Method 2: Copy-Paste via Text
1. Open each file in Replit
2. Select all content and copy
3. Create new files locally with the same structure
4. Paste content into each file

## Minimum Working Version

If you want the absolute minimum to get started, you only need:

1. **Configuration**: `package.json`, `tsconfig.json`, `vite.config.ts`
2. **Server**: `server/index.ts`, `server/routes.ts`, `server/db.ts`
3. **Schema**: `shared/schema.ts`
4. **Frontend**: `client/src/App.tsx`, `client/src/main.tsx`, `client/index.html`
5. **Styles**: `client/src/index.css`
6. **Data**: `data/slots.csv`

This will give you a basic working version that you can then enhance.

## Alternative: GitHub Method

1. **Push to GitHub** from Replit:
   - Use the built-in Git integration
   - Create a new GitHub repository
   - Push your code to GitHub

2. **Clone locally**:
   - Clone the repository to your computer
   - This gets all files at once

Would you like me to guide you through either the manual copying method or the GitHub method?