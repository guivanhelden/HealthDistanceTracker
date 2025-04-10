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
  focusCity?: keyof typeof CITY_COORDINATES;
  isLoading?: boolean;
  showClients?: boolean;
  showProviders?: boolean;
  showRedeAtual?: boolean;
  onToggleFilter?: (filterType: 'clients' | 'providers' | 'redeAtual') => void;
}

export default function MapView({ 
  clientLocations = [], 
  providerLocations = [], 
  redeAtualLocations = [],
  focusCity,
  isLoading = false,
  showClients = true,
  showProviders = true,
  showRedeAtual = true,
  onToggleFilter
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map on component mount
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Ensure map is initialized only once
    if (mapInstance.current) {
      cleanupMap(mapInstance.current);
    }

    try {
      // Define center coordinates with the correct type
      const defaultCenter: [number, number] = [
        CITY_COORDINATES['São Paulo'].lng, 
        CITY_COORDINATES['São Paulo'].lat
      ];
      
      // Initialize map with correctly typed parameters
      mapInstance.current = initializeMap('map', {
        center: defaultCenter,
        zoom: 10
      });

      // Set up load event
      mapInstance.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapReady(true);
      });
      
      // Handle error
      mapInstance.current.on('error', (e) => {
        console.error('Map error:', e.error);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    // Cleanup on unmount
    return () => {
      if (mapInstance.current) {
        cleanupMap(mapInstance.current);
        mapInstance.current = null;
      }
    };
  }, []);

  // Update map when locations change
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    
    // Filtra localizações com base nas opções de exibição
    const allLocations = [
      ...(showClients ? clientLocations : []),
      ...(showProviders ? providerLocations : []),
      ...(showRedeAtual ? redeAtualLocations : [])
    ];
    
    // Add markers for all locations
    const markers = addMarkersToMap(mapInstance.current, allLocations);
    
    // Add circle around each provider
    if (showProviders) {
      providerLocations.forEach(provider => {
        addProviderCircle(mapInstance.current!, provider, 7);
      });
    }
    
    // Fit map to show all locations
    if (allLocations.length > 0) {
      fitMapToBounds(mapInstance.current, allLocations);
    }
    
    // Clean up markers on unmount
    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [clientLocations, providerLocations, redeAtualLocations, mapReady, showClients, showProviders, showRedeAtual]);

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
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
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
              <div className="w-4 h-4 rounded border-2 border-red-300 bg-red-100 bg-opacity-30 mr-2"></div>
              <span className="text-xs text-slate-700">Área de 7km</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
