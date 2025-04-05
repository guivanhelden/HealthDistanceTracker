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
  focusCity?: keyof typeof CITY_COORDINATES;
  isLoading?: boolean;
}

export default function MapView({ 
  clientLocations = [], 
  providerLocations = [], 
  focusCity,
  isLoading = false
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map on component mount
  useEffect(() => {
    if (!mapContainer.current) return;

    mapInstance.current = initializeMap('map', {
      center: [CITY_COORDINATES['São Paulo'].lng, CITY_COORDINATES['São Paulo'].lat],
      zoom: 10
    });

    mapInstance.current.on('load', () => {
      setMapReady(true);
    });

    // Cleanup on unmount
    return () => {
      if (mapInstance.current) {
        cleanupMap(mapInstance.current);
      }
    };
  }, []);

  // Update map when locations change
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    
    const allLocations = [...clientLocations, ...providerLocations];
    
    // Add markers for all locations
    const markers = addMarkersToMap(mapInstance.current, allLocations);
    
    // Add circle around each provider
    providerLocations.forEach(provider => {
      addProviderCircle(mapInstance.current!, provider, 7);
    });
    
    // Fit map to show all locations
    if (allLocations.length > 0) {
      fitMapToBounds(mapInstance.current, allLocations);
    }
    
    // Clean up markers on unmount
    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [clientLocations, providerLocations, mapReady]);

  // Focus on specific city when requested
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !focusCity) return;
    focusMapOnCity(mapInstance.current, focusCity);
  }, [focusCity, mapReady]);

  return (
    <div className="rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
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
              <div className="w-4 h-4 rounded border-2 border-red-300 bg-red-100 bg-opacity-30 mr-2"></div>
              <span className="text-xs text-slate-700">Área de 7km</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
