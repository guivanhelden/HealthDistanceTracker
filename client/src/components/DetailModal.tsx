import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientData?: {
    id: number;
    nome: string;
    uf: string;
    cep?: string;
    latitude?: number;
    longitude?: number;
  };
  prestadorData?: {
    id: number;
    nome: string;
    uf: string;
    cep?: string;
    latitude?: number;
    longitude?: number;
  };
  distanceData?: {
    distanciaKm: number;
    distanciaEuclidiana?: number;
    tempoEstimado?: string;
  };
  onGenerateReport: () => void;
}

export default function DetailModal({ 
  isOpen, 
  onClose, 
  clientData, 
  prestadorData,
  distanceData,
  onGenerateReport
}: DetailModalProps) {
  if (!clientData || !prestadorData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold text-slate-800">Detalhes da Análise</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Informações do Cliente</h4>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p><span className="text-sm font-medium text-slate-700">Nome:</span> <span className="text-sm text-slate-600">{clientData.nome}</span></p>
              <p><span className="text-sm font-medium text-slate-700">ID:</span> <span className="text-sm text-slate-600">{clientData.id}</span></p>
              <p><span className="text-sm font-medium text-slate-700">UF:</span> <span className="text-sm text-slate-600">{clientData.uf}</span></p>
              {clientData.cep && (
                <p><span className="text-sm font-medium text-slate-700">CEP:</span> <span className="text-sm text-slate-600">{clientData.cep}</span></p>
              )}
              {clientData.latitude && clientData.longitude && (
                <p><span className="text-sm font-medium text-slate-700">Coordenadas:</span> <span className="text-sm text-slate-600">{clientData.latitude}, {clientData.longitude}</span></p>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Informações do Prestador</h4>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p><span className="text-sm font-medium text-slate-700">Nome:</span> <span className="text-sm text-slate-600">{prestadorData.nome}</span></p>
              <p><span className="text-sm font-medium text-slate-700">ID:</span> <span className="text-sm text-slate-600">{prestadorData.id}</span></p>
              <p><span className="text-sm font-medium text-slate-700">UF:</span> <span className="text-sm text-slate-600">{prestadorData.uf}</span></p>
              {prestadorData.cep && (
                <p><span className="text-sm font-medium text-slate-700">CEP:</span> <span className="text-sm text-slate-600">{prestadorData.cep}</span></p>
              )}
              {prestadorData.latitude && prestadorData.longitude && (
                <p><span className="text-sm font-medium text-slate-700">Coordenadas:</span> <span className="text-sm text-slate-600">{prestadorData.latitude}, {prestadorData.longitude}</span></p>
              )}
            </div>
          </div>
        </div>
        
        {distanceData && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Detalhes da Distância</h4>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Distância Euclidiana</p>
                  <p className="text-base font-medium text-slate-800">{(distanceData.distanciaEuclidiana || distanceData.distanciaKm - 0.2).toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Distância por Rodovia</p>
                  <p className="text-base font-medium text-slate-800">{distanceData.distanciaKm.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tempo Estimado</p>
                  <p className="text-base font-medium text-slate-800">{distanceData.tempoEstimado || Math.round(distanceData.distanciaKm * 2) + " min"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Mapa de Rota</h4>
          <div className="h-64 bg-slate-200 rounded-lg flex items-center justify-center">
            <p className="text-slate-500">Mapa de rota seria exibido aqui</p>
          </div>
        </div>
        
        <DialogFooter className="flex justify-end space-x-2 border-t border-slate-200 pt-4 mt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={onGenerateReport}>
            Gerar Relatório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
