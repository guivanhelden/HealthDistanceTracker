import { storage } from '../storage';
import { getDistance, haversineDistance } from '../api/googleMaps';
import { InsertAnaliseDistancia, Cliente, Prestador } from '@shared/schema';

/**
 * Calculates distance between a client and all providers, 
 * ranks them, and stores results in the database
 */
export async function calculateAndStoreDistances(clienteId: number): Promise<boolean> {
  try {
    // Get client data
    const cliente = await storage.getClienteById(clienteId);
    if (!cliente || !cliente.cliente_latitude || !cliente.cliente_longitude) {
      console.error(`Cliente ${clienteId} not found or missing coordinates`);
      return false;
    }

    // Get all providers
    const prestadores = await storage.getPrestadores();
    if (!prestadores.length) {
      console.error('No prestadores found');
      return false;
    }

    // Filter out providers without coordinates
    const validPrestadores = prestadores.filter(
      p => p.prestador_latitude !== null && p.prestador_longitude !== null
    );

    // Calculate distances for each provider
    const distanceResults = await Promise.all(
      validPrestadores.map(async prestador => {
        let distance: number;
        
        // Try Google Distance Matrix API first
        try {
          const result = await getDistance(
            Number(cliente.cliente_latitude),
            Number(cliente.cliente_longitude),
            Number(prestador.prestador_latitude),
            Number(prestador.prestador_longitude)
          );
          
          // If API call succeeds, use that result
          if (result) {
            distance = result.distanceKm;
          } else {
            // Fallback to Haversine formula
            distance = haversineDistance(
              Number(cliente.cliente_latitude),
              Number(cliente.cliente_longitude),
              Number(prestador.prestador_latitude),
              Number(prestador.prestador_longitude)
            );
          }
        } catch (error) {
          // In case of any API error, fallback to Haversine
          distance = haversineDistance(
            Number(cliente.cliente_latitude),
            Number(cliente.cliente_longitude),
            Number(prestador.prestador_latitude),
            Number(prestador.prestador_longitude)
          );
        }
        
        return {
          prestador,
          distance
        };
      })
    );

    // Sort providers by distance (closest first)
    const sortedResults = distanceResults.sort((a, b) => a.distance - b.distance);

    // Limit to only top 3 closest providers
    const topProviders = sortedResults.slice(0, 3);
    
    // Store only top 3 results in the database with ranking
    const analysisPromises = topProviders.map(async (result, index) => {
      // Preparar os dados para inserção
      const distanciaStr = result.distance.toString();
      const analiseData = {
        cliente_id: cliente.id,
        prestador_id: result.prestador.id,
        distancia_km: distanciaStr,
        posicao_ranking: index + 1, // Ranking starts at 1
        cliente_latitude: cliente.cliente_latitude?.toString() || "0",
        cliente_longitude: cliente.cliente_longitude?.toString() || "0",
        prestador_latitude: result.prestador.prestador_latitude?.toString() || "0",
        prestador_longitude: result.prestador.prestador_longitude?.toString() || "0",
        cliente_nome: cliente.nome || '',
        cliente_cep: cliente.cep || '',
        cliente_uf: cliente.uf || '',
        prestador_nome: result.prestador.nome_prestador || '',
        prestador_cep: result.prestador.cep || '',
        prestador_uf: result.prestador.uf || '',
        planos: Array.isArray(result.prestador.planos) ? result.prestador.planos.join(', ') : '',
        especialidade: Array.isArray(result.prestador.especialidades) ? result.prestador.especialidades.join(', ') : ''
      } as InsertAnaliseDistancia;

      await storage.createAnalise(analiseData);
    });

    await Promise.all(analysisPromises);
    return true;
  } catch (error) {
    console.error('Error calculating distances:', error);
    return false;
  }
}

/**
 * Calculates distance for all clients against all providers
 */
export async function calculateAllDistances(): Promise<{
  success: number;
  failed: number;
}> {
  try {
    const clientes = await storage.getClientes();
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const cliente of clientes) {
      const result = await calculateAndStoreDistances(cliente.id);
      if (result) {
        successCount++;
      } else {
        failedCount++;
      }
    }
    
    return {
      success: successCount,
      failed: failedCount
    };
  } catch (error) {
    console.error('Error in bulk distance calculation:', error);
    return {
      success: 0,
      failed: 0
    };
  }
}

/**
 * Gets analysis for a specific client with top N closest providers
 */
export async function getClienteAnalysis(clienteId: number, limit = 3): Promise<any> {
  try {
    // Find existing analysis for this client
    const existingAnalysis = await storage.getTopPrestadoresByClienteId(clienteId, limit);
    
    // If analysis exists and has enough entries, return it
    if (existingAnalysis.length >= limit) {
      return {
        success: true,
        data: existingAnalysis
      };
    }
    
    // Otherwise, calculate distances for this client and try again
    await calculateAndStoreDistances(clienteId);
    
    // Get the newly created analysis
    const analysis = await storage.getTopPrestadoresByClienteId(clienteId, limit);
    
    return {
      success: true,
      data: analysis
    };
  } catch (error) {
    console.error(`Error getting analysis for client ${clienteId}:`, error);
    return {
      success: false,
      error: 'Failed to retrieve analysis'
    };
  }
}

/**
 * Gets statistical data about distances
 */
export async function getDistanceStatistics(): Promise<any> {
  try {
    const analises = await storage.getAnalises();
    
    if (!analises.length) {
      return {
        totalClientes: 0,
        totalPrestadores: 0,
        avgDistance: 0,
        totalAnalyses: 0
      };
    }
    
    // Get unique client and provider IDs
    const clienteIds = new Set(analises.map(a => a.cliente_id));
    const prestadorIds = new Set(analises.map(a => a.prestador_id));
    
    // Calculate average distance
    const totalDistance = analises.reduce((sum, analise) => {
      return sum + Number(analise.distancia_km || 0);
    }, 0);
    
    const avgDistance = totalDistance / analises.length;
    
    return {
      totalClientes: clienteIds.size,
      totalPrestadores: prestadorIds.size,
      avgDistance: Number(avgDistance.toFixed(1)),
      totalAnalyses: analises.length
    };
  } catch (error) {
    console.error('Error getting distance statistics:', error);
    return {
      totalClientes: 0,
      totalPrestadores: 0,
      avgDistance: 0,
      totalAnalyses: 0
    };
  }
}
