import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import MapComponent from '@/components/MapComponent';

const MOCK_CENTERS = [
  {
    id: 1,
    name: "Chambre d'Agriculture Wilaya d'Alger",
    type: "chamber",
    wilaya: "Alger",
    address: "12 Rue Colonel Amirouche, Alger",
    latitude: 36.7667,
    longitude: 3.0487,
    phone: "021 73 14 55",
    email: "contact@ca-alger.dz"
  },
  {
    id: 2,
    name: "Coopérative Agricole de la Mitidja",
    type: "cooperative",
    wilaya: "Blida",
    address: "Zone Industrielle Ben Boulaid, Blida",
    latitude: 36.4800,
    longitude: 2.8275,
    phone: "025 20 12 34",
    email: "info@coop-mitidja.dz"
  },
  {
    id: 3,
    name: "ITDAS Biskra",
    type: "itdas",
    wilaya: "Biskra",
    address: "Route de Tolga, Biskra",
    latitude: 34.8430,
    longitude: 5.7225,
    phone: "033 74 22 11",
    email: "itdas.biskra@gmail.com"
  },
  {
    id: 4,
    name: "Chambre d'Agriculture Wilaya de Sétif",
    type: "chamber",
    wilaya: "Sétif",
    address: "Avenue du 1er Novembre, Sétif",
    latitude: 36.1898,
    longitude: 5.4108,
    phone: "036 82 45 67",
    email: "cas@setif.dz"
  },
  {
    id: 5,
    name: "Coopérative Céréalière de Tiaret",
    type: "cooperative",
    wilaya: "Tiaret",
    address: "Route d'Alger, Tiaret",
    latitude: 35.3710,
    longitude: 1.3160,
    phone: "046 42 11 88",
    email: "cc-tiaret@ccls.dz"
  }
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setLoading(false);
          return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      } catch (err) {
        // Fallback to Algiers if simulator doesn't have location
        setLocation({
          coords: {
            latitude: 36.75,
            longitude: 3.05,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getPinColor = (type: string) => {
    switch (type) {
      case 'chamber': return '#F59E0B'; // Amber
      case 'cooperative': return '#10B981'; // Green
      case 'itdas': return '#3B82F6'; // Blue
      default: return '#EF4444'; // Red
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'chamber': return 'Chamber of Agriculture';
      case 'cooperative': return 'Cooperative';
      case 'itdas': return 'ITDAS Center';
      default: return 'Center';
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Aid Center Locator</Text>
          <Text style={styles.headerSubtitle}>Find nearby agricultural support centers</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
            <Text style={styles.loaderText}>Finding your location...</Text>
          </View>
        ) : errorMsg && !location ? (
          <View style={styles.loaderWrap}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : location ? (
          <MapComponent 
            location={location} 
            centers={MOCK_CENTERS} 
            getPinColor={getPinColor} 
            getTypeLabel={getTypeLabel} 
            styles={styles} 
          />
        ) : null}
      </View>

      <View style={[styles.legend, { bottom: insets.bottom + 90 }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Chamber</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Co-op</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>ITDAS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.light.card,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTitleWrap: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 15,
  },
  callout: {
    width: 220,
    padding: 10,
  },
  calloutType: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.tint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 6,
  },
  calloutAddress: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  calloutContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  calloutContact: {
    fontSize: 11,
    color: '#4B5563',
  },
  legend: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
});
