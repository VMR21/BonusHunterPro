import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHuntSchema, insertBonusSchema, payoutSchema, adminLoginSchema } from "@shared/schema";
import { requireAdmin, createAdminSession, checkAdminSession, optionalAdmin, initializeAdminKeys, type AuthenticatedRequest } from "./auth";
import { updateHuntStatus } from "./hunt-status";
import { randomUUID } from 'crypto';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize admin keys on startup
  await initializeAdminKeys();

  // Admin authentication endpoints
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { adminKey } = adminLoginSchema.parse(req.body);
      const sessionToken = await createAdminSession(adminKey);
      
      if (!sessionToken) {
        return res.status(401).json({ error: "Invalid admin key" });
      }

      res.json({ sessionToken, message: "Login successful" });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Check admin session endpoint
  app.get("/api/admin/check", async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ isAdmin: false });
    }

    const sessionToken = authHeader.substring(7);
    const sessionCheck = await checkAdminSession(sessionToken);
    
    res.json({ 
      isAdmin: sessionCheck.valid,
      adminDisplayName: sessionCheck.adminDisplayName 
    });
  });

  // Admin logout endpoint
  app.post("/api/admin/logout", requireAdmin, async (req: AuthenticatedRequest, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionToken = authHeader.substring(7);
      await storage.deleteAdminSession(sessionToken);
    }
    res.json({ message: "Logged out successfully" });
  });

  // Hunt routes
  app.get("/api/hunts", async (req, res) => {
    try {
      const hunts = await storage.getHuntsWithAdmin();
      res.json(hunts);
    } catch (error) {
      console.error('Error fetching hunts:', error);
      res.status(500).json({ error: "Failed to fetch hunts" });
    }
  });

  // Live hunts (public view showing all admin hunts)
  app.get("/api/live-hunts", async (req, res) => {
    try {
      const liveHunts = await storage.getLiveHunts();
      res.json(liveHunts);
    } catch (error) {
      console.error('Error fetching live hunts:', error);
      res.status(500).json({ error: "Failed to fetch live hunts" });
    }
  });

  // Admin-specific hunts
  app.get("/api/my-hunts", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const hunts = await storage.getAdminHunts(req.adminKey!);
      res.json(hunts);
    } catch (error) {
      console.error('Error fetching admin hunts:', error);
      res.status(500).json({ error: "Failed to fetch hunts" });
    }
  });

  // Get live bonuses from all admins
  app.get("/api/live-bonuses", async (req, res) => {
    try {
      const bonuses = await storage.getAllLiveBonuses();
      res.json(bonuses);
    } catch (error) {
      console.error('Error fetching live bonuses:', error);
      res.status(500).json({ error: "Failed to fetch live bonuses" });
    }
  });

  app.get("/api/hunts/:id", optionalAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const hunt = await storage.getHunt(req.params.id);
      if (!hunt) {
        return res.status(404).json({ error: "Hunt not found" });
      }
      res.json(hunt);
    } catch (error) {
      console.error('Error fetching hunt:', error);
      res.status(500).json({ error: "Failed to fetch hunt" });
    }
  });

  app.post("/api/hunts", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const huntData = insertHuntSchema.parse(req.body);
      const hunt = await storage.createHunt(huntData, req.adminKey!);
      res.status(201).json(hunt);
    } catch (error) {
      console.error('Error creating hunt:', error);
      res.status(400).json({ error: "Invalid hunt data" });
    }
  });

  app.put("/api/hunts/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const huntData = req.body;
      const hunt = await storage.updateHunt(req.params.id, huntData);
      if (!hunt) {
        return res.status(404).json({ error: "Hunt not found" });
      }
      res.json(hunt);
    } catch (error) {
      console.error('Error updating hunt:', error);
      res.status(500).json({ error: "Failed to update hunt" });
    }
  });

  app.delete("/api/hunts/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.deleteHunt(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Hunt not found" });
      }
      res.json({ message: "Hunt deleted successfully" });
    } catch (error) {
      console.error('Error deleting hunt:', error);
      res.status(500).json({ error: "Failed to delete hunt" });
    }
  });

  // Bonus routes
  app.get("/api/hunts/:huntId/bonuses", async (req, res) => {
    try {
      const bonuses = await storage.getBonusesByHuntId(req.params.huntId);
      res.json(bonuses);
    } catch (error) {
      console.error('Error fetching bonuses:', error);
      res.status(500).json({ error: "Failed to fetch bonuses" });
    }
  });

  app.post("/api/hunts/:huntId/bonuses", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const bonusData = insertBonusSchema.parse({
        ...req.body,
        huntId: req.params.huntId,
      });
      const bonus = await storage.createBonus(bonusData);
      res.status(201).json(bonus);
    } catch (error) {
      console.error('Error creating bonus:', error);
      res.status(400).json({ error: "Invalid bonus data" });
    }
  });

  app.put("/api/bonuses/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const bonusData = req.body;
      const bonus = await storage.updateBonus(req.params.id, bonusData);
      if (!bonus) {
        return res.status(404).json({ error: "Bonus not found" });
      }
      res.json(bonus);
    } catch (error) {
      console.error('Error updating bonus:', error);
      res.status(500).json({ error: "Failed to update bonus" });
    }
  });

  app.delete("/api/bonuses/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.deleteBonus(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Bonus not found" });
      }
      res.json({ message: "Bonus deleted successfully" });
    } catch (error) {
      console.error('Error deleting bonus:', error);
      res.status(500).json({ error: "Failed to delete bonus" });
    }
  });

  // Payout recording
  app.post("/api/bonuses/:id/payout", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { winAmount } = payoutSchema.parse(req.body);
      const bonus = await storage.getBonus(req.params.id);
      
      if (!bonus) {
        return res.status(404).json({ error: "Bonus not found" });
      }

      const multiplier = winAmount / Number(bonus.betAmount);
      const updatedBonus = await storage.updateBonus(req.params.id, {
        winAmount: winAmount.toString(),
        multiplier: multiplier.toString(),
        isPlayed: true,
        status: "opened",
      });

      // Update hunt status after recording payout
      await updateHuntStatus(bonus.huntId);

      res.json(updatedBonus);
    } catch (error) {
      console.error('Error recording payout:', error);
      res.status(400).json({ error: "Invalid payout data" });
    }
  });

  // Slot routes
  app.get("/api/slots", async (req, res) => {
    try {
      const { search } = req.query;
      let slots;
      
      if (search && typeof search === 'string') {
        slots = await storage.searchSlots(search);
      } else {
        slots = await storage.getSlots();
      }
      
      res.json(slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      res.status(500).json({ error: "Failed to fetch slots" });
    }
  });

  // Stats routes
  app.get("/api/stats", optionalAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      let stats;
      if (req.adminKey) {
        // Return admin-specific stats
        stats = await storage.getAdminStats(req.adminKey);
      } else {
        // Return global stats
        stats = await storage.getStats();
      }
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Latest hunt routes
  app.get("/api/latest-hunt", optionalAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      let hunt;
      if (req.adminKey) {
        hunt = await storage.getLatestAdminHunt(req.adminKey);
      } else {
        hunt = await storage.getLatestHunt();
      }
      
      if (!hunt) {
        return res.status(404).json({ error: "No hunt found" });
      }
      
      res.json(hunt);
    } catch (error) {
      console.error('Error fetching latest hunt:', error);
      res.status(500).json({ error: "Failed to fetch latest hunt" });
    }
  });

  // Public hunt view
  app.get("/api/public/:token", async (req, res) => {
    try {
      const hunt = await storage.getHuntByPublicToken(req.params.token);
      if (!hunt) {
        return res.status(404).json({ error: "Hunt not found" });
      }
      res.json(hunt);
    } catch (error) {
      console.error('Error fetching public hunt:', error);
      res.status(500).json({ error: "Failed to fetch hunt" });
    }
  });

  // Import slots from CSV
  app.post("/api/admin/import-slots", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      // Clear existing slots
      await storage.clearSlots();
      
      const csvPath = "./data/slots.csv";
      if (!fs.existsSync(csvPath)) {
        return res.status(404).json({ error: "Slots CSV file not found" });
      }

      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
      });

      const slots = records.map((record: any) => ({
        name: record.name || record.Name,
        provider: record.provider || record.Provider,
        imageUrl: record.imageUrl || record.image || record.Image,
        category: record.category || record.Category || null,
      }));

      await storage.bulkCreateSlots(slots);
      
      res.json({ 
        message: `Successfully imported ${slots.length} slots`,
        count: slots.length 
      });
    } catch (error) {
      console.error('Error importing slots:', error);
      res.status(500).json({ error: "Failed to import slots" });
    }
  });

  // Start playing functionality
  app.post("/api/hunts/:id/start-playing", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const hunt = await storage.updateHunt(req.params.id, {
        isPlaying: true,
        currentSlotIndex: 0,
        status: "opening"
      });
      
      if (!hunt) {
        return res.status(404).json({ error: "Hunt not found" });
      }
      
      res.json(hunt);
    } catch (error) {
      console.error('Error starting hunt play:', error);
      res.status(500).json({ error: "Failed to start playing" });
    }
  });

  // Stop playing functionality
  app.post("/api/hunts/:id/stop-playing", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const hunt = await storage.updateHunt(req.params.id, {
        isPlaying: false,
        status: "finished"
      });
      
      if (!hunt) {
        return res.status(404).json({ error: "Hunt not found" });
      }
      
      res.json(hunt);
    } catch (error) {
      console.error('Error stopping hunt play:', error);
      res.status(500).json({ error: "Failed to stop playing" });
    }
  });

  // Admin Key Management Routes
  app.get("/api/admin/keys", async (req, res) => {
    try {
      const adminKeys = await storage.getAllAdminKeys();
      res.json(adminKeys);
    } catch (error) {
      console.error('Error fetching admin keys:', error);
      res.status(500).json({ error: "Failed to fetch admin keys" });
    }
  });

  app.post("/api/admin/keys", async (req, res) => {
    try {
      const { keyValue, displayName } = req.body;
      
      if (!keyValue || !displayName) {
        return res.status(400).json({ error: "Key value and display name are required" });
      }

      // Check if key already exists
      const existingKey = await storage.getAdminKeyByValue(keyValue);
      if (existingKey) {
        return res.status(400).json({ error: "Admin key already exists" });
      }

      const adminKey = await storage.createAdminKey({
        keyValue,
        displayName,
        createdAt: new Date(),
      });

      res.status(201).json(adminKey);
    } catch (error) {
      console.error('Error creating admin key:', error);
      res.status(500).json({ error: "Failed to create admin key" });
    }
  });

  app.delete("/api/admin/keys/:id", async (req, res) => {
    try {
      const adminKey = await storage.getAdminKeyById(req.params.id);
      if (!adminKey) {
        return res.status(404).json({ error: "Admin key not found" });
      }

      await storage.deleteAdminKey(req.params.id);
      res.json({ message: "Admin key deleted successfully" });
    } catch (error) {
      console.error('Error deleting admin key:', error);
      res.status(500).json({ error: "Failed to delete admin key" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}