import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHuntSchema, insertBonusSchema, payoutSchema, adminLoginSchema } from "@shared/schema";
import { requireAdmin, createAdminSession, checkAdminSession, type AuthenticatedRequest } from "./auth";
import { randomUUID } from 'crypto';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin authentication endpoint
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
    const isValid = await checkAdminSession(sessionToken);
    
    res.json({ isAdmin: isValid });
  });

  // Public routes
  app.get("/api/hunts", async (req, res) => {
    try {
      const hunts = await storage.getHunts();
      res.json(hunts);
    } catch (error) {
      console.error('Error fetching hunts:', error);
      res.status(500).json({ message: "Failed to fetch hunts" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/hunts/:id", async (req, res) => {
    try {
      const hunt = await storage.getHunt(req.params.id);
      if (!hunt) {
        return res.status(404).json({ message: "Hunt not found" });
      }
      res.json(hunt);
    } catch (error) {
      console.error('Error fetching hunt:', error);
      res.status(500).json({ message: "Failed to fetch hunt" });
    }
  });

  app.get("/api/hunts/:id/bonuses", async (req, res) => {
    try {
      const bonuses = await storage.getBonusesByHuntId(req.params.id);
      res.json(bonuses);
    } catch (error) {
      console.error('Error fetching bonuses:', error);
      res.status(500).json({ message: "Failed to fetch bonuses" });
    }
  });

  app.get("/api/public/hunts/:token", async (req, res) => {
    try {
      const hunt = await storage.getHuntByPublicToken(req.params.token);
      if (!hunt || !hunt.isPublic) {
        return res.status(404).json({ message: "Public hunt not found" });
      }
      
      const bonuses = await storage.getBonusesByHuntId(hunt.id);
      res.json({ hunt, bonuses });
    } catch (error) {
      console.error('Error fetching public hunt:', error);
      res.status(500).json({ message: "Failed to fetch public hunt" });
    }
  });

  app.get("/api/slots/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const slots = await storage.searchSlots(query);
      res.json(slots);
    } catch (error) {
      console.error('Error searching slots:', error);
      res.status(500).json({ message: "Failed to search slots" });
    }
  });

  app.get("/api/latest-hunt", async (req, res) => {
    try {
      const hunt = await storage.getLatestHunt();
      if (!hunt) {
        return res.status(404).json({ error: "No hunts found" });
      }
      res.json({ hunt });
    } catch (error) {
      console.error('Error fetching latest hunt:', error);
      res.status(500).json({ error: "Failed to fetch latest hunt" });
    }
  });

  app.get("/api/latest-hunt/public-link", async (req, res) => {
    try {
      const hunt = await storage.getLatestHunt();
      if (!hunt) {
        return res.status(404).json({ error: "No hunts found" });
      }

      // Generate public token if not exists
      if (!hunt.publicToken) {
        const publicToken = randomUUID();
        await storage.updateHunt(hunt.id, { 
          publicToken, 
          isPublic: true 
        });
        hunt.publicToken = publicToken;
      }

      res.json({ 
        huntId: hunt.id,
        publicToken: hunt.publicToken,
        publicUrl: `${req.protocol}://${req.get('host')}/public-hunt/${hunt.publicToken}`,
        obsUrl: `${req.protocol}://${req.get('host')}/obs-overlay/latest`
      });
    } catch (error) {
      console.error('Error getting public link:', error);
      res.status(500).json({ error: "Failed to get public link" });
    }
  });

  // Protected admin routes
  app.post("/api/admin/hunts", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const huntData = insertHuntSchema.parse(req.body);
      const hunt = await storage.createHunt(huntData);
      
      // Generate public token immediately
      const publicToken = randomUUID();
      await storage.updateHunt(hunt.id, { 
        publicToken, 
        isPublic: true 
      });
      
      // Return hunt with links
      const response = {
        ...hunt,
        publicToken,
        publicUrl: `${req.protocol}://${req.get('host')}/public-hunt/${publicToken}`,
        obsUrl: `${req.protocol}://${req.get('host')}/obs-overlay/latest`
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating hunt:', error);
      res.status(400).json({ message: "Invalid hunt data", error: error.message });
    }
  });

  app.put("/api/admin/hunts/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const hunt = await storage.updateHunt(req.params.id, req.body);
      if (!hunt) {
        return res.status(404).json({ message: "Hunt not found" });
      }
      res.json(hunt);
    } catch (error) {
      console.error('Error updating hunt:', error);
      res.status(500).json({ message: "Failed to update hunt" });
    }
  });

  app.delete("/api/admin/hunts/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.deleteHunt(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Hunt not found" });
      }
      res.json({ message: "Hunt deleted successfully" });
    } catch (error) {
      console.error('Error deleting hunt:', error);
      res.status(500).json({ message: "Failed to delete hunt" });
    }
  });

  app.post("/api/admin/bonuses", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const bonusData = insertBonusSchema.parse(req.body);
      const bonus = await storage.createBonus(bonusData);
      res.status(201).json(bonus);
    } catch (error) {
      console.error('Error creating bonus:', error);
      res.status(400).json({ message: "Invalid bonus data", error: error.message });
    }
  });

  app.put("/api/admin/bonuses/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const bonus = await storage.updateBonus(req.params.id, req.body);
      if (!bonus) {
        return res.status(404).json({ message: "Bonus not found" });
      }
      res.json(bonus);
    } catch (error) {
      console.error('Error updating bonus:', error);
      res.status(500).json({ message: "Failed to update bonus" });
    }
  });

  app.delete("/api/admin/bonuses/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.deleteBonus(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Bonus not found" });
      }
      res.json({ message: "Bonus deleted successfully" });
    } catch (error) {
      console.error('Error deleting bonus:', error);
      res.status(500).json({ message: "Failed to delete bonus" });
    }
  });

  // Start playing functionality (admin only)
  app.post("/api/admin/hunts/:id/start-playing", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const hunt = await storage.updateHunt(req.params.id, { 
        isPlaying: true,
        currentSlotIndex: 0 
      });
      if (!hunt) {
        return res.status(404).json({ message: "Hunt not found" });
      }
      res.json(hunt);
    } catch (error) {
      console.error('Error starting hunt:', error);
      res.status(500).json({ message: "Failed to start hunt" });
    }
  });

  // Payout endpoint (admin only)
  app.post("/api/admin/bonuses/:id/payout", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { winAmount } = payoutSchema.parse(req.body);
      const bonus = await storage.getBonus(req.params.id);
      
      if (!bonus) {
        return res.status(404).json({ message: "Bonus not found" });
      }

      // Calculate multiplier
      const betAmount = Number(bonus.betAmount);
      const multiplier = betAmount > 0 ? winAmount / betAmount : 0;

      const updatedBonus = await storage.updateBonus(req.params.id, {
        winAmount: winAmount.toString(),
        multiplier: multiplier.toString(),
        isPlayed: true
      });

      // Update hunt totals
      const hunt = await storage.getHunt(bonus.huntId);
      if (hunt) {
        const allBonuses = await storage.getBonusesByHuntId(bonus.huntId);
        const totalWon = allBonuses.reduce((sum, b) => sum + (Number(b.winAmount) || 0), 0);
        
        await storage.updateHunt(bonus.huntId, {
          totalWon: totalWon.toString()
        });
      }

      res.json(updatedBonus);
    } catch (error) {
      console.error('Error processing payout:', error);
      res.status(400).json({ message: "Invalid payout data", error: error.message });
    }
  });

  // OBS overlay route for latest hunt (public access)
  app.get("/obs-overlay/latest", async (req, res) => {
    try {
      const hunt = await storage.getLatestHunt();
      if (!hunt) {
        return res.status(404).json({ message: "No hunts found" });
      }
      
      const bonuses = await storage.getBonusesByHuntId(hunt.id);
      res.json({ hunt, bonuses });
    } catch (error) {
      console.error('Error fetching OBS overlay data:', error);
      res.status(500).json({ message: "Failed to fetch overlay data" });
    }
  });

  // Protected OBS overlay routes (admin only)
  app.get("/api/admin/obs-overlay/:huntId", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const hunt = await storage.getHunt(req.params.huntId);
      if (!hunt) {
        return res.status(404).json({ message: "Hunt not found" });
      }
      
      const bonuses = await storage.getBonusesByHuntId(hunt.id);
      res.json({ hunt, bonuses });
    } catch (error) {
      console.error('Error fetching OBS overlay data:', error);
      res.status(500).json({ message: "Failed to fetch overlay data" });
    }
  });

  // Initialize slot database if empty
  app.post("/api/admin/init-slots", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      // Read and parse the CSV file
      const csvData = fs.readFileSync('attached_assets/slots_1756197328567.csv', 'utf8');
      const slots = parse(csvData, { 
        columns: true, 
        skip_empty_lines: true 
      });

      const slotData = slots.map(slot => ({
        name: slot.name || slot.Name || '',
        provider: slot.provider || slot.Provider || '',
        imageUrl: slot.image || slot.imageUrl || slot['image_url'] || slot['Image URL'] || null,
        category: slot.category || slot.Category || null,
      })).filter(slot => slot.name && slot.provider);
      
      console.log('Sample slot data:', slotData.slice(0, 3));
      console.log(`Parsed ${slotData.length} slots from CSV`);

      // Always re-initialize by clearing first then adding
      await storage.clearSlots();
      await storage.bulkCreateSlots(slotData);
      
      // Verify slots were added
      const verifySlots = await storage.searchSlots('');
      console.log(`Verification: ${verifySlots.length} slots in database`);
      
      res.json({ 
        message: "Slots initialized successfully", 
        count: verifySlots.length 
      });
    } catch (error) {
      console.error('Error initializing slots:', error);
      res.status(500).json({ message: "Failed to initialize slots", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}