import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHuntSchema, insertBonusSchema } from "@shared/schema";
import { z } from "zod";

const ADMIN_API_KEY = process.env.ADMIN_KEY || "bonushunter-admin-2024";

function requireApiKey(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== ADMIN_API_KEY) {
    return res.status(401).json({ message: "Invalid API key" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Public routes
  app.get("/api/hunts", async (req, res) => {
    try {
      const hunts = await storage.getHunts();
      res.json(hunts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hunts" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to fetch hunt" });
    }
  });

  app.get("/api/hunts/:id/bonuses", async (req, res) => {
    try {
      const bonuses = await storage.getBonusesByHuntId(req.params.id);
      res.json(bonuses);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to search slots" });
    }
  });

  app.get("/api/slots/:name", async (req, res) => {
    try {
      const slot = await storage.getSlot(req.params.name);
      if (!slot) {
        return res.status(404).json({ message: "Slot not found" });
      }
      res.json(slot);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch slot" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const hunts = await storage.getHunts();
      const activeHunts = hunts.filter(h => h.status !== 'finished');
      const totalSpent = hunts.reduce((sum, h) => sum + (h.startBalance || 0), 0);
      const totalWon = hunts.reduce((sum, h) => sum + (h.endBalance || 0), 0);
      
      res.json({
        totalHunts: hunts.length,
        activeHunts: activeHunts.length,
        totalSpent,
        totalWon,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin routes (require API key)
  app.post("/api/admin/hunts", requireApiKey, async (req, res) => {
    try {
      const huntData = insertHuntSchema.parse(req.body);
      const hunt = await storage.createHunt(huntData);
      res.status(201).json(hunt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid hunt data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create hunt" });
    }
  });

  app.put("/api/admin/hunts/:id", requireApiKey, async (req, res) => {
    try {
      const hunt = await storage.updateHunt(req.params.id, req.body);
      if (!hunt) {
        return res.status(404).json({ message: "Hunt not found" });
      }
      res.json(hunt);
    } catch (error) {
      res.status(500).json({ message: "Failed to update hunt" });
    }
  });

  app.delete("/api/admin/hunts/:id", requireApiKey, async (req, res) => {
    try {
      const success = await storage.deleteHunt(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Hunt not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete hunt" });
    }
  });

  app.post("/api/admin/bonuses", requireApiKey, async (req, res) => {
    try {
      const bonusData = insertBonusSchema.parse(req.body);
      const bonus = await storage.createBonus(bonusData);
      res.status(201).json(bonus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bonus data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bonus" });
    }
  });

  app.put("/api/admin/bonuses/:id", requireApiKey, async (req, res) => {
    try {
      const bonus = await storage.updateBonus(req.params.id, req.body);
      if (!bonus) {
        return res.status(404).json({ message: "Bonus not found" });
      }
      res.json(bonus);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bonus" });
    }
  });

  app.delete("/api/admin/bonuses/:id", requireApiKey, async (req, res) => {
    try {
      const success = await storage.deleteBonus(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Bonus not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bonus" });
    }
  });

  app.put("/api/admin/hunts/:id/public", requireApiKey, async (req, res) => {
    try {
      const { isPublic } = req.body;
      const hunt = await storage.updateHunt(req.params.id, { isPublic: isPublic ? 1 : 0 });
      if (!hunt) {
        return res.status(404).json({ message: "Hunt not found" });
      }
      res.json(hunt);
    } catch (error) {
      res.status(500).json({ message: "Failed to update hunt visibility" });
    }
  });

  app.post("/api/admin/validate-key", (req, res) => {
    const { apiKey } = req.body;
    if (apiKey === ADMIN_API_KEY) {
      res.json({ valid: true });
    } else {
      res.status(401).json({ valid: false });
    }
  });

  // Get latest hunt for OBS overlay - auto-refreshing
  app.get('/api/latest-hunt', async (req, res) => {
    try {
      const latestHunt = await storage.getLatestHunt();
      const bonuses = latestHunt ? await storage.getBonusesByHuntId(latestHunt.id) : [];
      
      // Set cache headers for real-time updates
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json({ hunt: latestHunt, bonuses });
    } catch (error) {
      console.error('Error fetching latest hunt:', error);
      res.status(500).json({ error: 'Failed to fetch latest hunt' });
    }
  });

  // Get live public link for latest hunt
  app.get('/api/latest-hunt/public-link', async (req, res) => {
    try {
      const latestHunt = await storage.getLatestHunt();
      if (!latestHunt) {
        return res.status(404).json({ error: 'No hunt found' });
      }
      
      const publicLink = `${req.protocol}://${req.get('host')}/public/${latestHunt.publicToken}`;
      const obsOverlayLink = `${req.protocol}://${req.get('host')}/obs-overlay/${latestHunt.id}`;
      
      res.json({ 
        huntId: latestHunt.id,
        publicLink,
        obsOverlayLink,
        title: latestHunt.title,
        status: latestHunt.status
      });
    } catch (error) {
      console.error('Error getting public link:', error);
      res.status(500).json({ error: 'Failed to get public link' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
