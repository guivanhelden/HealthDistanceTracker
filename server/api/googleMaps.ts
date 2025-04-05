import { z } from 'zod';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyCUkiOKvorfH6hVfw7Z1uiVQkKPv-XVt7w';
const GEOCODE_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const DISTANCE_MATRIX_BASE_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

// Schema for Geocode response 
const geocodeResultSchema = z.object({
  results: z.array(
    z.object({
      geometry: z.object({
        location: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
      }),
      formatted_address: z.string(),
    })
  ),
  status: z.string(),
});

// Schema for Distance Matrix response
const distanceMatrixResultSchema = z.object({
  rows: z.array(
    z.object({
      elements: z.array(
        z.object({
          distance: z.object({
            text: z.string(),
            value: z.number(),
          }),
          duration: z.object({
            text: z.string(),
            value: z.number(),
          }),
          status: z.string(),
        })
      ),
    })
  ),
  status: z.string(),
});

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
}

export interface DistanceResult {
  distanceKm: number;
  durationMinutes: number;
  distanceText: string;
  durationText: string;
}

/**
 * Geocode an address to get its coordinates
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const url = `${GEOCODE_BASE_URL}?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    const parsedData = geocodeResultSchema.parse(data);
    
    if (parsedData.status !== 'OK' || parsedData.results.length === 0) {
      console.error('Geocoding error:', parsedData.status);
      return null;
    }
    
    const location = parsedData.results[0].geometry.location;
    
    return {
      lat: location.lat,
      lng: location.lng,
      address: parsedData.results[0].formatted_address,
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Get the distance and duration between two points using the Distance Matrix API
 */
export async function getDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DistanceResult | null> {
  try {
    const origins = `${originLat},${originLng}`;
    const destinations = `${destLat},${destLng}`;
    const url = `${DISTANCE_MATRIX_BASE_URL}?origins=${origins}&destinations=${destinations}&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Distance Matrix request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    const parsedData = distanceMatrixResultSchema.parse(data);
    
    if (parsedData.status !== 'OK' || 
        parsedData.rows.length === 0 || 
        parsedData.rows[0].elements.length === 0 ||
        parsedData.rows[0].elements[0].status !== 'OK') {
      console.error('Distance Matrix error:', parsedData.status);
      return null;
    }
    
    const element = parsedData.rows[0].elements[0];
    
    return {
      distanceKm: element.distance.value / 1000, // Convert meters to kilometers
      durationMinutes: Math.ceil(element.duration.value / 60), // Convert seconds to minutes
      distanceText: element.distance.text,
      durationText: element.duration.text,
    };
  } catch (error) {
    console.error('Error getting distance:', error);
    return null;
  }
}

/**
 * Calculates the distance between two points using the Haversine formula (fallback method)
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  // Convert coordinates from degrees to radians
  const toRad = (value: number) => (value * Math.PI) / 180;
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Number(distance.toFixed(2)); // Return to 2 decimal places
}
