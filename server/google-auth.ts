import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from './storage';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import type { Express } from 'express';

// Setup session store
const pgSession = connectPg(session);

export function setupGoogleAuth(app: Express) {
  // Session configuration
  app.use(session({
    store: new pgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'bonushunter-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth strategy - skip if no credentials
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (googleClientId && googleClientSecret) {
    passport.use(new GoogleStrategy({
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: "/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || '',
          profileImage: profile.photos?.[0]?.value || null,
          googleId: profile.id
        });
      } else {
        // Update user info
        user = await storage.updateUser(user.id, {
          name: profile.displayName || user.name,
          profileImage: profile.photos?.[0]?.value || user.profileImage
        });
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Google auth error:', error);
      return done(error, null);
    }
  }));
  } else {
    console.log('Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required');
  }

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user || false);
    } catch (error) {
      console.error('Deserialize user error:', error);
      done(error, false);
    }
  });
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
}

// Middleware to get optional user
export function optionalAuth(req: any, res: any, next: any) {
  // User is available in req.user if authenticated, null otherwise
  return next();
}