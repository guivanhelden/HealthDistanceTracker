import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { 
  initializeMap, 
  addMarkersToMap, 
  addProviderCircle, 
  fitMapToBounds,
  focusMapOnCity,
  cleanupMap,
  MapLocation,
  CITY_COORDINATES
} from '@/lib/mapbox';

interface MapViewProps {
  clientLocations?: MapLocation[];
  providerLocations?: MapLocation[];
  redeAtualLocations?: MapLocation[];
  bronzeMaisLocations?: MapLocation[];
  focusCity?: keyof typeof CITY_COORDINATES;
  isLoading?: boolean;
  showClients?: boolean;
  showProviders?: boolean;
  showRedeAtual?: boolean;
  showBronzeMais?: boolean;
  showProntoSocorro?: boolean;
  onToggleFilter?: (filterType: 'clients' | 'providers' | 'redeAtual' | 'bronzeMais' | 'prontoSocorro') => void;
}

export default function MapView({ 
  clientLocations = [], 
  providerLocations = [], 
  redeAtualLocations = [],
  bronzeMaisLocations = [],
  focusCity,
  isLoading = false,
  showClients = true,
  showProviders = true,
  showRedeAtual = true,
  showBronzeMais = true,
  showProntoSocorro = true,
  onToggleFilter
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map on component mount
  useEffect(() => {
    if (!mapContainer.current) {
      console.error('MapView: Referência do container não encontrada');
      return;
    }
    
    console.log('MapView: Inicializando mapa', { 
      mapContainerExists: !!mapContainer.current,
      mapboxgl: !!mapboxgl
    });
    
    // Ensure map is initialized only once
    if (mapInstance.current) {
      console.log('MapView: Limpando instância de mapa existente');
      cleanupMap(mapInstance.current);
    }

    try {
      // Define center coordinates with the correct type
      const defaultCenter: [number, number] = [
        CITY_COORDINATES['São Paulo'].lng, 
        CITY_COORDINATES['São Paulo'].lat
      ];
      
      console.log('MapView: Criando nova instância de mapa com coordenadas', defaultCenter);
      
      // Verificar se o token do Mapbox foi configurado
      if (!mapboxgl.accessToken) {
        console.error('MapView: Token do Mapbox não configurado');
        mapboxgl.accessToken = 'pk.eyJ1IjoiZ3VpdmFuaGVsZGVuIiwiYSI6ImNtOGRpOHA0dTA2eXYybnB1cGZpdXE5amoifQ.AaT1j9pOdFhZwKS-H2Xfcw';
      }
      
      // Initialize map with correctly typed parameters
      mapInstance.current = initializeMap('map', {
        center: defaultCenter,
        zoom: 10
      });

      // Set up load event
      mapInstance.current.on('load', () => {
        console.log('MapView: Mapa carregado com sucesso');
        setMapReady(true);
      });
      
      // Handle error
      mapInstance.current.on('error', (e) => {
        console.error('MapView: Erro no mapa:', e.error);
      });
    } catch (error) {
      console.error('MapView: Erro ao inicializar o mapa:', error);
    }

    // Cleanup on unmount
    return () => {
      if (mapInstance.current) {
        cleanupMap(mapInstance.current);
        mapInstance.current = null;
      }
    };
  }, []);

  // Referências para os círculos criados
  const providerCircleRefs = useRef<{[key: string]: boolean}>({});
  const bronzeMaisCircleRefs = useRef<{[key: string]: boolean}>({});
  
  // Função para limpar círculos existentes
  const clearCircles = (circleType: 'provider' | 'bronzeMais') => {
    if (!mapInstance.current) return;
    
    const refs = circleType === 'provider' ? providerCircleRefs.current : bronzeMaisCircleRefs.current;
    
    // Remover fontes e camadas existentes
    Object.keys(refs).forEach(id => {
      const sourceId = `circle-${id}`;
      const fillLayerId = `circle-fill-${id}`;
      const lineLayerId = `circle-line-${id}`;
      
      try {
        if (mapInstance.current!.getLayer(fillLayerId)) {
          mapInstance.current!.removeLayer(fillLayerId);
        }
        
        if (mapInstance.current!.getLayer(lineLayerId)) {
          mapInstance.current!.removeLayer(lineLayerId);
        }
        
        if (mapInstance.current!.getSource(sourceId)) {
          mapInstance.current!.removeSource(sourceId);
        }
      } catch (e) {
        console.error(`Erro ao remover círculo ${id}:`, e);
      }
    });
    
    // Limpar referências
    if (circleType === 'provider') {
      providerCircleRefs.current = {};
    } else {
      bronzeMaisCircleRefs.current = {};
    }
  };

  // Efeito para remover círculos quando os filtros mudam
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    
    // Se o filtro de prestadores está desativado, remover todos os círculos de prestadores
    if (!showProviders) {
      clearCircles('provider');
    }
    
    // Se o filtro de Bronze Mais está desativado, remover todos os círculos de Bronze Mais
    if (!showBronzeMais) {
      clearCircles('bronzeMais');
    }
    
    return () => {
      // Limpar círculos ao desmontar o componente
      if (mapInstance.current) {
        clearCircles('provider');
        clearCircles('bronzeMais');
      }
    };
  }, [showProviders, showBronzeMais, mapReady]);

  // Update map when locations change
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    
    // Limpar círculos existentes antes de adicionar novos
    clearCircles('provider');
    clearCircles('bronzeMais');
    
    // Filtra localizações com base nas opções de exibição
    const allLocations = [
      ...(showClients ? clientLocations : []),
      ...(showProviders ? providerLocations : []),
      ...(showRedeAtual ? redeAtualLocations : []),
      ...(showBronzeMais ? bronzeMaisLocations : [])
    ];
    
    // Add markers for all locations
    const markers = addMarkersToMap(mapInstance.current, allLocations, showProntoSocorro);
    
    // Add circle around each provider
    if (showProviders) {
      providerLocations.forEach(provider => {
        addProviderCircle(mapInstance.current!, provider, 7);
        providerCircleRefs.current[provider.id] = true;
      });
    }
    
    // Círculo para Bronze Mais
    if (showBronzeMais) {
      bronzeMaisLocations.forEach(b => {
        addProviderCircle(mapInstance.current!, b, 7, '#800020'); // Bordô
        bronzeMaisCircleRefs.current[b.id] = true;
      });
    }
    
    // Removido o ajuste automático de zoom ao alterar filtros
    // if (allLocations.length > 0) {
    //   fitMapToBounds(mapInstance.current, allLocations);
    // }
    
    // Clean up markers on unmount
    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [clientLocations, providerLocations, redeAtualLocations, bronzeMaisLocations, mapReady, showClients, showProviders, showRedeAtual, showBronzeMais, showProntoSocorro]);

  // Focus on specific city when requested
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !focusCity) return;
    focusMapOnCity(mapInstance.current, focusCity);
  }, [focusCity, mapReady]);

  return (
    <div className="rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-700">Mapa de Distribuição</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => mapInstance.current && focusMapOnCity(mapInstance.current, 'São Paulo')}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-2 rounded"
            >
              São Paulo
            </button>
            <button 
              onClick={() => mapInstance.current && focusMapOnCity(mapInstance.current, 'Rio de Janeiro')}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-2 rounded"
            >
              Rio de Janeiro
            </button>
            <button 
              onClick={() => mapInstance.current && focusMapOnCity(mapInstance.current, 'Brasília')}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-2 rounded"
            >
              Brasília
            </button>
          </div>
        </div>

        {/* Filtros de visualização */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onToggleFilter && onToggleFilter('clients')}
            className={`text-xs py-1 px-2 rounded flex items-center gap-1 ${
              showClients 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            Clientes
          </button>
          
          <button
            onClick={() => onToggleFilter && onToggleFilter('providers')}
            className={`text-xs py-1 px-2 rounded flex items-center gap-1 ${
              showProviders 
                ? 'bg-red-100 text-red-700 border border-red-200' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            Prestadores
          </button>
          
          <button
            onClick={() => onToggleFilter && onToggleFilter('redeAtual')}
            className={`text-xs py-1 px-2 rounded flex items-center gap-1 ${
              showRedeAtual 
                ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            Prestadores Rede Atual
          </button>
          
          <button
            onClick={() => onToggleFilter && onToggleFilter('bronzeMais')}
            className={`text-xs py-1 px-2 rounded flex items-center gap-1 ${
              showBronzeMais 
                ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
            aria-label="Alternar visualização de Prestadores Bronze Mais"
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#800020' }}></div>
            Prestadores Bronze Mais
          </button>
          
          {/* Botão para alternar visualização de Pronto Socorro */}
          <button
            onClick={() => {
              // Chamar o onToggleFilter para prontoSocorro se estiver definido
              if (onToggleFilter) {
                onToggleFilter('prontoSocorro');
              }
            }}
            className={`text-xs py-1 px-2 rounded flex items-center gap-1 ${
              showProntoSocorro 
                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
            aria-label="Alternar visualização de Pronto Socorro"
          >
            <div className="w-6 h-6 flex items-center justify-center text-lg">🚑</div>
            Pronto Socorro
          </button>
        </div>
      </div>

      <div className="relative">
        <div id="map" ref={mapContainer} className="w-full h-[500px] bg-slate-200 rounded-b-lg">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 bg-opacity-80 z-10">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-2"></div>
                <p className="text-slate-700">Carregando mapa...</p>
              </div>
            </div>
          )}
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md">
          <h4 className="text-sm font-semibold mb-2">Legenda</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <div 
                className="w-6 h-6 mr-2"
                style={{ 
                  background: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233b82f6" width="24" height="24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>')`,
                  backgroundSize: 'cover'
                }}
              ></div>
              <span className="text-xs text-slate-700">Clientes</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span className="text-xs text-slate-700">Prestadores</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
              <span className="text-xs text-slate-700">Prestadores Rede Atual</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#800020' }}></div>
              <span className="text-xs text-slate-700">Prestadores Bronze Mais</span>
            </div>
            <div className="flex items-center">
              <div 
                className="w-6 h-6 mr-2 flex items-center justify-center"
                style={{ fontSize: '18px' }}
              >
                🚑
              </div>
              <span className="text-xs text-slate-700">Pronto Socorro</span>
            </div>
            <div className="flex items-center">
              <div 
                className="w-6 h-6 mr-2 flex items-center justify-center"
                style={{ fontSize: '18px' }}
              >
                🚑
              </div>
              <span className="text-xs text-slate-700">Pronto Socorro Rede Atual</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded border-2 border-red-300 bg-red-100 bg-opacity-30 mr-2"></div>
              <span className="text-xs text-slate-700">Área de 7km</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
