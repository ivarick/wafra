import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, ActivityIndicator, ScrollView, Platform } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ArrowLeft, Plus, Phone, Mail, MapPin, Building2, User } from 'lucide-react-native';
import * as Location from 'expo-location';
import Colors from '@/constants/colors';
import { api } from '@/data/sources/axiosInstance';

const { width, height } = Dimensions.get('window');

// Default to Algeria
const INITIAL_REGION = {
  latitude: 28.0339,
  longitude: 1.6596,
  latitudeDelta: 15.0,
  longitudeDelta: 15.0,
};

const FILTERS = [
  { id: 'all', label: 'All Centers' },
  { id: 'nearest', label: 'Nearest to Me' },
  { id: 'chamber', label: 'Chamber' },
  { id: 'cooperative', label: 'Cooperative' },
  { id: 'itdas', label: 'ITDAS' },
];

export default function MapComponent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [locators, setLocators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [selectedLocator, setSelectedLocator] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  // 1. Initial Load: Get user location and initial locators
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(coords);
        
        // Animate map to user
        mapRef.current?.animateToRegion({
          ...coords,
          latitudeDelta: 4.5,
          longitudeDelta: 4.5,
        }, 1000);
        
        // If nearest is already selected, fetch immediately once we have location
        if (activeFilter === 'nearest') fetchLocators('nearest', coords);
      }
    })();
  }, []);

  // 2. Fetch locators when screen comes into focus or filter changes
  useFocusEffect(
    useCallback(() => {
      fetchLocators(activeFilter, userLocation);
    }, [activeFilter, userLocation])
  );

  const fetchLocators = async (filter: string, location?: {latitude: number, longitude: number} | null) => {
    setLoading(true);
    try {
      let endpoint = '';
      if (filter === 'all') {
        endpoint = '/locator/all/';
      } else if (filter === 'nearest') {
        if (!location) {
          // If no location yet, don't try to fetch nearest, or fetch all as fallback
          setLoading(false);
          return;
        }
        endpoint = `/locator/nearest/?lat=${location.latitude}&lon=${location.longitude}&limit=10`;
      } else {
        endpoint = `/locator/all/?type=${filter}`;
      }
      
      const { data } = await api.get(endpoint);
      setLocators(data);
    } catch (err) {
      console.error('Failed to fetch locators:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handlers
  const handleMapPress = () => {
    // Tapping the map clears everything
    setSelectedLocation(null);
    setSelectedLocator(null);
  };

  const handleMapLongPress = (e: any) => {
    // Long pressing drops a new pin
    setSelectedLocator(null);
    setSelectedLocation(e.nativeEvent.coordinate);
  };

  const handleMarkerPress = (loc: any) => {
    setSelectedLocation(null);
    setSelectedLocator(loc);
  };

  const handleCreatePress = () => {
    if (selectedLocation) {
      router.push({
        pathname: '/create-locator',
        params: { lat: selectedLocation.latitude.toString(), lon: selectedLocation.longitude.toString() }
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'chamber': return '#3B82F6';
      case 'cooperative': return '#10B981';
      case 'itdas': return '#8B5CF6';
      default: return Colors.light.tint;
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        onPress={handleMapPress}
        onLongPress={handleMapLongPress}
        mapType="none" // we use UrlTile instead
      >
        <UrlTile
          urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        
        {/* User Location */}
        {userLocation && (
          <Marker coordinate={userLocation} pinColor="#000" title="You are here" />
        )}
        
        {/* Existing Locators */}
        {locators.map((loc) => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            onPress={(e) => {
              e.stopPropagation(); // prevent map onPress
              handleMarkerPress(loc);
            }}
            pinColor={getTypeColor(loc.type)}
          />
        ))}

        {/* Selected Location for new locator */}
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            pinColor={Colors.light.error}
            title="New Locator"
            description="Create a center here"
          />
        )}
      </MapView>

      {/* ─── Header ─── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aid Centers</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ─── Filters ─── */}
      {(!selectedLocation && !selectedLocator) && (
        <View style={[styles.filtersContainer, { top: insets.top + 80 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {FILTERS.map(f => (
              <TouchableOpacity 
                key={f.id}
                style={[styles.filterChip, activeFilter === f.id && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, activeFilter === f.id && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} style={styles.loadingSpinner} />
        </View>
      )}

      {/* ─── Create Button Overlay ─── */}
      {selectedLocation && (
        <View style={[styles.createContainer, { top: insets.top + 80 }]}>
          <TouchableOpacity style={styles.createBtn} onPress={handleCreatePress} activeOpacity={0.8}>
            <Plus size={20} color="#fff" />
            <Text style={styles.createBtnText}>Create Locator Here</Text>
          </TouchableOpacity>
        </View>
      )}

        {/* ─── Selected Locator Details Card ─── */}
      {selectedLocator && (
        <View style={[styles.detailsCard, { bottom: insets.bottom + 120 }]}>
          <View style={styles.detailsHeader}>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(selectedLocator.type) + '20' }]}>
              <Text style={[styles.typeBadgeText, { color: getTypeColor(selectedLocator.type) }]}>
                {selectedLocator.type.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeDetailsBtn} onPress={() => setSelectedLocator(null)}>
              <Text style={styles.closeDetailsText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.detailsName}>{selectedLocator.name}</Text>
          <Text style={styles.detailsWilaya}>{selectedLocator.wilaya}</Text>

          {selectedLocator.address ? (
            <View style={styles.detailsRow}>
              <MapPin size={16} color={Colors.light.textSecondary} />
              <Text style={styles.detailsRowText}>{selectedLocator.address}</Text>
            </View>
          ) : null}

          {selectedLocator.phone ? (
            <View style={styles.detailsRow}>
              <Phone size={16} color={Colors.light.textSecondary} />
              <Text style={styles.detailsRowText}>{selectedLocator.phone}</Text>
            </View>
          ) : null}

          <TouchableOpacity 
            style={styles.viewDetailsBtn} 
            activeOpacity={0.8}
            onPress={() => router.push(`/locator/${selectedLocator.id}`)}
          >
            <Text style={styles.viewDetailsText}>View Full Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
    backgroundColor: Colors.light.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  filtersContainer: {
    position: 'absolute',
    width: '100%',
    height: 40,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    backgroundColor: Colors.light.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    alignSelf: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.light.text,
    borderColor: Colors.light.text,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  loadingSpinner: {
    backgroundColor: Colors.light.card,
    padding: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  createContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.error,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  detailsCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  closeDetailsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeDetailsText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  detailsName: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.light.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  detailsWilaya: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailsRowText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  viewDetailsBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
