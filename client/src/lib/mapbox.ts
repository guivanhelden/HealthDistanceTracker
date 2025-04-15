import mapboxgl from 'mapbox-gl';

// Configurar o token do Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoiZ3VpdmFuaGVsZGVuIiwiYSI6ImNtOGRpOHA0dTA2eXYybnB1cGZpdXE5amoifQ.AaT1j9pOdFhZwKS-H2Xfcw';

// Coordenadas de cidades importantes
export const CITY_COORDINATES = {
  'São Paulo': { lat: -23.5505, lng: -46.6333 },
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
  'Brasília': { lat: -15.7801, lng: -47.9292 }
} as const;

export interface MapLocation {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  type: 'cliente' | 'prestador' | 'rede_atual' | 'bronzeMais';
  details?: Record<string, any>;
}

/**
 * Initializes a Mapbox map in the specified container
 */
export function initializeMap(containerId: string, options: { 
  center?: [number, number],
  zoom?: number,
  style?: string
} = {}): mapboxgl.Map {
  // Default coordinates for São Paulo
  const defaultCenter: [number, number] = [
    CITY_COORDINATES['São Paulo'].lng, 
    CITY_COORDINATES['São Paulo'].lat
  ];
  
  // Default map options
  const defaultZoom = 10;
  const defaultStyle = 'mapbox://styles/mapbox/streets-v11';
  
  // Create new map instance
  return new mapboxgl.Map({
    container: containerId,
    center: options.center || defaultCenter,
    zoom: options.zoom || defaultZoom,
    style: options.style || defaultStyle
  });
}

/**
 * Adds markers for clients and providers to the map
 * @param map - The mapbox map instance
 * @param locations - Array of locations to add markers for
 * @param showProntoSocorro - Whether to show pronto socorro markers (default: true)
 */
export function addMarkersToMap(map: mapboxgl.Map, locations: MapLocation[], showProntoSocorro = true): mapboxgl.Marker[] {
  const markers: mapboxgl.Marker[] = [];

  locations.forEach(location => {
    // Skip if location doesn't have valid coordinates
    if (!location.latitude || !location.longitude) return;

    // Create element for marker
    const el = document.createElement('div');
    el.className = `marker ${
      location.type === 'cliente'
        ? 'marker-client'
        : location.type === 'prestador'
          ? 'marker-provider'
          : location.type === 'rede_atual'
            ? 'marker-rede-atual'
            : location.type === 'bronzeMais'
              ? 'marker-bronze-mais'
              : ''
    }`;
    
    // Style the marker
    el.style.width = location.type === 'cliente' ? '25px' : '20px';
    el.style.height = location.type === 'cliente' ? '25px' : '20px';
    
    // Verificar se é prestador de pronto socorro adulto
    const isProntoSocorro = location.details?.especialidade === 'PRONTO SOCORRO ADULTO';
    
    // Se for Pronto Socorro e showProntoSocorro for false, pular este marcador
    if (isProntoSocorro && !showProntoSocorro) {
      return;
    }
    
    if (isProntoSocorro) {
      // Usar emoji de ambulância
      el.style.borderRadius = '50%';
      el.style.width = '40px';
      el.style.height = '40px';
      // Usar emoji de ambulância
      el.innerHTML = '🚑';
      el.style.fontSize = '36px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.background = 'white';
      
      // Adicionar borda colorida para diferenciar os tipos
      if (location.type === 'prestador') {
        el.style.border = '3px solid #ef4444'; // Vermelho para Prestadores
      } else if (location.type === 'rede_atual') {
        el.style.border = '3px solid #f97316'; // Laranja para Prestadores Rede Atual
      }
      
      el.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.2)';
    } else if (location.type === 'cliente') {
      // Usar ícone de pessoa para cliente
      el.style.borderRadius = '0';
      el.style.background = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233b82f6" width="25" height="25"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>')`;      
      el.style.backgroundSize = 'cover';
      el.style.border = '0';
      el.style.boxShadow = 'none';
    } else {
      // Cor normal para outros tipos
      el.style.borderRadius = '50%';
      
      // Cor para cada tipo de localização
      if (location.type === 'prestador') {
        el.style.backgroundColor = '#ef4444'; // Vermelho
      } else if (location.type === 'rede_atual') {
        el.style.backgroundColor = '#f97316'; // Laranja
      } else if (location.type === 'bronzeMais') {
        el.style.backgroundColor = '#800020'; // Bordô
      }
      
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.2)';
    }
    
    // Create a popup with location info
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div>
          <h3 class="font-bold text-sm mb-1">${location.name}</h3>
          <p class="text-xs text-gray-600">${
            location.type === 'cliente' 
              ? 'Cliente' 
              : location.type === 'prestador' 
                ? 'Prestador' 
                : 'Prestador Rede Atual'
          }</p>
          ${location.details?.uf ? `<p class="text-xs mt-1">UF: ${location.details.uf}</p>` : ''}
          ${location.details?.cep ? `<p class="text-xs">CEP: ${location.details.cep}</p>` : ''}
          ${location.details?.plano ? `<p class="text-xs">Plano: ${location.details.plano}</p>` : ''}
          ${location.details?.especialidade ? `<p class="text-xs">Especialidade: ${location.details.especialidade}</p>` : ''}
        </div>
      `);

    // Create and add the marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([location.longitude, location.latitude])
      .setPopup(popup)
      .addTo(map);
    
    markers.push(marker);
  });

  return markers;
}

/**
 * Creates a circular polygon with given km radius around a center point
 */
function createGeoJSONCircle(center: [number, number], radiusKm: number): GeoJSON.Feature {
  const points = 64; // Number of points for the circle
  const km = radiusKm;
  const distanceX = km / (111.320 * Math.cos(center[1] * Math.PI / 180));
  const distanceY = km / 110.574;

  let coordinates: [number, number][] = [];
  
  // Generate points in a circle
  for (let i = 0; i < points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const x = center[0] + distanceX * Math.cos(angle);
    const y = center[1] + distanceY * Math.sin(angle);
    coordinates.push([x, y]);
  }
  
  // Close the circle
  coordinates.push(coordinates[0]);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    },
    properties: {}
  };
}

/**
 * Adds a circle around a provider indicating coverage area
 * @param map - The mapbox map instance
 * @param location - The location to add circle for
 * @param radiusKm - Radius in kilometers (default: 7)
 * @param color - Optional color for the circle (default: #ef4444)
 */
export function addProviderCircle(map: mapboxgl.Map, location: MapLocation, radiusKm = 7, color = '#ef4444'): void {
  // Check if the map has the source already
  const sourceId = `circle-${location.id}`;
  if (map.getSource(sourceId)) {
    return;
  }

  // Create a GeoJSON circle with accurate radius in kilometers
  const circleFeature = createGeoJSONCircle(
    [location.longitude, location.latitude], 
    radiusKm
  );

  map.addSource(sourceId, {
    type: 'geojson',
    data: circleFeature as any
  });

  map.addLayer({
    id: `circle-fill-${location.id}`,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': color,
      'fill-opacity': 0.15,
    }
  });

  map.addLayer({
    id: `circle-line-${location.id}`,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': color,
      'line-width': 1,
      'line-opacity': 0.5
    }
  });
}

/**
 * Fit map to show all markers
 */
export function fitMapToBounds(map: mapboxgl.Map, locations: MapLocation[]): void {
  if (locations.length === 0) return;

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(location => {
    if (location.latitude && location.longitude) {
      bounds.extend([location.longitude, location.latitude]);
    }
  });

  map.fitBounds(bounds, {
    padding: 50,
    maxZoom: 12
  });
}

/**
 * Focus map on a specific city
 */
export function focusMapOnCity(map: mapboxgl.Map, city: keyof typeof CITY_COORDINATES): void {
  const coords = CITY_COORDINATES[city];
  if (!coords) return;
  
  map.flyTo({
    center: [coords.lng, coords.lat],
    zoom: 10,
    essential: true
  });
}

/**
 * Clean up map resources
 */
export function cleanupMap(map: mapboxgl.Map): void {
  if (map) {
    map.remove();
  }
}
