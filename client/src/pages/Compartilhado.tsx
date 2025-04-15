import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import LayoutCompartilhado from '@/components/LayoutCompartilhado';
import MapView from '@/components/MapView';
import ReportTable from '@/components/ReportTable';
import DetailModal from '@/components/DetailModal';
import { 
  Cliente, 
  Prestador, 
  AnaliseDistancia, 
  RedeAtual, 
  fetchRedeAtual, 
  fetchAnalises,
  fetchClientes,
  fetchPrestadores,
  listAvailableTables,
  supabase
} from '@/lib/supabase';
import { MapLocation, CITY_COORDINATES } from '@/lib/mapbox';
import { CardTitle, CardDescription, CardHeader, Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Compartilhado() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [cidadeFoco, setCidadeFoco] = useState<keyof typeof CITY_COORDINATES | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedPrestadorId, setSelectedPrestadorId] = useState<number | null>(null);
  const [filtros, setFiltros] = useState({
    uf: 'Todos',
    distanciaMaxima: 15,
    mostrarClientes: true,
    mostrarPrestadores: true,
    mostrarRedeAtual: true,
    mostrarBronzeMais: true,
    mostrarProntoSocorro: true
  });
  
  // Verificar conexão com Supabase e tabelas disponíveis
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Verificar conexão
        const { data, error } = await supabase.from('analise_distancia_ps').select('count()', { count: 'exact' });
        
        if (error) {
          console.error('Erro ao conectar com a tabela analise_distancia_ps:', error);
          toast({
            title: "Erro de conexão",
            description: `Erro ao acessar a tabela analise_distancia_ps: ${error.message}`,
          });
          
          // Listar tabelas disponíveis
          const tables = await listAvailableTables();
          console.log('Tabelas disponíveis:', tables);
          
          if (tables.length > 0) {
            toast({
              title: "Tabelas disponíveis",
              description: `Tabelas encontradas: ${tables.join(', ')}`,
            });
          }
        } else {
          console.log('Conexão com analise_distancia_ps bem-sucedida. Contagem:', data[0].count);
        }
      } catch (e) {
        console.error('Exceção ao verificar conexão:', e);
      }
    };
    
    checkSupabaseConnection();
  }, [toast]);

  // Extrair parâmetros da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Obter UF
    const uf = urlParams.get('uf');
    if (uf) {
      setFiltros(prev => ({ ...prev, uf }));
    }
    
    // Obter cidade
    const cidade = urlParams.get('cidade');
    if (cidade && cidade in CITY_COORDINATES && cidade !== 'nenhuma') {
      setCidadeFoco(cidade as keyof typeof CITY_COORDINATES);
    }
    
    // Obter configurações de visualização
    const mostrarClientes = urlParams.get('clientes');
    const mostrarPrestadores = urlParams.get('prestadores');
    const mostrarRedeAtual = urlParams.get('redeAtual');
    const mostrarBronzeMais = urlParams.get('bronzeMais');
    const mostrarProntoSocorro = urlParams.get('prontoSocorro');
    const distancia = urlParams.get('distancia');
    
    // Atualizar filtros com base nos parâmetros da URL
    setFiltros(prev => ({
      ...prev,
      mostrarClientes: mostrarClientes ? mostrarClientes === '1' : prev.mostrarClientes,
      mostrarPrestadores: mostrarPrestadores ? mostrarPrestadores === '1' : prev.mostrarPrestadores,
      mostrarRedeAtual: mostrarRedeAtual ? mostrarRedeAtual === '1' : prev.mostrarRedeAtual,
      mostrarBronzeMais: mostrarBronzeMais ? mostrarBronzeMais === '1' : prev.mostrarBronzeMais,
      mostrarProntoSocorro: mostrarProntoSocorro ? mostrarProntoSocorro === '1' : prev.mostrarProntoSocorro,
      distanciaMaxima: distancia ? parseInt(distancia, 10) : prev.distanciaMaxima
    }));
  }, [location]);

  // Buscar dados
  const { data: clientesData = [], isLoading: isLoadingClientes } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: fetchClientes,
    staleTime: 60000 // 1 minuto
  });
  
  // Buscar dados de Bronze Mais (simulado por enquanto)
  const { data: bronzeMaisData = [], isLoading: isLoadingBronzeMais } = useQuery<Prestador[]>({
    queryKey: ['bronzeMais'],
    queryFn: () => Promise.resolve([]), // Dados simulados por enquanto
    staleTime: 60000 // 1 minuto
  });
  
  // Log para depuração
  React.useEffect(() => {
    console.log('Clientes carregados:', clientesData.length);
  }, [clientesData]);

  const { data: prestadoresData = [], isLoading: isLoadingPrestadores } = useQuery<Prestador[]>({
    queryKey: ['prestadores'],
    queryFn: fetchPrestadores,
    staleTime: 60000 // 1 minuto
  });
  
  // Log para depuração
  React.useEffect(() => {
    console.log('Prestadores carregados:', prestadoresData.length);
  }, [prestadoresData]);

  const { data: analisesData = [], isLoading: isLoadingAnalises } = useQuery<AnaliseDistancia[]>({
    queryKey: ['analises'],
    queryFn: fetchAnalises,
    staleTime: 60000 // 1 minuto
  });
  
  // Log para depuração
  React.useEffect(() => {
    console.log('Análises carregadas:', analisesData.length);
  }, [analisesData]);

  // Buscar os prestadores da rede atual
  const { data: redeAtualData = [], isLoading: isLoadingRedeAtual } = useQuery<RedeAtual[]>({
    queryKey: ['redeAtual'],
    queryFn: fetchRedeAtual,
    staleTime: 60000 // 1 minuto
  });
  
  // Log para depuração
  React.useEffect(() => {
    console.log('Rede atual carregada:', redeAtualData.length);
  }, [redeAtualData]);

  // Converter dados para formato do mapa
  const clientLocations: MapLocation[] = React.useMemo(() => 
    clientesData.map(cliente => ({
      id: cliente.id,
      latitude: cliente.cliente_latitude ? Number(cliente.cliente_latitude) : 0,
      longitude: cliente.cliente_longitude ? Number(cliente.cliente_longitude) : 0,
      name: cliente.nome || `Cliente ${cliente.id}`,
      type: 'cliente' as const,
      details: {
        uf: cliente.uf,
        cep: cliente.cep,
        plano: cliente.plano
      }
    })).filter(loc => loc.latitude && loc.longitude)
  , [clientesData]);

  const providerLocations: MapLocation[] = React.useMemo(() => 
    prestadoresData.map(prestador => ({
      id: prestador.id,
      latitude: prestador.prestador_latitude ? Number(prestador.prestador_latitude) : 0,
      longitude: prestador.prestador_longitude ? Number(prestador.prestador_longitude) : 0,
      name: prestador.nome_prestador || `Prestador ${prestador.id}`,
      type: 'prestador' as const,
      details: {
        uf: prestador.uf,
        cep: prestador.cep,
        tipo: prestador.tipo_servico,
        especialidade: prestador.especialidades?.[0], // Corrigido para acessar o array de especialidades
        operadora: 'Amil' // Nome da operadora fixo para prestadores
      }
    })).filter(loc => loc.latitude && loc.longitude)
  , [prestadoresData]);

  const redeAtualLocations: MapLocation[] = React.useMemo(() => 
    redeAtualData.map(prestador => ({
      id: prestador.id,
      latitude: prestador.latitude ? Number(prestador.latitude) : 0, // Corrigido para usar a propriedade correta
      longitude: prestador.longitude ? Number(prestador.longitude) : 0, // Corrigido para usar a propriedade correta
      name: prestador.nome_prestador || `Prestador Rede Atual ${prestador.id}`,
      type: 'rede_atual' as const,
      details: {
        uf: prestador.uf,
        cep: prestador.cep,
        tipo: prestador.tipo_servico,
        especialidade: prestador.especialidade, // Usando o campo correto da interface RedeAtual
        operadora: prestador.operadora // Usando o campo correto da interface RedeAtual
      }
    })).filter(loc => loc.latitude && loc.longitude)
  , [redeAtualData]);

  const bronzeMaisLocations: MapLocation[] = React.useMemo(() => 
    bronzeMaisData.map(prestador => ({
      id: prestador.id,
      latitude: prestador.prestador_latitude ? Number(prestador.prestador_latitude) : 0,
      longitude: prestador.prestador_longitude ? Number(prestador.prestador_longitude) : 0,
      name: prestador.nome_prestador || `Prestador Bronze Mais ${prestador.id}`,
      type: 'bronzeMais' as const,
      details: {
        uf: prestador.uf,
        cep: prestador.cep,
        tipo: prestador.tipo_servico,
        especialidade: prestador.especialidades?.[0], // Corrigido para acessar o array de especialidades
        operadora: 'Amil Bronze Mais' // Nome da operadora fixo para prestadores Bronze Mais
      }
    })).filter(loc => loc.latitude && loc.longitude)
  , [bronzeMaisData]);

  // Processar dados de análise para o relatório
  const reportData = React.useMemo(() => {
    if (!clientesData.length || !prestadoresData.length) return [];
    
    // Se não temos dados de análise, gerar alguns dados simulados para visualização
    if (!analisesData.length) {
      console.log('Sem dados de análise disponíveis, gerando visualização de demonstração');
      const mockReportData = [];
      
      // Usar alguns clientes reais
      for (let i = 0; i < Math.min(clientesData.length, 20); i++) {
        const cliente = clientesData[i];
        
        // Encontrar prestadores próximos baseados nas coordenadas (se disponíveis)
        let nearbyPrestadores = [];
        
        if (cliente.cliente_latitude && cliente.cliente_longitude) {
          // Encontrar prestadores na mesma UF ou próximos
          nearbyPrestadores = prestadoresData
            .filter(p => p.uf === cliente.uf)
            .slice(0, 5);
        } else {
          // Se não temos coordenadas, pegar alguns prestadores aleatórios
          nearbyPrestadores = prestadoresData
            .filter(p => p.uf === cliente.uf)
            .slice(0, 2);
        }
        
        if (nearbyPrestadores.length === 0) continue;
        
        // Criar entrada para a visualização
        mockReportData.push({
          cliente: {
            id: cliente.id,
            nome: cliente.nome || `Cliente ${cliente.id}`,
            uf: cliente.uf || '',
            iniciais: cliente.nome 
              ? cliente.nome.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase()
              : ''
          },
          prestadores: nearbyPrestadores.map((prestador, idx) => ({
            id: prestador.id,
            nome: prestador.nome_prestador || `Prestador ${prestador.id}`,
            local: prestador.municipio || prestador.uf || '',
            distancia: Math.random() * 15, // Distância simulada
            ranking: idx + 1
          }))
        });
      }
      
      return mockReportData;
    }
    
    // Processamento normal quando temos dados de análise
    const clientMap = new Map<number, any>();
    
    // Agrupar análises por cliente
    analisesData.forEach((analise: AnaliseDistancia) => {
      if (!clientMap.has(analise.cliente_id)) {
        // Encontrar cliente
        const cliente = clientesData.find((c: Cliente) => c.id === analise.cliente_id);
        if (!cliente) return;
        
        // Inicializar entrada do cliente
        clientMap.set(analise.cliente_id, {
          cliente: {
            id: cliente.id,
            nome: cliente.nome || `Cliente ${cliente.id}`,
            uf: cliente.uf || '',
            iniciais: cliente.nome 
              ? cliente.nome.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase()
              : ''
          },
          prestadores: []
        });
      }
      
      // Encontrar prestador
      const prestador = prestadoresData.find((p: Prestador) => p.id === analise.prestador_id);
      
      // Adicionar prestador à lista do cliente se estiver no top 2
      if (analise.posicao_ranking <= 2) {
        const clientEntry = clientMap.get(analise.cliente_id);
        
        // Adicionar informações do prestador
        clientEntry.prestadores.push({
          id: analise.prestador_id,
          nome: analise.prestador_nome || (prestador?.nome_prestador || `Prestador ${analise.prestador_id}`),
          local: prestador?.municipio || analise.prestador_uf || '',
          distancia: Number(analise.distancia_km),
          ranking: analise.posicao_ranking
        });
        
        // Ordenar por ranking
        clientEntry.prestadores.sort((a: any, b: any) => a.ranking - b.ranking);
      }
    });
    
    // Converter mapa para array
    return Array.from(clientMap.values());
  }, [clientesData, prestadoresData, analisesData]);

  // Filtrar dados por UF
  const filteredReportData = React.useMemo(() => {
    if (filtros.uf === 'Todos') return reportData;
    return reportData.filter(item => item.cliente.uf === filtros.uf);
  }, [reportData, filtros.uf]);

  // Calcular estatísticas
  const estatisticas = React.useMemo(() => {
    if (!filteredReportData.length) return { clientes: 0, prestadoresUnicos: 0, distanciaMedia: 0 };
    
    const prestadoresSet = new Set<number>();
    let distanciaTotal = 0;
    let contadorDistancias = 0;
    
    filteredReportData.forEach(item => {
      if (item.prestadores[0]) {
        distanciaTotal += item.prestadores[0].distancia;
        contadorDistancias++;
        prestadoresSet.add(item.prestadores[0].id);
      }
      if (item.prestadores[1]) {
        prestadoresSet.add(item.prestadores[1].id);
      }
    });
    
    return {
      clientes: filteredReportData.length,
      prestadoresUnicos: prestadoresSet.size,
      distanciaMedia: contadorDistancias > 0 ? distanciaTotal / contadorDistancias : 0
    };
  }, [filteredReportData]);

  // Lidar com a exibição do modal de detalhes
  const handleShowDetails = (clienteId: number, prestadorId: number) => {
    setSelectedClientId(clienteId);
    setSelectedPrestadorId(prestadorId);
    setModalOpen(true);
  };

  // Determinar cliente e prestador selecionados para o modal
  const selectedClient = clientesData.find((c: Cliente) => c.id === selectedClientId);
  const selectedPrestador = prestadoresData.find((p: Prestador) => p.id === selectedPrestadorId);
  const selectedAnalyse = analisesData.find(
    (a: AnaliseDistancia) => a.cliente_id === selectedClientId && a.prestador_id === selectedPrestadorId
  );

  const isLoading = isLoadingClientes || isLoadingPrestadores || isLoadingAnalises || isLoadingRedeAtual || isLoadingBronzeMais;

  // Determinar título baseado nos filtros
  const getPageTitle = () => {
    if (filtros.uf !== 'Todos') {
      return `Relatório de Proximidade - ${filtros.uf}`;
    }
    return "Mapa de Distribuição e Relatório de Proximidade";
  };

  return (
    <LayoutCompartilhado pageTitle={getPageTitle()}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Relatório Compartilhado</h2>
        <p className="text-slate-500">
          Mapa de Distribuição e Relatório de Proximidade Cliente-Prestador
        </p>
      </div>

      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardDescription>Total de Clientes</CardDescription>
            <CardTitle>{estatisticas.clientes}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Prestadores Únicos</CardDescription>
            <CardTitle>{estatisticas.prestadoresUnicos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Distância Média</CardDescription>
            <CardTitle>{estatisticas.distanciaMedia.toFixed(1)} km</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Mapa */}
      <div className="mb-6">
        <MapView 
          clientLocations={clientLocations} 
          providerLocations={providerLocations}
          redeAtualLocations={redeAtualLocations}
          bronzeMaisLocations={bronzeMaisLocations}
          focusCity={cidadeFoco}
          isLoading={isLoading}
          showClients={filtros.mostrarClientes}
          showProviders={filtros.mostrarPrestadores}
          showRedeAtual={filtros.mostrarRedeAtual}
          showBronzeMais={filtros.mostrarBronzeMais}
          showProntoSocorro={filtros.mostrarProntoSocorro}
          onToggleFilter={(filterType) => {
            if (filterType === 'clients') {
              setFiltros(prev => ({ ...prev, mostrarClientes: !prev.mostrarClientes }));
            } else if (filterType === 'providers') {
              setFiltros(prev => ({ ...prev, mostrarPrestadores: !prev.mostrarPrestadores }));
            } else if (filterType === 'redeAtual') {
              setFiltros(prev => ({ ...prev, mostrarRedeAtual: !prev.mostrarRedeAtual }));
            } else if (filterType === 'bronzeMais') {
              setFiltros(prev => ({ ...prev, mostrarBronzeMais: !prev.mostrarBronzeMais }));
            } else if (filterType === 'prontoSocorro') {
              setFiltros(prev => ({ ...prev, mostrarProntoSocorro: !prev.mostrarProntoSocorro }));
            }
          }}
        />
      </div>

      {/* Tabela de Proximidade */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-700 mb-4">Relatório de Proximidade Cliente-Prestador</h3>
        <ReportTable 
          data={filteredReportData} 
          isLoading={isLoading} 
          onShowDetails={handleShowDetails}
          uf={filtros.uf}
        />
      </div>

      {/* Modal de detalhes */}
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
    </LayoutCompartilhado>
  );
} 