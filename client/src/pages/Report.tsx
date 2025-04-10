import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import ReportTable from '@/components/ReportTable';
import DetailModal from '@/components/DetailModal';
import ShareButton from '@/components/ShareButton';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Cliente, Prestador, AnaliseDistancia } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UF = 'TODOS' | 'SP' | 'RJ' | 'DF';

export default function Report() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedPrestadorId, setSelectedPrestadorId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<UF>('TODOS');

  // Fetch data
  const { data: clientesData, isLoading: isLoadingClientes } = useQuery<Cliente[]>({
    queryKey: ['/api/clientes'],
    staleTime: 60000 // 1 minute
  });

  const { data: prestadoresData, isLoading: isLoadingPrestadores } = useQuery<Prestador[]>({
    queryKey: ['/api/prestadores'],
    staleTime: 60000 // 1 minute
  });

  const { data: analisesData, isLoading: isLoadingAnalises } = useQuery<AnaliseDistancia[]>({
    queryKey: ['/api/analises'],
    staleTime: 60000 // 1 minute
  });

  // Format report data
  const reportData = React.useMemo(() => {
    if (!clientesData || !prestadoresData || !analisesData) return [];
    
    const clientMap = new Map<number, any>();
    
    // Group analyses by client
    analisesData.forEach((analise: AnaliseDistancia) => {
      if (!clientMap.has(analise.cliente_id)) {
        // Find client
        const cliente = clientesData.find((c: Cliente) => c.id === analise.cliente_id);
        if (!cliente) return;
        
        // Initialize client entry
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
      
      // Find provider
      const prestador = prestadoresData.find((p: Prestador) => p.id === analise.prestador_id);
      
      // Add provider to client's list if it's in the top 2
      if (analise.posicao_ranking <= 2) {
        const clientEntry = clientMap.get(analise.cliente_id);
        
        // Add provider info
        clientEntry.prestadores.push({
          id: analise.prestador_id,
          nome: analise.prestador_nome || (prestador?.nome_prestador || `Prestador ${analise.prestador_id}`),
          local: prestador?.municipio || analise.prestador_uf || '',
          distancia: Number(analise.distancia_km),
          ranking: analise.posicao_ranking
        });
        
        // Sort by ranking
        clientEntry.prestadores.sort((a: any, b: any) => a.ranking - b.ranking);
      }
    });
    
    // Convert map to array
    return Array.from(clientMap.values());
  }, [clientesData, prestadoresData, analisesData]);

  // Filter data by UF
  const filteredReportData = React.useMemo(() => {
    if (activeTab === 'TODOS') return reportData;
    return reportData.filter(item => item.cliente.uf === activeTab);
  }, [reportData, activeTab]);

  // Calcular estatísticas por UF
  const estatisticasPorUF = React.useMemo(() => {
    const stats: Record<string, { clientes: number, distanciaTotal: number, distanciaMedia: number }> = {
      'SP': { clientes: 0, distanciaTotal: 0, distanciaMedia: 0 },
      'RJ': { clientes: 0, distanciaTotal: 0, distanciaMedia: 0 },
      'DF': { clientes: 0, distanciaTotal: 0, distanciaMedia: 0 },
      'TODOS': { clientes: 0, distanciaTotal: 0, distanciaMedia: 0 }
    };
    
    reportData.forEach(item => {
      const uf = item.cliente.uf || 'Outros';
      if (item.prestadores[0]) {
        // Atualizar estatísticas do estado específico
        if (stats[uf]) {
          stats[uf].clientes++;
          stats[uf].distanciaTotal += item.prestadores[0].distancia;
        }
        
        // Atualizar estatísticas gerais
        stats['TODOS'].clientes++;
        stats['TODOS'].distanciaTotal += item.prestadores[0].distancia;
      }
    });
    
    // Calcular médias
    Object.keys(stats).forEach(uf => {
      if (stats[uf].clientes > 0) {
        stats[uf].distanciaMedia = stats[uf].distanciaTotal / stats[uf].clientes;
      }
    });
    
    return stats;
  }, [reportData]);

  // Handle showing detail modal
  const handleShowDetails = (clienteId: number, prestadorId: number) => {
    setSelectedClientId(clienteId);
    setSelectedPrestadorId(prestadorId);
    setModalOpen(true);
  };

  // Determine selected client and provider for modal
  const selectedClient = clientesData?.find((c: Cliente) => c.id === selectedClientId);
  const selectedPrestador = prestadoresData?.find((p: Prestador) => p.id === selectedPrestadorId);
  const selectedAnalyse = analisesData?.find(
    (a: AnaliseDistancia) => a.cliente_id === selectedClientId && a.prestador_id === selectedPrestadorId
  );

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Relatórios de Proximidade</h2>
          <p className="text-slate-500">Relatórios detalhados das análises de distância entre clientes e prestadores</p>
        </div>
        <div>
          <ShareButton 
            uf={activeTab}
            distanciaMaxima={15}
            variant="outline"
          />
        </div>
      </div>

      {/* Report Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Relatório Completo</CardTitle>
            <CardDescription>Todos os clientes e seus prestadores mais próximos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Visualize todos os clientes e os dois prestadores mais próximos para cada um, com informações detalhadas sobre distâncias.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => window.print()}>Imprimir Relatório</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Relatório por UF</CardTitle>
            <CardDescription>Filtre por estado para análise regional</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Gere relatórios específicos por UF para analisar a cobertura regional dos prestadores de saúde.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setActiveTab(activeTab === 'TODOS' ? 'SP' : 'TODOS')}
            >
              {activeTab === 'TODOS' ? 'Filtrar por UF' : 'Mostrar Todos'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Cobertura</CardTitle>
            <CardDescription>Análise de raio de cobertura</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Verifique a cobertura dos prestadores em diferentes raios de distância para otimizar a rede.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">Gerar Relatório de Cobertura</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Tabs for UF filtering */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as UF)}
        className="mb-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-slate-700">Proximidade Cliente-Prestador</h3>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="TODOS" className="data-[state=active]:bg-white">Todos</TabsTrigger>
            <TabsTrigger value="SP" className="data-[state=active]:bg-white">São Paulo</TabsTrigger>
            <TabsTrigger value="RJ" className="data-[state=active]:bg-white">Rio de Janeiro</TabsTrigger>
            <TabsTrigger value="DF" className="data-[state=active]:bg-white">Distrito Federal</TabsTrigger>
          </TabsList>
        </div>

        {/* Estatísticas resumidas para a UF selecionada */}
        {estatisticasPorUF[activeTab] && (
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-slate-500">Total de Clientes</p>
                <p className="text-2xl font-semibold text-slate-800">{estatisticasPorUF[activeTab].clientes}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Distância Média</p>
                <p className="text-2xl font-semibold text-slate-800">
                  {estatisticasPorUF[activeTab].distanciaMedia.toFixed(1)} km
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">UF</p>
                <p className="text-2xl font-semibold text-slate-800">
                  {activeTab === 'TODOS' ? 'Todos' : activeTab}
                </p>
              </div>
            </div>
          </div>
        )}

        <TabsContent value="TODOS" className="mt-0">
          <p className="text-sm text-slate-500 mb-4">
            Visualizando dados de todos os estados. Utilize as abas acima para filtrar por UF específica.
          </p>
          
          <ReportTable 
            data={reportData}
            isLoading={isLoadingAnalises || isLoadingClientes || isLoadingPrestadores}
            onShowDetails={handleShowDetails}
            uf="TODOS"
          />
        </TabsContent>
        
        <TabsContent value="SP" className="mt-0">
          <p className="text-sm text-slate-500 mb-4">
            Clientes localizados em São Paulo e seus prestadores mais próximos.
          </p>
          
          <ReportTable 
            data={filteredReportData}
            isLoading={isLoadingAnalises || isLoadingClientes || isLoadingPrestadores}
            onShowDetails={handleShowDetails}
            uf="SP"
          />
        </TabsContent>
        
        <TabsContent value="RJ" className="mt-0">
          <p className="text-sm text-slate-500 mb-4">
            Clientes localizados no Rio de Janeiro e seus prestadores mais próximos.
          </p>
          
          <ReportTable 
            data={filteredReportData}
            isLoading={isLoadingAnalises || isLoadingClientes || isLoadingPrestadores}
            onShowDetails={handleShowDetails}
            uf="RJ"
          />
        </TabsContent>
        
        <TabsContent value="DF" className="mt-0">
          <p className="text-sm text-slate-500 mb-4">
            Clientes localizados no Distrito Federal e seus prestadores mais próximos.
          </p>
          
          <ReportTable 
            data={filteredReportData}
            isLoading={isLoadingAnalises || isLoadingClientes || isLoadingPrestadores}
            onShowDetails={handleShowDetails}
            uf="DF"
          />
        </TabsContent>
      </Tabs>
      
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
