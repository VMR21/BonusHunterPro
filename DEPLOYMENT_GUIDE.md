# BonusHunter App - Deployment Guide

## Overview
This guide will help you deploy the BonusHunter application to your own website. The app is a full-stack Node.js application with React frontend and PostgreSQL database.

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Web hosting that supports Node.js applications
- Domain name (optional)

## File Structure
Your application contains these key components:
```
bonushunter-app/
├── client/           # React frontend
├── server/           # Express.js backend
├── shared/           # Shared types and schemas
├── package.json      # Dependencies
├── drizzle.config.ts # Database configuration
└── vite.config.ts    # Build configuration
```

## Step 1: Download Your Code
1. From Replit, download all files by:
   - Go to the file explorer
   - Click the three dots menu
   - Select "Download as ZIP"
   - Extract the ZIP file to your local machine

## Step 2: Environment Variables
Create a `.env` file in your project root with:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name

# Admin Authentication
ADMIN_KEY=your_secure_admin_key_here

# Session Security
SESSION_SECRET=your_secure_session_secret_here

# Production Settings
NODE_ENV=production
PORT=3000
```

**Important**: Replace the placeholder values with your actual database credentials and secure keys.

## Step 3: Database Setup

### Option A: Local PostgreSQL
1. Install PostgreSQL on your server
2. Create a new database:
   ```sql
   CREATE DATABASE bonushunter;
   ```
3. Update DATABASE_URL in .env file

### Option B: Cloud Database (Recommended)
Popular options:
- **Neon** (neon.tech) - Free tier available
- **Supabase** (supabase.com) - Free tier available
- **AWS RDS** - Paid service
- **Digital Ocean Managed Database** - Paid service

## Step 4: Install Dependencies
```bash
cd bonushunter-app
npm install
```

## Step 5: Database Migration
Run the database migration to create tables:
```bash
npm run db:push
```

## Step 6: Build the Application
```bash
npm run build
```

## Step 7: Start the Application
```bash
npm start
```

Your app will be available at `http://localhost:3000`

## Step 8: Deploy to Production

### Option A: VPS/Dedicated Server
1. Upload files to your server
2. Install Node.js and PostgreSQL
3. Follow steps 4-7 above
4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server/index.ts --name bonushunter
   pm2 startup
   pm2 save
   ```

### Option B: Platform as a Service

#### Heroku
1. Install Heroku CLI
2. Create new app: `heroku create your-app-name`
3. Add PostgreSQL: `heroku addons:create heroku-postgresql:hobby-dev`
4. Set environment variables:
   ```bash
   heroku config:set ADMIN_KEY=your_key
   heroku config:set SESSION_SECRET=your_secret
   ```
5. Deploy: `git push heroku main`

#### Vercel (Frontend) + Railway (Backend)
1. Deploy frontend to Vercel
2. Deploy backend to Railway with PostgreSQL
3. Update frontend to point to Railway backend URL

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Configure build and run commands
3. Add PostgreSQL database
4. Set environment variables

### Option C: Docker Deployment
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## Step 9: Domain and SSL
1. Point your domain to your server IP
2. Set up SSL certificate (Let's Encrypt recommended)
3. Configure reverse proxy (Nginx recommended)

### Nginx Configuration Example:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Important Security Notes
1. **Change default admin key** - Never use default passwords
2. **Use strong session secret** - Generate a random 32+ character string
3. **Enable HTTPS** - Always use SSL in production
4. **Database security** - Use strong passwords and limit access
5. **Environment variables** - Never commit secrets to version control

## Troubleshooting

### Common Issues:
1. **Database connection fails**: Check DATABASE_URL format and credentials
2. **Port already in use**: Change PORT in .env file
3. **Build fails**: Ensure all dependencies are installed
4. **Admin login doesn't work**: Verify ADMIN_KEY matches your login

### Checking Logs:
```bash
# If using PM2
pm2 logs bonushunter

# If running directly
npm start 2>&1 | tee app.log
```

## Post-Deployment Checklist
- [ ] Database is connected and tables created
- [ ] Admin login works with your ADMIN_KEY
- [ ] All features work (create hunt, add bonuses, OBS overlay)
- [ ] SSL certificate is active
- [ ] Domain points to your application
- [ ] Monitoring is set up (optional but recommended)

## Support
If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check server logs for error messages
4. Ensure your hosting provider supports Node.js applications

## Estimated Costs
- **Free Option**: Neon DB (free tier) + Vercel (frontend) + Railway (backend free tier)
- **Low Cost**: DigitalOcean Droplet ($5/month) + managed database ($15/month)
- **Enterprise**: AWS/GCP with load balancers, CDN, and managed services

Your BonusHunter app is now ready for production deployment!