import { Request, Response, NextFunction } from "express";
import { adminSessions } from "@shared/schema";
import { db } from "./db";
import { eq, gt } from "drizzle-orm";
import crypto from "crypto";

export interface AuthenticatedRequest extends Request {
  isAdmin?: boolean;
  sessionToken?: string;
}

// Admin authentication middleware
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Admin authentication required" });
    }

    const sessionToken = authHeader.substring(7);
    
    // Check if session token exists and is not expired
    const session = await db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.sessionToken, sessionToken))
      .limit(1);

    if (session.length === 0) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const sessionData = session[0];
    
    // Check if session is expired
    if (new Date() > sessionData.expiresAt) {
      // Clean up expired session
      await db
        .delete(adminSessions)
        .where(eq(adminSessions.sessionToken, sessionToken));
      
      return res.status(401).json({ error: "Session expired" });
    }

    req.isAdmin = true;
    req.sessionToken = sessionToken;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

// Create admin session
export async function createAdminSession(adminKey: string): Promise<string | null> {
  // Verify admin key
  if (adminKey !== process.env.ADMIN_KEY) {
    return null;
  }

  // Generate session token
  const sessionToken = crypto.randomUUID();
  
  // Set expiration to 24 hours
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Clean up old sessions (optional - keeps database tidy)
  await db
    .delete(adminSessions)
    .where(gt(adminSessions.expiresAt, new Date()));

  // Create new session
  await db.insert(adminSessions).values({
    sessionToken,
    expiresAt,
  });

  return sessionToken;
}

// Check if request has valid admin session
export async function checkAdminSession(sessionToken: string): Promise<boolean> {
  try {
    const session = await db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.sessionToken, sessionToken))
      .limit(1);

    if (session.length === 0) {
      return false;
    }

    return new Date() <= session[0].expiresAt;
  } catch (error) {
    console.error('Session check error:', error);
    return false;
  }
}