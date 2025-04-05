import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { AnaliseDistancia } from '@/lib/supabase';

interface ClienteWithPrestadores {
  clienteId: number;
  clienteNome: string;
  clienteUf: string;
  prestadores: {
    id: number;
    ranking: number;
    nome: string;
    distancia: number;
    local: string;
  }[];
}

interface AnalysisPanelProps {
  data: ClienteWithPrestadores[];
  isLoading: boolean;
  onShowDetails: (clienteId: number, prestadorId: number) => void;
  onFilterChange: (filters: FilterValues) => void;
}

interface FilterValues {
  uf: string;
  tipoServico: string;
  distanciaMaxima: number;
}

export default function AnalysisPanel({ 
  data,
  isLoading,
  onShowDetails,
  onFilterChange
}: AnalysisPanelProps) {
  const [filters, setFilters] = useState<FilterValues>({
    uf: 'Todos',
    tipoServico: 'Todos',
    distanciaMaxima: 15
  });

  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    onFilterChange(filters);
  };
  
  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-700">Análise de Proximidade</h3>
      </div>

      {/* Filter Controls */}
      <div className="p-4 border-b border-slate-200">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Filtrar por UF</label>
            <Select 
              value={filters.uf} 
              onValueChange={(value) => handleFilterChange('uf', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="SP">SP</SelectItem>
                <SelectItem value="RJ">RJ</SelectItem>
                <SelectItem value="DF">DF</SelectItem>
                <SelectItem value="MG">MG</SelectItem>
                <SelectItem value="RS">RS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Serviço</label>
            <Select 
              value={filters.tipoServico}
              onValueChange={(value) => handleFilterChange('tipoServico', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Hospitais">Hospitais</SelectItem>
                <SelectItem value="Clínicas">Clínicas</SelectItem>
                <SelectItem value="Laboratórios">Laboratórios</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Distância Máxima</label>
            <div className="flex items-center space-x-2">
              <Slider 
                min={1} 
                max={50} 
                step={1} 
                defaultValue={[filters.distanciaMaxima]}
                onValueChange={(value) => handleFilterChange('distanciaMaxima', value[0])}
                className="w-full"
              />
              <span className="text-sm text-slate-700 min-w-[30px]">{filters.distanciaMaxima}km</span>
            </div>
          </div>
        </div>
        <Button 
          className="mt-4 w-full bg-primary hover:bg-blue-700" 
          onClick={applyFilters}
        >
          Aplicar Filtros
        </Button>
      </div>

      {/* Client-Provider Analysis */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Prestadores mais próximos</h4>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Nenhum resultado encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((cliente) => (
              <div key={cliente.clienteId} className="mb-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-slate-800">{cliente.clienteNome}</h5>
                    <p className="text-xs text-slate-500">{cliente.clienteUf}</p>
                  </div>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">Cliente</span>
                </div>
                
                <div className="mt-3 space-y-2">
                  {cliente.prestadores.map((prestador) => (
                    <div key={prestador.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                      <div className="flex items-center">
                        <div className={`text-xs font-medium text-white ${prestador.ranking === 1 ? 'bg-green-600' : 'bg-blue-600'} w-5 h-5 rounded-full flex items-center justify-center mr-2`}>
                          {prestador.ranking}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{prestador.nome}</p>
                          <p className="text-xs text-slate-500">{prestador.distancia.toFixed(1)} km • {prestador.local}</p>
                        </div>
                      </div>
                      <button 
                        className="text-xs text-primary hover:text-blue-700"
                        onClick={() => onShowDetails(cliente.clienteId, prestador.id)}
                      >
                        Detalhes
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
