/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ImageBackground,
  Dimensions,
  TextInput,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from 'expo-location';
import { router } from "expo-router";
import {
  Bell,
  Search,
  Droplets,
  Sprout,
  CalendarDays,
  ChevronRight,
  ArrowUpRight,
  MapPin,
  Menu,
  X,
  User,
  Settings,
  Calculator,
  HelpCircle,
  LogOut,
  FileText,
  BookMarked,
  Images,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { CROPS, CATEGORIES, type Crop } from "@/constants/crops";
import { useAuth } from "../../hooks/useAuth";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import type { Lang } from "@/constants/i18n";
import type { DiseaseRiskAssessment } from "@/utils/diseaseRiskEngine";
import { fetchChatbot } from "@/utils/chatbotApi";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.46;
const CARD_WIDTH = width * 0.54;
const DRAWER_WIDTH = width * 0.76;

/* ───────────────────────────── Drawer ──────────────────────── */

interface DrawerProps {
  visible: boolean;
  slideAnim: Animated.Value;
  overlayAnim: Animated.Value;
  onClose: () => void;
  insets: { top: number; bottom: number };
}

function SideDrawer({ visible, slideAnim, overlayAnim, onClose, insets }: DrawerProps) {
  const { user, signOut } = useAuth();
  if (!visible) return null;

  const menuItems = [
    { icon: User, label: "Account", route: "/account" },
    { icon: MapPin, label: "Map & Locators", route: "/map" },
    { icon: Images, label: "Community Gallery", route: "/gallery" },
    { icon: BookMarked, label: "Field Journal", route: "/journal" },
    { icon: FileText, label: "Weekly Reports", route: "/reports" },
    { icon: Calculator, label: "Calculator", route: "/calculator" },
    { icon: Settings, label: "Settings", route: "/settings" },
  ] as const;

  return (
    <>
      {/* Dimmed overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[drawerStyles.overlay, { opacity: overlayAnim }]} />
      </TouchableWithoutFeedback>

      {/* Drawer panel */}
      <Animated.View
        style={[
          drawerStyles.panel,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 70,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={drawerStyles.panelHeader}>
          <View>
            <Text style={drawerStyles.panelName}>{user?.name || "User"}</Text>
            <Text style={drawerStyles.panelEmail}>{user?.email || ""}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={drawerStyles.closeBtn}>
            <X size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={drawerStyles.divider} />

        {/* Nav items */}
        <View style={drawerStyles.navSection}>
          {menuItems.map(({ icon: Icon, label, route }) => (
            <TouchableOpacity
              key={label}
              style={drawerStyles.navItem}
              onPress={() => {
                onClose();
                setTimeout(() => router.push(route as any), 280);
              }}
              activeOpacity={0.75}
            >
              <View style={drawerStyles.navIconWrap}>
                <Icon size={18} color={Colors.light.tint} />
              </View>
              <Text style={drawerStyles.navLabel}>{label}</Text>
              <ChevronRight size={16} color={Colors.light.border} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom: FAQ + Sign Out */}
        <View style={drawerStyles.bottomSection}>
          <TouchableOpacity
            style={drawerStyles.navItem}
            onPress={() => {
              onClose();
              setTimeout(() => router.push("/faq" as any), 280);
            }}
            activeOpacity={0.75}
          >
            <View style={drawerStyles.navIconWrap}>
              <HelpCircle size={18} color={Colors.light.accent} />
            </View>
            <Text style={drawerStyles.navLabel}>FAQ</Text>
            <ChevronRight size={16} color={Colors.light.border} style={{ marginLeft: "auto" }} />
          </TouchableOpacity>

          <View style={drawerStyles.divider} />

          <TouchableOpacity
            style={[drawerStyles.navItem, drawerStyles.signOutItem]}
            activeOpacity={0.75}
            onPress={async () => {
              onClose();
              await signOut();
              router.replace("/login");
            }}
          >
            <View style={[drawerStyles.navIconWrap, drawerStyles.signOutIconWrap]}>
              <LogOut size={18} color={Colors.light.error} />
            </View>
            <Text style={drawerStyles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const drawerStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.light.overlay,
    zIndex: 10,
  },
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.light.card,
    zIndex: 11,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    paddingHorizontal: 20,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  panelName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.light.text,
    letterSpacing: -0.4,
  },
  panelEmail: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 8,
  },
  navSection: {
    marginTop: 8,
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  navIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
  },
  navLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  bottomSection: {
    marginTop: "auto",
    gap: 4,
  },
  signOutItem: {
    marginTop: 4,
  },
  signOutIconWrap: {
    backgroundColor: "#FEE2E2",
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.error,
  },
});

/* ───────────────────────────── Crop Card ───────────────────── */

function CropCard({ crop, index }: { crop: Crop; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 90, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 90, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[styles.cardWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`./sheet/${crop.id}`)}>
        <ImageBackground
          source={{ uri: crop.image }}
          style={styles.card}
          imageStyle={styles.cardImage}
        >
          <View style={styles.cardOverlay} />
          <View style={styles.cardContent}>
            <View style={styles.cardMeta}>
              <View style={styles.cardSeasonBadge}>
                <CalendarDays size={9} color="rgba(255,255,255,0.85)" />
                <Text style={styles.cardSeasonText}>{crop.plantingSeason}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{crop.name}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{crop.description}</Text>
            <View style={styles.cardFooter}>
              <View style={styles.cardWater}>
                <Droplets size={11} color="rgba(255,255,255,0.7)" />
                <Text style={styles.cardWaterText}>{crop.waterNeeds}</Text>
              </View>
              <View style={styles.cardArrow}>
                <ArrowUpRight size={16} color={Colors.light.tint} />
              </View>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <View style={styles.statPillIcon}>{icon}</View>
      <View>
        <Text style={styles.statPillValue}>{value}</Text>
        <Text style={styles.statPillLabel}>{label}</Text>
      </View>
    </View>
  );
}

/* ─────────────────────────── Home Screen ───────────────────── */

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { lang, setLang } = useAppLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [currentWeather, setCurrentWeather] = useState("21 °C");
  const [currentLocation, setCurrentLocation] = useState("Algeria");
  const [riskAssessment, setRiskAssessment] = useState<DiseaseRiskAssessment | null>(null);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Fetch Location & Weather
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        
        let loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;

        // Fetch Wilaya via OpenStreetMap Nominatim
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const wilaya = geoData.address.state || geoData.address.city || geoData.address.county || "Algeria";
          setCurrentLocation(wilaya);
        }

        // Fetch Weather via Open-Meteo
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          const temp = Math.round(weatherData.current_weather.temperature);
          setCurrentWeather(`${temp} °C`);
        }

        // Hyper-local risk forecast via backend (production-style: /weather -> /risk)
        const weatherRes2 = await fetchChatbot(`/weather?lat=${lat}&lon=${lon}`);
        if (weatherRes2.ok) {
          const weather = await weatherRes2.json();
          const riskRes = await fetchChatbot("/risk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ crop: "tomato", weather }),
          });
          if (riskRes.ok) {
            const risk = await riskRes.json();
            const risks = Array.isArray(risk.risks) ? risk.risks : [];
            const level =
              risks.some((r: any) => r.level === "high") ? "high" :
              risks.some((r: any) => r.level === "medium") ? "medium" : "low";
            const score = level === "high" ? 78 : level === "medium" ? 48 : 22;
            const assessment: DiseaseRiskAssessment = {
              level,
              score,
              crop: "Tomato",
              stage: "vegetative",
              summary: risk.message || "Local risk computed from weather signals.",
              timeline: risk.timeline || "Risk stable in next 24-48h",
              badge: level === "high" ? "RED" : level === "medium" ? "YELLOW" : "GREEN",
              drivers: risks.slice(0, 3).map((r: any) => ({
                id: r.type,
                label:
                  r.type === "fungal"
                    ? "Fungal risk"
                    : r.type === "bacterial"
                      ? "Bacterial risk"
                      : r.type === "heat_stress"
                        ? "Heat stress"
                        : String(r.type),
                level: r.level,
                score: Math.round((r.confidence ?? 0.6) * 50),
                reason: "",
              })),
            };
            setRiskAssessment(assessment);
          }
        }
      } catch (e) {
        console.log('Error fetching weather/location', e);
      }
    })();
  }, []);

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.spring(drawerAnim, {
        toValue: -DRAWER_WIDTH,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

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

  const riskTone = useMemo(() => {
    const level = riskAssessment?.level ?? "low";
    if (level === "high") {
      return { dot: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", emoji: "🔴", label: "HIGH" };
    }
    if (level === "medium") {
      return { dot: "#CA8A04", bg: "#FFFBEB", border: "#FCD34D", text: "#854D0E", emoji: "🟡", label: "MEDIUM" };
    }
    return { dot: "#16A34A", bg: "#F0FDF4", border: "#86EFAC", text: "#166534", emoji: "🟢", label: "LOW" };
  }, [riskAssessment]);
  const t = {
    en: {
      hi: "Hi,",
      welcome: "Welcome to",
      myFields: "My Fields",
      sub: "Algerian crops database",
      seeAll: "See All",
      search: "Search crops, diseases, season...",
      riskTitle: "Hyper-Local Disease Risk",
      riskForecast: "Forecast Intelligence",
      riskScore: "Risk score",
    },
    fr: {
      hi: "Salut,",
      welcome: "Bienvenue sur",
      myFields: "Mes Champs",
      sub: "Base de cultures algeriennes",
      seeAll: "Voir tout",
      search: "Rechercher culture, maladie, saison...",
      riskTitle: "Risque maladie local",
      riskForecast: "Intelligence meteo",
      riskScore: "Score de risque",
    },
    ar: {
      hi: "مرحبا،",
      welcome: "مرحبا بك في",
      myFields: "حقولي",
      sub: "قاعدة بيانات المحاصيل الجزائرية",
      seeAll: "عرض الكل",
      search: "ابحث عن محصول او مرض او موسم...",
      riskTitle: "خطر الامراض المحلي",
      riskForecast: "تحليل التوقعات",
      riskScore: "مؤشر الخطر",
    },
  }[lang];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        {/* ─── Hero ─── */}
        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&h=600&fit=crop" }}
          style={[styles.hero, { height: HERO_HEIGHT + insets.top }]}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroGrad1} />
          <View style={styles.heroGrad2} />

          <Animated.View
            style={[styles.heroInner, { paddingTop: insets.top + 16, opacity: heroAnim }]}
          >
            {/* Top row: Burger + Bell */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroProfile}>
                {/* Burger menu replaces avatar */}
                <TouchableOpacity
                  onPress={openDrawer}
                  style={styles.burgerBtn}
                  activeOpacity={0.8}
                >
                  <Menu size={22} color="#fff" />
                </TouchableOpacity>
                <View>
                  <Text style={styles.heroHi}>{t.hi}</Text>
                  <Text style={styles.heroName}>{user?.name || "User"}</Text>
                </View>
              </View>
              <View style={styles.heroActions}>
                <View style={styles.langSwitch}>
                  {(["en", "fr", "ar"] as Lang[]).map((itemLang) => (
                    <TouchableOpacity
                      key={itemLang}
                      style={[styles.langChip, lang === itemLang && styles.langChipActive]}
                      onPress={() => setLang(itemLang)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.langChipText, lang === itemLang && styles.langChipTextActive]}>
                        {itemLang.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Title block */}
            <View style={styles.heroTitleBlock}>
              <Text style={styles.heroTitle}>{t.welcome}</Text>
              <Text style={styles.heroTitleBold}>WAFRA</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.locationText}>{currentLocation} · Spring Season</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <StatPill icon={<Sprout size={14} color="#A3E635" />} label="weather" value={currentWeather} />
              <View style={styles.statDivider} />
              <StatPill icon={<Droplets size={14} color="#67E8F9" />} label="Soil Moisture" value="62%" />
              <View style={styles.statDivider} />
              <StatPill icon={<CalendarDays size={14} color="#FDE68A" />} label="today" value="44" />
            </View>
          </Animated.View>
        </ImageBackground>

        {/* ─── Body ─── */}
        <Animated.View style={[styles.body, { opacity: contentAnim }]}>
          <View
            style={[
              styles.riskCard,
              { backgroundColor: riskTone.bg, borderColor: riskTone.border },
            ]}
          >
            <View style={styles.riskHeader}>
              <View>
                <Text style={styles.riskEyebrow}>{t.riskForecast}</Text>
                <Text style={styles.riskTitle}>{t.riskTitle}</Text>
              </View>
              <View style={styles.riskBadgeWrap}>
                <Text style={styles.riskBadgeEmoji}>{riskTone.emoji}</Text>
                <Text style={[styles.riskBadgeText, { color: riskTone.text }]}>{riskTone.label}</Text>
              </View>
            </View>

            <Text style={styles.riskSubLine}>Tomato · vegetative stage · {currentLocation}</Text>

            <View style={styles.riskScoreRow}>
              <Text style={styles.riskScoreLabel}>{t.riskScore}</Text>
              <Text style={[styles.riskScoreValue, { color: riskTone.text }]}>
                {riskAssessment?.score ?? 0}/100
              </Text>
            </View>
            <View style={styles.riskMeterTrack}>
              <View
                style={[
                  styles.riskMeterFill,
                  {
                    width: `${riskAssessment?.score ?? 0}%`,
                    backgroundColor: riskTone.dot,
                  },
                ]}
              />
            </View>

            <Text style={styles.riskSummary}>
              {riskAssessment?.summary ??
                "Loading local weather-driven risk signals..."}
            </Text>
            <Text style={[styles.riskTimeline, { color: riskTone.text }]}>
              {riskAssessment?.timeline ?? "Computing 48h risk trend..."}
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t.myFields}</Text>
              <Text style={styles.sectionSub}>{t.sub}</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllBtn}
              activeOpacity={0.7}
              onPress={() => router.push("/sheets")}
            >
              <Text style={styles.seeAllText}>{t.seeAll}</Text>
              <ChevronRight size={14} color={Colors.light.tint} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
            <Search size={15} color={searchFocused ? Colors.light.tint : Colors.light.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t.search}
              placeholderTextColor={Colors.light.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Categories */}
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

          {/* Crop Carousel */}
          {filteredCrops.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌾</Text>
              <Text style={styles.emptyText}>No crops found for "{searchQuery}"</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + 14}
              snapToAlignment="start"
            >
              {filteredCrops.map((crop, i) => (
                <CropCard key={crop.id} crop={crop} index={i} />
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </ScrollView>

      {/* Side Drawer */}
      <SideDrawer
        visible={drawerOpen}
        slideAnim={drawerAnim}
        overlayAnim={overlayAnim}
        onClose={closeDrawer}
        insets={insets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },

  hero: { width: "100%", borderRadius: 40, overflow: "hidden" },
  heroImage: { resizeMode: "cover" },
  heroGrad1: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  heroGrad2: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
    backgroundColor: "rgba(20,30,10,0.55)",
  },
  heroInner: {
    flex: 1, paddingHorizontal: 20, paddingBottom: 24, justifyContent: "space-between",
  },

  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroProfile: { flexDirection: "row", alignItems: "center", gap: 10 },
  burgerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroHi: { fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  heroName: { fontSize: 15, fontWeight: "800", color: "#fff", letterSpacing: -0.2 },
  heroActions: { flexDirection: "row", gap: 8 },
  langSwitch: {
    flexDirection: "row",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  langChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  langChipActive: {
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  langChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 0.2,
  },
  langChipTextActive: {
    color: Colors.light.tintDark,
  },
  heroBell: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center", alignItems: "center",
  },
  bellBadge: {
    position: "absolute", top: 7, right: 7, width: 7, height: 7,
    borderRadius: 3.5, backgroundColor: Colors.light.error,
    borderWidth: 1.5, borderColor: "rgba(0,0,0,0.4)",
  },

  heroTitleBlock: { gap: 4 },
  heroTitle: { fontSize: 22, fontWeight: "500", color: "rgba(255,255,255,0.85)", letterSpacing: 0.2 },
  heroTitleBold: { fontSize: 40, fontWeight: "900", color: "#fff", letterSpacing: -1.5, lineHeight: 44 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locationText: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: "500" },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 14, paddingHorizontal: 8,
  },
  statPill: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  statPillIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center",
  },
  statPillValue: { fontSize: 15, fontWeight: "800", color: "#fff", lineHeight: 17 },
  statPillLabel: { fontSize: 9, color: "rgba(255,255,255,0.65)", fontWeight: "500" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 4 },

  body: { backgroundColor: Colors.light.background, paddingTop: 24 },
  riskCard: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  riskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  riskEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  riskBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
  },
  riskBadgeEmoji: { fontSize: 12 },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  riskSubLine: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "700",
  },
  riskScoreRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  riskScoreLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "700",
  },
  riskScoreValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  riskMeterTrack: {
    marginTop: 8,
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.72)",
    overflow: "hidden",
  },
  riskMeterFill: { height: "100%", borderRadius: 999 },
  riskSummary: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 20,
  },
  riskTimeline: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "700",
  },

  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, marginBottom: 14,
  },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: Colors.light.text, letterSpacing: -0.5 },
  sectionSub: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: "600", color: Colors.light.textSecondary },

  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.light.card,
    marginHorizontal: 20, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11, gap: 10,
    borderWidth: 1.5, borderColor: Colors.light.border, marginBottom: 16,
  },
  searchBarFocused: { borderColor: Colors.light.tint },
  searchInput: { flex: 1, fontSize: 14, color: Colors.light.text },
  clearBtn: { fontSize: 13, color: Colors.light.textSecondary, paddingHorizontal: 4 },

  categoryList: { paddingHorizontal: 20, gap: 8, paddingBottom: 18 },
  categoryPill: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.light.card, borderWidth: 1.5, borderColor: Colors.light.border,
  },
  categoryPillActive: { backgroundColor: Colors.light.text, borderColor: Colors.light.text },
  categoryText: { fontSize: 13, fontWeight: "600", color: Colors.light.textSecondary },
  categoryTextActive: { color: "#fff" },

  carousel: { paddingLeft: 20, paddingRight: 8, paddingBottom: 8 },
  cardWrapper: { marginRight: 14 },
  card: {
    width: CARD_WIDTH, height: CARD_WIDTH * 1.45,
    borderRadius: 22, overflow: "hidden", justifyContent: "flex-end",
  },
  cardImage: { borderRadius: 22 },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 22 },
  cardContent: {
    padding: 14, paddingTop: 60,
    backgroundColor: "rgba(0,0,0,0.52)",
    borderBottomLeftRadius: 22, borderBottomRightRadius: 22,
  },
  cardMeta: { flexDirection: "row", marginBottom: 6 },
  cardSeasonBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  cardSeasonText: { fontSize: 9, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.3, marginBottom: 4 },
  cardDesc: { fontSize: 11, color: "rgba(255,255,255,0.72)", lineHeight: 16, marginBottom: 10 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardWater: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardWaterText: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  cardArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },

  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: Colors.light.textSecondary },
});
