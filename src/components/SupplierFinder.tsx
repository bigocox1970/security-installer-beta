import React, { useState, useEffect } from 'react';
import { MapPin, Store, Coffee, Zap, Shield } from 'lucide-react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { supabase } from '../lib/supabase';

interface SupplierFinderProps {
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

interface Supplier {
  position: google.maps.LatLngLiteral;
  name: string;
  type: string;
  address?: string;
  rating?: number;
  placeId?: string;
}

interface SupplierType {
  id: string;
  value: string;
  label: string;
  icon: string;
  search_query: string;
  search_terms: string[];
  search_radius: number;
}

const iconMap: { [key: string]: any } = {
  Shield,
  Coffee,
  Zap,
  Store
};

function SupplierFinder({ onAuthRequired, isAuthenticated }: SupplierFinderProps) {
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral>({ lat: 51.505, lng: -0.09 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>([]);

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
  };

  const options = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: true,
  };

  useEffect(() => {
    fetchSupplierTypes();
  }, []);

  const fetchSupplierTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_settings')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSupplierTypes(data || []);
    } catch (err) {
      console.error('Error fetching supplier types:', err);
    }
  };

  const searchNearbyPlaces = (location: google.maps.LatLngLiteral, type: string) => {
    if (!map) return;

    const service = new google.maps.places.PlacesService(map);
    const selectedType = supplierTypes.find(t => t.value === type);
    
    if (!selectedType) return;

    const searchPromises = selectedType.search_terms.map(term => {
      return new Promise<google.maps.places.PlaceResult[]>((resolve) => {
        const request = {
          location: location,
          radius: selectedType.search_radius,
          keyword: term,
        };

        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else {
            resolve([]);
          }
        });
      });
    });

    Promise.all(searchPromises).then(resultsArray => {
      const uniqueResults = Array.from(
        new Map(
          resultsArray.flat().map(place => [place.place_id, place])
        ).values()
      );

      const newSuppliers = uniqueResults.map(place => ({
        position: {
          lat: place.geometry?.location?.lat() || 0,
          lng: place.geometry?.location?.lng() || 0,
        },
        name: place.name || '',
        type: type,
        address: place.vicinity || '',
        rating: place.rating,
        placeId: place.place_id,
      }));

      setSuppliers(newSuppliers);
    });
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setIsLoading(false);
          if (selectedSupplier && map) {
            searchNearbyPlaces(location, selectedSupplier);
          }
        },
        () => {
          setIsLoading(false);
        }
      );
    } else {
      setIsLoading(false);
    }
  }, [map]);

  useEffect(() => {
    if (selectedSupplier && map) {
      searchNearbyPlaces(userLocation, selectedSupplier);
    }
  }, [selectedSupplier]);

  const handleMarkerClick = (supplier: Supplier) => {
    if (!map || !supplier.placeId) return;

    const service = new google.maps.places.PlacesService(map);
    service.getDetails(
      {
        placeId: supplier.placeId,
        fields: ['name', 'formatted_address', 'rating', 'formatted_phone_number', 'website'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          setSelectedMarker({
            ...supplier,
            address: place.formatted_address || supplier.address,
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <MapPin className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Find a Supplier</h2>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Supplier Type
            </label>
            <select
              id="supplier"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a supplier type</option>
              {Array.isArray(supplierTypes) && supplierTypes.map((supplier) => (
                <option key={supplier.id} value={supplier.value}>
                  {supplier.label}
                </option>
              ))}
            </select>
          </div>

          <div className="h-[400px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={userLocation}
              zoom={13}
              options={options}
              onLoad={map => setMap(map)}
            >
              <Marker
                position={userLocation}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                }}
              />

              {suppliers.map((supplier, index) => (
                <Marker
                  key={index}
                  position={supplier.position}
                  onClick={() => handleMarkerClick(supplier)}
                  icon={{
                    url: `https://maps.google.com/mapfiles/ms/icons/${
                      supplier.type === 'security' ? 'red' :
                      supplier.type === 'electrical' ? 'yellow' : 'green'
                    }-dot.png`,
                  }}
                />
              ))}

              {selectedMarker && (
                <InfoWindow
                  position={selectedMarker.position}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div style={{ color: '#000000' }} className="p-2">
                    <h3 className="font-semibold" style={{ color: '#000000' }}>{selectedMarker.name}</h3>
                    <p className="text-sm mt-1" style={{ color: '#374151' }}>{selectedMarker.address}</p>
                    {selectedMarker.rating && (
                      <p className="text-sm mt-1" style={{ color: '#374151' }}>Rating: {selectedMarker.rating} ⭐</p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {Array.isArray(supplierTypes) && supplierTypes.map((supplier) => {
              const Icon = iconMap[supplier.icon];
              return (
                <button
                  key={supplier.id}
                  onClick={() => setSelectedSupplier(supplier.value)}
                  className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors ${
                    selectedSupplier === supplier.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    selectedSupplier === supplier.value
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    selectedSupplier === supplier.value
                      ? 'text-indigo-900 dark:text-indigo-200'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {supplier.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplierFinder;