// Google Maps API configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  defaultCenter: {
    lat: 51.505,
    lng: -0.09
  },
  defaultZoom: 13,
  libraries: ['places'] as ('places' | 'drawing' | 'geometry' | 'localContext' | 'visualization')[],
  options: {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: true,
  }
};