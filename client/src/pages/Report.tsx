import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import ReportTable from '@/components/ReportTable';
import DetailModal from '@/components/DetailModal';
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

export default function Report() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedPrestadorId, setSelectedPrestadorId] = useState<number | null>(null);

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

  // Format report data
  const reportData = React.useMemo(() => {
    if (!clientesData || !prestadoresData || !analisesData) return [];
    
    const clientMap = new Map();
    
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
              ? cliente.nome.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase()
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Relatórios de Proximidade</h2>
        <p className="text-slate-500">Relatórios detalhados das análises de distância entre clientes e prestadores</p>
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
            <Button className="w-full" variant="outline">Gerar Relatório por UF</Button>
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

      {/* Report Table */}
      <div className="mt-6">
        <ReportTable 
          data={reportData}
          isLoading={isLoadingAnalises || isLoadingClientes || isLoadingPrestadores}
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
