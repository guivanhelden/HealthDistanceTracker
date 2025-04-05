import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  calculateAndStoreDistances, 
  calculateAllDistances,
  getClienteAnalysis,
  getDistanceStatistics 
} from "./services/distanceService";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes

  // Get all clients
  app.get('/api/clientes', async (_req: Request, res: Response) => {
    try {
      const clientes = await storage.getClientes();
      res.json(clientes);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      res.status(500).json({ error: 'Failed to fetch clientes' });
    }
  });

  // Get clients by UF (state)
  app.get('/api/clientes/uf/:uf', async (req: Request, res: Response) => {
    try {
      const uf = req.params.uf;
      const clientes = await storage.getClientesByUf(uf);
      res.json(clientes);
    } catch (error) {
      console.error(`Error fetching clientes from UF ${req.params.uf}:`, error);
      res.status(500).json({ error: 'Failed to fetch clientes by UF' });
    }
  });

  // Get a specific client
  app.get('/api/clientes/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      
      const cliente = await storage.getClienteById(id);
      if (!cliente) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      res.json(cliente);
    } catch (error) {
      console.error(`Error fetching cliente ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch cliente' });
    }
  });

  // Get all providers
  app.get('/api/prestadores', async (_req: Request, res: Response) => {
    try {
      const prestadores = await storage.getPrestadores();
      res.json(prestadores);
    } catch (error) {
      console.error('Error fetching prestadores:', error);
      res.status(500).json({ error: 'Failed to fetch prestadores' });
    }
  });

  // Get providers by UF (state)
  app.get('/api/prestadores/uf/:uf', async (req: Request, res: Response) => {
    try {
      const uf = req.params.uf;
      const prestadores = await storage.getPrestadoresByUf(uf);
      res.json(prestadores);
    } catch (error) {
      console.error(`Error fetching prestadores from UF ${req.params.uf}:`, error);
      res.status(500).json({ error: 'Failed to fetch prestadores by UF' });
    }
  });

  // Get a specific provider
  app.get('/api/prestadores/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid provider ID' });
      }
      
      const prestador = await storage.getPrestadorById(id);
      if (!prestador) {
        return res.status(404).json({ error: 'Provider not found' });
      }
      
      res.json(prestador);
    } catch (error) {
      console.error(`Error fetching prestador ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch prestador' });
    }
  });

  // Get all distance analyses
  app.get('/api/analises', async (_req: Request, res: Response) => {
    try {
      const analises = await storage.getAnalises();
      res.json(analises);
    } catch (error) {
      console.error('Error fetching analises:', error);
      res.status(500).json({ error: 'Failed to fetch analises' });
    }
  });

  // Get analyses for a specific client
  app.get('/api/analises/cliente/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      
      const analises = await storage.getAnalisesByClienteId(id);
      res.json(analises);
    } catch (error) {
      console.error(`Error fetching analises for cliente ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch analises for cliente' });
    }
  });

  // Calculate distances for a specific client
  app.post('/api/calculate/cliente/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      
      const result = await calculateAndStoreDistances(id);
      if (!result) {
        return res.status(500).json({ error: 'Failed to calculate distances for client' });
      }
      
      res.json({ success: true, message: 'Distances calculated and stored successfully' });
    } catch (error) {
      console.error(`Error calculating distances for cliente ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to calculate distances' });
    }
  });

  // Calculate distances for all clients
  app.post('/api/calculate/all', async (_req: Request, res: Response) => {
    try {
      const result = await calculateAllDistances();
      res.json({
        success: true,
        message: 'Bulk distance calculation completed',
        results: result
      });
    } catch (error) {
      console.error('Error in bulk distance calculation:', error);
      res.status(500).json({ error: 'Failed to calculate distances for all clients' });
    }
  });

  // Get analysis for a client (top N providers)
  app.get('/api/analysis/cliente/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const result = await getClienteAnalysis(id, limit);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }
      
      res.json(result.data);
    } catch (error) {
      console.error(`Error getting analysis for cliente ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to get analysis for client' });
    }
  });

  // Get statistics about the distance data
  app.get('/api/statistics', async (_req: Request, res: Response) => {
    try {
      const stats = await getDistanceStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
