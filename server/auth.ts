import { randomUUID } from "crypto";
import { storage } from "./storage";
import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  adminKey?: string;
  adminDisplayName?: string;
}

// Create admin session with 24-hour expiry
export async function createAdminSession(adminKeyValue: string): Promise<string | null> {
  const adminKey = await storage.getAdminKeyByValue(adminKeyValue);
  
  if (!adminKey || !adminKey.isActive) {
    return null;
  }

  const sessionToken = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await storage.createAdminSession(adminKey.id, sessionToken, expiresAt);
  return sessionToken;
}

// Check if admin session is valid
export async function checkAdminSession(sessionToken: string): Promise<{ valid: boolean; adminKey?: string; adminDisplayName?: string; kickUsername?: string }> {
  const session = await storage.getAdminSession(sessionToken);
  
  if (!session || session.expiresAt < new Date()) {
    if (session) {
      // Clean up expired session
      await storage.deleteAdminSession(sessionToken);
    }
    return { valid: false };
  }

  const adminKey = await storage.getAdminKeyById(session.adminKeyId);
  if (!adminKey || !adminKey.isActive) {
    return { valid: false };
  }

  return { 
    valid: true, 
    adminKey: adminKey.keyValue,
    adminDisplayName: adminKey.displayName,
    kickUsername: adminKey.kickUsername
  };
}

// Middleware to require admin authentication
export async function requireAdmin(req: AuthenticatedRequest, res: any, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const sessionToken = authHeader.substring(7);
  const sessionCheck = await checkAdminSession(sessionToken);
  
  if (!sessionCheck.valid) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  req.adminKey = sessionCheck.adminKey;
  req.adminDisplayName = sessionCheck.adminDisplayName;
  next();
}

// Middleware for optional admin authentication
export async function optionalAdmin(req: AuthenticatedRequest, res: any, next: any) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const sessionToken = authHeader.substring(7);
    const sessionCheck = await checkAdminSession(sessionToken);
    
    if (sessionCheck.valid) {
      req.adminKey = sessionCheck.adminKey;
      req.adminDisplayName = sessionCheck.adminDisplayName;
    }
  }
  
  next();
}

// Initialize default admin keys if none exist
export async function initializeAdminKeys(): Promise<void> {
  const existingKeys = await storage.getAllAdminKeys();
  
  if (existingKeys.length === 0) {
    // Create default admin keys
    const defaultKeys = [
      {
        keyName: "admin1",
        keyValue: process.env.ADMIN_KEY || "admin123",
        displayName: "Main Admin",
        isActive: true,
      },
      {
        keyName: "admin2", 
        keyValue: "admin456",
        displayName: "Secondary Admin",
        isActive: true,
      },
      {
        keyName: "streamer1",
        keyValue: "streamer789",
        displayName: "Streamer Account",
        isActive: true,
      }
    ];

    for (const key of defaultKeys) {
      await storage.createAdminKey(key);
    }

    console.log("✅ Initialized default admin keys:");
    console.log("  - Main Admin: " + (process.env.ADMIN_KEY || "admin123"));
    console.log("  - Secondary Admin: admin456");
    console.log("  - Streamer Account: streamer789");
  }
}