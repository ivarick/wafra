import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Droplets, Leaf, Beaker, Calculator } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { api } from '@/data/sources/axiosInstance';

const CROP_DATA: Record<string, any> = {
  potato: {
    label: "🥔 Potato",
    stages: {
      fond: { N: 800, P: 0, K: 0, label: "Base (Fond)" },
      entretien: { N: 200, P: 0, K: 100, label: "Maintenance" },
    },
    water: 50000,
  },
  lettuce: {
    label: "🥬 Lettuce",
    stages: {
      fond: { N: 300, P: 200, K: 400, label: "Base (Fond)" },
    },
    water: 40000,
  },
  onion: {
    label: "🧅 Onion",
    stages: {
      fond: { N: 0, P: 800, K: 0, label: "Base (Fond)" },
    },
    water: 45000,
  },
  pepper: {
    label: "🫑 Pepper",
    stages: {
      fond: { N: 0, P: 600, K: 0, label: "Base (Fond)" },
      couverture: { N: 200, P: 0, K: 200, label: "Cover" },
    },
    water: 55000,
  },
  tomato: {
    label: "🍅 Tomato",
    stages: {
      fond: { N: 133, P: 133, K: 134, label: "Base (Fond)" },
    },
    water: 60000,
  },
};

export default function CalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [area, setArea] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // When crop changes, reset stage if it doesn't exist for the new crop
  useEffect(() => {
    if (selectedCrop) {
      const stages = Object.keys(CROP_DATA[selectedCrop].stages);
      if (stages.length > 0) {
        setSelectedStage(stages[0]);
      } else {
        setSelectedStage(null);
      }
    } else {
      setSelectedStage(null);
    }
  }, [selectedCrop]);

  const [results, setResults] = useState({ N: 0, P: 0, K: 0, water: 0 });

  useEffect(() => {
    const fetchCalculations = async () => {
      const areaNum = parseFloat(area);
      if (!selectedCrop || !selectedStage || isNaN(areaNum) || areaNum <= 0) {
        setResults({ N: 0, P: 0, K: 0, water: 0 });
        return;
      }
      try {
        const { data } = await api.post('/api/calculator/calculate/', {
          crop: selectedCrop,
          stage: selectedStage,
          area: areaNum
        });
        setResults({
          N: data.N || 0,
          P: data.P || 0,
          K: data.K || 0,
          water: data.water || 0
        });
      } catch (err) {
        console.error("Calculation failed:", err);
        setResults({ N: 0, P: 0, K: 0, water: 0 });
      }
    };
    
    // Simple debounce/timeout for typing
    const timeoutId = setTimeout(fetchCalculations, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedCrop, selectedStage, area]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header aligned with other pages */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>AgriCalc Pro</Text>
          <Text style={styles.headerSubtitle}>Smart Input Calculator</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim, gap: 16 }}>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>1. Select Crop</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {Object.keys(CROP_DATA).map((key) => {
                const isActive = selectedCrop === key;
                return (
                  <TouchableOpacity 
                    key={key} 
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedCrop(key)}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {CROP_DATA[key].label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionTitle, { marginTop: 24, opacity: selectedCrop ? 1 : 0.5 }]}>2. Growth Stage</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {selectedCrop ? Object.keys(CROP_DATA[selectedCrop].stages).map((key) => {
                const isActive = selectedStage === key;
                return (
                  <TouchableOpacity 
                    key={key} 
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedStage(key)}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {CROP_DATA[selectedCrop].stages[key].label}
                    </Text>
                  </TouchableOpacity>
                );
              }) : (
                <View style={[styles.chip, { opacity: 0.5 }]}>
                  <Text style={styles.chipText}>Select crop first...</Text>
                </View>
              )}
            </ScrollView>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>3. Cultivated Area (Hectares)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2.5"
              placeholderTextColor={Colors.light.textSecondary}
              keyboardType="decimal-pad"
              value={area}
              onChangeText={setArea}
            />
          </View>

          {/* Results Panel */}
          {results.N > 0 || results.P > 0 || results.K > 0 || results.water > 0 ? (
            <View style={styles.resultsPanel}>
              <View style={styles.resultsHeader}>
                <Calculator size={20} color={Colors.light.tint} />
                <Text style={styles.resultsTitle}>Recommended Outputs</Text>
              </View>
              
              <View style={styles.resultsGrid}>
                <View style={[styles.resultCard, { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.resultCardLabel, { color: '#3B82F6' }]}>Nitrogen (N)</Text>
                  <Text style={[styles.resultCardValue, { color: '#1D4ED8' }]}>{results.N.toLocaleString()} <Text style={styles.unit}>kg</Text></Text>
                </View>
                
                <View style={[styles.resultCard, { borderColor: '#FBCFE8', backgroundColor: '#FDF2F8' }]}>
                  <Text style={[styles.resultCardLabel, { color: '#EC4899' }]}>Phosphorus (P₂O₅)</Text>
                  <Text style={[styles.resultCardValue, { color: '#BE185D' }]}>{results.P.toLocaleString()} <Text style={styles.unit}>kg</Text></Text>
                </View>

                <View style={[styles.resultCard, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }]}>
                  <Text style={[styles.resultCardLabel, { color: '#D97706' }]}>Potassium (K₂O)</Text>
                  <Text style={[styles.resultCardValue, { color: '#B45309' }]}>{results.K.toLocaleString()} <Text style={styles.unit}>kg</Text></Text>
                </View>

                <View style={[styles.resultCard, { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF', width: '100%' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Droplets size={14} color="#0284C7" />
                    <Text style={[styles.resultCardLabel, { color: '#0284C7', marginBottom: 0 }]}>Daily Irrigation</Text>
                  </View>
                  <Text style={[styles.resultCardValue, { color: '#0369A1' }]}>{results.water.toLocaleString()} <Text style={styles.unit}>L</Text></Text>
                </View>
              </View>
            </View>
          ) : null}

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Match other pages' backgrounds
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.light.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipScroll: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: Colors.light.text,
  },
  resultsPanel: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  resultCard: {
    width: '48%',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  resultCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  resultCardValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
});