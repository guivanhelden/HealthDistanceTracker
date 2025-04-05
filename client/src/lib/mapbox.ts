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
  type: 'cliente' | 'prestador';
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
  const defaultOptions = {
    center: [CITY_COORDINATES['São Paulo'].lng, CITY_COORDINATES['São Paulo'].lat],
    zoom: 10,
    style: 'mapbox://styles/mapbox/streets-v11'
  };

  const mapOptions = { ...defaultOptions, ...options };

  return new mapboxgl.Map({
    container: containerId,
    ...mapOptions
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
    el.className = `marker ${location.type === 'cliente' ? 'marker-client' : 'marker-provider'}`;
    
    // Style the marker
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = location.type === 'cliente' ? '#3b82f6' : '#ef4444';
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.2)';
    
    // Create a popup with location info
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div>
          <h3 class="font-bold text-sm mb-1">${location.name}</h3>
          <p class="text-xs text-gray-600">${location.type === 'cliente' ? 'Cliente' : 'Prestador'}</p>
          ${location.details?.uf ? `<p class="text-xs mt-1">UF: ${location.details.uf}</p>` : ''}
          ${location.details?.cep ? `<p class="text-xs">CEP: ${location.details.cep}</p>` : ''}
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
 * Adds a circle around a provider indicating coverage area
 */
export function addProviderCircle(map: mapboxgl.Map, location: MapLocation, radiusKm = 7): void {
  // Check if the map has the source already
  const sourceId = `circle-${location.id}`;
  if (map.getSource(sourceId)) {
    return;
  }

  map.addSource(sourceId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      },
      properties: {}
    }
  });

  map.addLayer({
    id: `circle-fill-${location.id}`,
    type: 'circle',
    source: sourceId,
    paint: {
      'circle-radius': {
        stops: [
          [0, 0],
          [10, radiusKm * 100], // Scale the radius based on zoom level
          [15, radiusKm * 500]
        ],
        base: 2
      },
      'circle-color': '#ef4444',
      'circle-opacity': 0.15,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ef4444',
      'circle-stroke-opacity': 0.5
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
