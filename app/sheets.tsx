import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  CalendarDays,
  Droplets,
  ArrowUpRight,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { CROPS, CATEGORIES, type Crop } from '@/constants/crops';
import { COMMON_DISEASES } from '@/constants/commonDiseases';

function CropListCard({ crop }: { crop: Crop }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`./sheet/${crop.id}` as any)}
      style={styles.cardWrapper}
    >
      <ImageBackground
        source={{ uri: crop.image }}
        style={styles.card}
        imageStyle={styles.cardImage}
      >
        <View style={styles.cardOverlay} />
        <View style={styles.cardContent}>
          <View style={styles.cardMeta}>
            <View style={styles.cardSeasonBadge}>
              <CalendarDays size={10} color="rgba(255,255,255,0.85)" />
              <Text style={styles.cardSeasonText}>{crop.plantingSeason}</Text>
            </View>
          </View>
          
          <Text style={styles.cardTitle}>{crop.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{crop.description}</Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.cardWater}>
              <Droplets size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.cardWaterText}>{crop.waterNeeds}</Text>
            </View>
            <View style={styles.cardArrow}>
              <ArrowUpRight size={16} color={Colors.light.tint} />
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default function SheetsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredCrops = useMemo(() => {
    let list = activeCategory === "all" ? CROPS : CROPS.filter((c) => c.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.nameAr.includes(q) ||
          c.nameFr.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.diseases.some((d) => d.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crop Fact Sheets</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Search */}
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Search size={16} color={searchFocused ? Colors.light.tint : Colors.light.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search crops, diseases, season…"
            placeholderTextColor={Colors.light.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryPill, active && styles.categoryPillActive]}
                  onPress={() => setActiveCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* List */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          <View style={styles.diseaseSection}>
            <Text style={styles.diseaseSectionTitle}>10 Most Common Diseases (Offline)</Text>
            {COMMON_DISEASES.map((item) => (
              <View key={item.id} style={styles.diseaseCard}>
                <Text style={styles.diseaseName}>{item.name} · {item.crop}</Text>
                <Text style={styles.diseaseAdvice}>{item.advice}</Text>
              </View>
            ))}
          </View>

          {filteredCrops.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyText}>No crops found for "{searchQuery}"</Text>
            </View>
          ) : (
            filteredCrops.map(crop => (
              <CropListCard key={crop.id} crop={crop} />
            ))
          )}
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  searchBarFocused: { borderColor: Colors.light.tint },
  searchInput: { flex: 1, fontSize: 15, color: Colors.light.text },
  clearBtn: { fontSize: 13, color: Colors.light.textSecondary },
  
  categoryList: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 20,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  categoryPillActive: {
    backgroundColor: Colors.light.text,
    borderColor: Colors.light.text,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  categoryTextActive: { color: "#fff" },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  diseaseSection: {
    marginBottom: 4,
  },
  diseaseSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 10,
  },
  diseaseCard: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  diseaseName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 3,
  },
  diseaseAdvice: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 17,
  },
  cardWrapper: {
    width: "100%",
  },
  card: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  cardImage: { borderRadius: 20 },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 20 },
  cardContent: {
    padding: 16,
    paddingTop: 40,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardMeta: { flexDirection: "row", marginBottom: 6 },
  cardSeasonBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  cardSeasonText: { fontSize: 10, color: "rgba(255,255,255,0.9)", fontWeight: "600" },
  cardTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.3, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardWater: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardWaterText: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  cardArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },

  emptyState: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, color: Colors.light.textSecondary },
});
