import mapboxgl from 'mapbox-gl';

// Mapbox access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZ3VpdmFuaGVsZGVuIiwiYSI6ImNtOGRpOHA0dTA2eXYybnB1cGZpdXE5amoifQ.AaT1j9pOdFhZwKS-H2Xfcw';

// Set up Mapbox access token
mapboxgl.accessToken = MAPBOX_TOKEN;

// Default center locations for major cities
export const CITY_COORDINATES = {
  'São Paulo': { lat: -23.5505, lng: -46.6333 },
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
  'Brasília': { lat: -15.7801, lng: -47.9292 }
};

export interface MapLocation {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  type: 'cliente' | 'prestador' | 'rede_atual';
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
 */
export function addMarkersToMap(map: mapboxgl.Map, locations: MapLocation[]): mapboxgl.Marker[] {
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
          : 'marker-rede-atual'
    }`;
    
    // Style the marker
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    
    // Cor para cada tipo de localização
    if (location.type === 'cliente') {
      el.style.backgroundColor = '#3b82f6'; // Azul
    } else if (location.type === 'prestador') {
      el.style.backgroundColor = '#ef4444'; // Vermelho
    } else if (location.type === 'rede_atual') {
      el.style.backgroundColor = '#f97316'; // Laranja
    }
    
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.2)';
    
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
 */
export function addProviderCircle(map: mapboxgl.Map, location: MapLocation, radiusKm = 7): void {
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
      'fill-color': '#ef4444',
      'fill-opacity': 0.15,
    }
  });

  map.addLayer({
    id: `circle-line-${location.id}`,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': '#ef4444',
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
