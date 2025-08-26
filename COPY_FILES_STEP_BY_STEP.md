# Step-by-Step File Copying Guide

## Phase 1: Core Configuration (Start Here)

Copy these files first - they contain your app's basic setup:

### 1. package.json
```json
{
  "name": "bonushunter-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "tsc && vite build",
    "start": "NODE_ENV=production tsx server/index.ts",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.3",
    "@radix-ui/react-*": "latest",
    "@tanstack/react-query": "^5.59.16",
    "drizzle-orm": "^0.33.0",
    "drizzle-zod": "^0.5.1",
    "express": "^4.21.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "wouter": "^3.3.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.7.9",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "tsx": "^4.19.2"
  }
}
```

### 2. tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"],
      "@assets/*": ["./attached_assets/*"]
    }
  },
  "include": ["client/src", "server", "shared", "attached_assets"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Phase 2: Database & Backend

### 3. shared/schema.ts
This file contains your database structure. Copy the exact content from Replit.

### 4. server/index.ts
Main server file - copy from Replit.

### 5. server/routes.ts
All your API endpoints - copy from Replit.

### 6. server/db.ts
Database connection - copy from Replit.

## Phase 3: Frontend Core

### 7. client/index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BonusHunter App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 8. client/src/main.tsx
React entry point - copy from Replit.

### 9. client/src/App.tsx
Main React app - copy from Replit.

## Phase 4: Key Pages & Components

Copy these in order:

1. `client/src/pages/home.tsx`
2. `client/src/pages/admin.tsx`
3. `client/src/pages/hunt-detail.tsx`
4. `client/src/pages/latest-hunt.tsx`
5. `client/src/pages/live-obs-overlay.tsx` (This is the 4-column OBS overlay)
6. `client/src/components/navigation.tsx`
7. `client/src/components/hunt-card.tsx`

## Phase 5: Data Files

### Essential Data
- `data/slots.csv` - Your 3,376 slot machines database

## Quick Test Setup

After copying the above files:

1. Create `.env` file:
```
DATABASE_URL=your_postgresql_url
ADMIN_KEY=your_admin_key
SESSION_SECRET=your_session_secret
NODE_ENV=development
```

2. Install dependencies:
```bash
npm install
```

3. Set up database:
```bash
npm run db:push
```

4. Start development:
```bash
npm run dev
```

## Missing Files?

If something doesn't work, you might need these additional files:
- `client/src/hooks/use-admin.ts`
- `client/src/hooks/use-hunts.ts`
- `client/src/lib/queryClient.ts`
- `client/src/index.css`
- `vite.config.ts`
- `tailwind.config.ts`

## Alternative: Use Replit's GitHub Integration

1. In Replit, look for the **Version Control** tab in the left sidebar
2. Connect to GitHub and create a new repository
3. Push your code to GitHub
4. Clone the GitHub repo to your local machine

This gets all files at once without the copy-paste work!

Would you like me to guide you through the GitHub method or help you with the manual copying?