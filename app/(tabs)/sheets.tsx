/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Search,
  BookOpen,
  Droplets,
  Calendar,
  ChevronRight,
  Bug,
} from "lucide-react-native";
import Colors from "../../constants/colors";
import { CROPS, CATEGORIES } from "@/constants/crops";
import { COMMON_DISEASES } from "@/constants/commonDiseases";

const { width } = Dimensions.get("window");

const CATEGORY_COLORS: Record<string, string> = {
  grain:     "#D4A843",
  fruit:     "#F87171",
  vegetable: "#34D399",
  legume:    "#818CF8",
};

const CATEGORY_TABS = [
  { id: "all",       label: "All",        color: Colors.light.tint },
  { id: "grain",     label: "Grains",     color: "#D4A843" },
  { id: "fruit",     label: "Fruits",     color: "#761f1f" },
  { id: "vegetable", label: "Vegetables", color: "#1f5541" },
  { id: "legume",    label: "Legumes",    color: "#151b50" },
];

function SheetRow({ crop, index }: { crop: any; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 320, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const accentColor = CATEGORY_COLORS[crop.category] ?? Colors.light.tint;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.sheetRow}
        onPress={() => router.push(`./sheet/${crop.id}`)}
        activeOpacity={0.85}
      >

        <View style={[styles.rowStripe, { backgroundColor: accentColor }]} />


        <Image source={{ uri: crop.image }} style={styles.rowThumb} />

        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={styles.rowName}>{crop.name}</Text>
            <View style={[styles.rowBadge, { backgroundColor: `${accentColor}22` }]}>
              <Text style={[styles.rowBadgeText, { color: accentColor }]}>
                {crop.category}
              </Text>
            </View>
          </View>

          <Text style={styles.rowNameFr}>{crop.nameFr} · {crop.nameAr}</Text>

          <View style={styles.rowMeta}>
            <View style={styles.metaItem}>
              <Calendar size={11} color={Colors.light.textSecondary} />
              <Text style={styles.metaText}>{crop.plantingSeason}</Text>
            </View>
            <View style={styles.metaItem}>
              <Droplets size={11} color="#60A5FA" />
              <Text style={styles.metaText}>{crop.waterNeeds}</Text>
            </View>
            <View style={styles.metaItem}>
              <Bug size={11} color="#F87171" />
              <Text style={styles.metaText}>{crop.diseases.length} diseases</Text>
            </View>
          </View>
        </View>

        <ChevronRight size={16} color={Colors.light.border} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SheetsScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(() => {
    let result = CROPS;
    if (activeCategory !== "all") result = result.filter((c) => c.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.nameAr.includes(q) ||
          c.nameFr.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [query, activeCategory]);

  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 110,
        }}
      >

        <View style={[styles.bookCover, { paddingTop: insets.top + 16 }]}>
          <View style={styles.coverTopRow}>
            <View style={styles.coverBadge}>
              <BookOpen size={14} color={Colors.light.tint} />
              <Text style={styles.coverBadgeText}>10 Entries</Text>
            </View>
          </View>

          <View style={styles.coverTitle}>
            <Text style={styles.coverEyebrow}>ALGERIAN AGRICULTURE</Text>
            <Text style={styles.coverH1}>Crop{"\n"}Field Guide</Text>
            <Text style={styles.coverSub}>
              Planting calendars · Water needs · Diseases
            </Text>
          </View>

          <View style={styles.ruledLines}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.ruledLine} />
            ))}
          </View>
        </View>


        <View style={styles.searchWrap}>
          <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
            <Search size={15} color={searchFocused ? Colors.light.tint : Colors.light.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search entries…"
              placeholderTextColor={Colors.light.textSecondary}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabList}
        >
          {CATEGORY_TABS.map((tab) => {
            const active = activeCategory === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  active && { borderBottomColor: tab.color, borderBottomWidth: 2.5 },
                ]}
                onPress={() => setActiveCategory(tab.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabText, active && { color: tab.color }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* lines*/}
        <View style={styles.countRow}>
          <View style={styles.countLine} />
          <Text style={styles.countText}>{filtered.length} entries found</Text>
          <View style={styles.countLine} />
        </View>

        <View style={styles.diseaseSection}>
          <View style={styles.diseaseHeader}>
            <Bug size={14} color={Colors.light.error} />
            <Text style={styles.diseaseHeaderTitle}>10 Most Common Diseases (Offline)</Text>
          </View>
          {COMMON_DISEASES.map((item) => (
            <View key={item.id} style={styles.diseaseAdviceCard}>
              <Text style={styles.diseaseName}>{item.name} · {item.crop}</Text>
              <Text style={styles.diseaseAdvice}>{item.advice}</Text>
            </View>
          ))}
        </View>

        {/* rows change design later*/}
        <View style={styles.rowList}>
          {filtered.map((crop, i) => (
            <SheetRow key={crop.id} crop={crop} index={i} />
          ))}

          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📖</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F4EE",
  },


  bookCover: {
    backgroundColor: Colors.light.text,
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  coverTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  coverBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  coverBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  coverTitle: {
    marginBottom: 20,
  },
  coverEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.tint,
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  coverH1: {
    fontSize: 40,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1.5,
    lineHeight: 44,
    marginBottom: 10,
  },
  coverSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 19,
  },
  ruledLines: {
    gap: 8,
  },
  ruledLine: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },


  searchWrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E5E0D8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchBoxFocused: {
    borderColor: Colors.light.tint,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  clearBtn: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },


  tabList: {
    paddingHorizontal: 20,
    gap: 4,
    paddingBottom: 0,
    paddingTop: 16,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
    marginRight: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },

  countRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 14,
  },
  countLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#DDD8D0",
  },
  countText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  diseaseSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  diseaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  diseaseHeaderTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.light.text,
  },
  diseaseAdviceCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8E3DB",
    borderRadius: 12,
    padding: 11,
    marginBottom: 8,
  },
  diseaseName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  diseaseAdvice: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 17,
  },

  rowList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8E3DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  rowStripe: {
    width: 4,
    alignSelf: "stretch",
  },
  rowThumb: {
    width: 72,
    height: 88,
    resizeMode: "cover",
  },
  rowContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowName: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  rowBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rowBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  rowNameFr: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  rowMeta: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },


  empty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});