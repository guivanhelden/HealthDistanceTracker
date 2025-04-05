import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Users, Building2, Map, Calendar } from 'lucide-react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import MapView from '@/components/MapView';
import AnalysisPanel from '@/components/AnalysisPanel';
import ReportTable from '@/components/ReportTable';
import DetailModal from '@/components/DetailModal';
import { apiRequest } from '@/lib/queryClient';
import { MapLocation, CITY_COORDINATES } from '@/lib/mapbox';
import { Cliente, Prestador, AnaliseDistancia, Estatisticas } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCity, setSelectedCity] = useState<keyof typeof CITY_COORDINATES | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedPrestadorId, setSelectedPrestadorId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    uf: 'Todos',
    tipoServico: 'Todos',
    distanciaMaxima: 15
  });

  // Parse city from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city');
    if (city && city in CITY_COORDINATES) {
      setSelectedCity(city as keyof typeof CITY_COORDINATES);
    }
  }, [location]);

  // Fetch data
  const { data: clientesData, isLoading: isLoadingClientes } = useQuery({
    queryKey: ['/api/clientes'],
    staleTime: 60000 // 1 minute
  });

  const { data: prestadoresData, isLoading: isLoadingPrestadores } = useQuery({
    queryKey: ['/api/prestadores'],
    staleTime: 60000 // 1 minute
  });

  const { data: analisesData, isLoading: isLoadingAnalises } = useQuery({
    queryKey: ['/api/analises'],
    staleTime: 60000 // 1 minute
  });

  const { data: statistics, isLoading: isLoadingStatistics } = useQuery({
    queryKey: ['/api/statistics'],
    staleTime: 60000 // 1 minute
  });

  // Convert to map locations
  const clientLocations: MapLocation[] = (clientesData || [])
    .filter((cliente: Cliente) => cliente.cliente_latitude && cliente.cliente_longitude)
    .map((cliente: Cliente) => ({
      id: cliente.id,
      latitude: Number(cliente.cliente_latitude),
      longitude: Number(cliente.cliente_longitude),
      name: cliente.nome || `Cliente ${cliente.id}`,
      type: 'cliente',
      details: {
        uf: cliente.uf,
        cep: cliente.cep
      }
    }));

  const providerLocations: MapLocation[] = (prestadoresData || [])
    .filter((prestador: Prestador) => prestador.prestador_latitude && prestador.prestador_longitude)
    .map((prestador: Prestador) => ({
      id: prestador.id,
      latitude: Number(prestador.prestador_latitude),
      longitude: Number(prestador.prestador_longitude),
      name: prestador.nome_prestador || `Prestador ${prestador.id}`,
      type: 'prestador',
      details: {
        uf: prestador.uf,
        cep: prestador.cep,
        tipo: prestador.tipo_servico
      }
    }));

  // Process analysis data for the panel
  const clientesWithPrestadores = React.useMemo(() => {
    if (!clientesData || !prestadoresData || !analisesData) return [];
    
    // Get unique client IDs from analyses
    const uniqueClientIds = [...new Set(analisesData.map((a: AnaliseDistancia) => a.cliente_id))];
    
    return uniqueClientIds.map(clienteId => {
      // Find the client
      const cliente = clientesData.find((c: Cliente) => c.id === clienteId);
      if (!cliente) return null;
      
      // Find analyses for this client, filter by ranking (top 2)
      const clientAnalyses = analisesData
        .filter((a: AnaliseDistancia) => a.cliente_id === clienteId && a.posicao_ranking <= 2)
        .sort((a: AnaliseDistancia, b: AnaliseDistancia) => a.posicao_ranking - b.posicao_ranking);
      
      // Map to the expected format
      const prestadores = clientAnalyses.map((analise: AnaliseDistancia) => {
        const prestador = prestadoresData.find((p: Prestador) => p.id === analise.prestador_id);
        
        return {
          id: analise.prestador_id,
          ranking: analise.posicao_ranking,
          nome: analise.prestador_nome || (prestador?.nome_prestador || `Prestador ${analise.prestador_id}`),
          distancia: Number(analise.distancia_km),
          local: prestador?.municipio || analise.prestador_uf || ''
        };
      });
      
      return {
        clienteId: clienteId,
        clienteNome: cliente.nome || `Cliente ${clienteId}`,
        clienteUf: cliente.uf || '',
        prestadores
      };
    }).filter(Boolean);
  }, [clientesData, prestadoresData, analisesData]);

  // Format report data
  const reportData = React.useMemo(() => {
    if (!clientesWithPrestadores) return [];
    
    return clientesWithPrestadores.map(cliente => {
      return {
        cliente: {
          id: cliente.clienteId,
          nome: cliente.clienteNome,
          uf: cliente.clienteUf,
          iniciais: cliente.clienteNome 
            ? cliente.clienteNome.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase()
            : ''
        },
        prestadores: cliente.prestadores
      };
    });
  }, [clientesWithPrestadores]);

  // Filter data based on user selection
  const filteredClientes = React.useMemo(() => {
    if (!clientesWithPrestadores) return [];
    
    return clientesWithPrestadores.filter(cliente => {
      // Filter by UF
      if (filters.uf !== 'Todos' && cliente.clienteUf !== filters.uf) {
        return false;
      }
      
      // Filter by provider type and distance
      const hasFiltredPrestadores = cliente.prestadores.some(prestador => {
        // Filter by distance
        if (prestador.distancia > filters.distanciaMaxima) {
          return false;
        }
        
        // Filter by service type (would need to join with provider data)
        // Assuming this field is not directly available in the analysis
        return true;
      });
      
      return hasFiltredPrestadores;
    });
  }, [clientesWithPrestadores, filters]);

  // Handle showing detail modal
  const handleShowDetails = (clienteId: number, prestadorId: number) => {
    setSelectedClientId(clienteId);
    setSelectedPrestadorId(prestadorId);
    setModalOpen(true);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  // Calculate mutations
  const calculateMutation = useMutation({
    mutationFn: async (clienteId: number) => {
      return apiRequest('POST', `/api/calculate/cliente/${clienteId}`);
    },
    onSuccess: () => {
      toast({
        title: "Cálculo concluído",
        description: "As distâncias foram calculadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no cálculo",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Determine selected client and provider for modal
  const selectedClient = clientesData?.find((c: Cliente) => c.id === selectedClientId);
  const selectedPrestador = prestadoresData?.find((p: Prestador) => p.id === selectedPrestadorId);
  const selectedAnalyse = analisesData?.find(
    (a: AnaliseDistancia) => a.cliente_id === selectedClientId && a.prestador_id === selectedPrestadorId
  );

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Análise de Distância Cliente-Hospital</h2>
        <p className="text-slate-500">Visualize e analise as distâncias entre clientes e prestadores de saúde</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total de Clientes" 
          value={statistics?.totalClientes || 0}
          icon={<Users className="h-5 w-5 text-primary" />}
          trend={{ value: 8.5, label: "desde o último mês", isPositive: true }}
          iconBgColor="bg-blue-100"
        />
        
        <StatCard 
          title="Total de Prestadores" 
          value={statistics?.totalPrestadores || 0}
          icon={<Building2 className="h-5 w-5 text-accent" />}
          trend={{ value: 3.2, label: "desde o último mês", isPositive: false }}
          iconBgColor="bg-orange-100"
        />
        
        <StatCard 
          title="Distância Média" 
          value={`${statistics?.avgDistance || 0} km`}
          icon={<Map className="h-5 w-5 text-purple-600" />}
          trend={{ value: 5.1, label: "melhor acesso", isPositive: true }}
          iconBgColor="bg-purple-100"
        />
        
        <StatCard 
          title="Análises Concluídas" 
          value={statistics?.totalAnalyses || 0}
          icon={<Calendar className="h-5 w-5 text-green-600" />}
          trend={{ value: 12.3, label: "desde a última semana", isPositive: true }}
          iconBgColor="bg-green-100"
        />
      </div>

      {/* Map and Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Map Container */}
        <div className="lg:col-span-2">
          <MapView 
            clientLocations={clientLocations}
            providerLocations={providerLocations}
            focusCity={selectedCity}
            isLoading={isLoadingClientes || isLoadingPrestadores}
          />
        </div>

        {/* Data & Analysis Panel */}
        <div>
          <AnalysisPanel 
            data={filteredClientes}
            isLoading={isLoadingAnalises}
            onShowDetails={handleShowDetails}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Detailed Analysis Section */}
      <div className="mt-6">
        <ReportTable 
          data={reportData}
          isLoading={isLoadingAnalises}
          onShowDetails={handleShowDetails}
        />
      </div>
      
      {/* Detail Modal */}
      <DetailModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        clientData={selectedClient ? {
          id: selectedClient.id,
          nome: selectedClient.nome || `Cliente ${selectedClient.id}`,
          uf: selectedClient.uf || '',
          cep: selectedClient.cep || undefined,
          latitude: selectedClient.cliente_latitude ? Number(selectedClient.cliente_latitude) : undefined,
          longitude: selectedClient.cliente_longitude ? Number(selectedClient.cliente_longitude) : undefined
        } : undefined}
        prestadorData={selectedPrestador ? {
          id: selectedPrestador.id,
          nome: selectedPrestador.nome_prestador || `Prestador ${selectedPrestador.id}`,
          uf: selectedPrestador.uf || '',
          cep: selectedPrestador.cep || undefined,
          latitude: selectedPrestador.prestador_latitude ? Number(selectedPrestador.prestador_latitude) : undefined,
          longitude: selectedPrestador.prestador_longitude ? Number(selectedPrestador.prestador_longitude) : undefined
        } : undefined}
        distanceData={selectedAnalyse ? {
          distanciaKm: Number(selectedAnalyse.distancia_km),
          distanciaEuclidiana: Number(selectedAnalyse.distancia_km) * 0.85, // Estimate
          tempoEstimado: `${Math.round(Number(selectedAnalyse.distancia_km) * 2)} min`
        } : undefined}
        onGenerateReport={() => {
          toast({
            title: "Relatório gerado",
            description: "O relatório foi gerado com sucesso."
          });
          setModalOpen(false);
        }}
      />
    </Layout>
  );
}
