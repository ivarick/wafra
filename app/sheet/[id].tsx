/* eslint-disable import/no-duplicates */
import { useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Droplets,
  Mountain,
  AlertCircle,
  Star,
  Sprout,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { CROPS } from "@/constants/crops";

export default function SheetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const crop = CROPS.find((c) => c.id === id);

  if (!crop) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Crop not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.errorLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 32,
        }}
      >
        {/* Hero Image */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: crop.image }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 12 }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <View style={styles.ratingRow}>
              <Star size={14} color="#FCD34D" fill="#FCD34D" />
              <Text style={styles.ratingText}>{crop.rating}</Text>
            </View>
            <Text style={styles.heroName}>{crop.name}</Text>
            <Text style={styles.heroNameAr}>{crop.nameAr}</Text>
            <Text style={styles.heroNameFr}>{crop.nameFr}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.description}>{crop.description}</Text>

          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Calendar size={18} color={Colors.light.tint} />
              <Text style={styles.statLabel}>Plant</Text>
              <Text style={styles.statValue}>{crop.plantingSeason}</Text>
            </View>
            <View style={styles.statBox}>
              <Sprout size={18} color={Colors.light.success} />
              <Text style={styles.statLabel}>Harvest</Text>
              <Text style={styles.statValue}>{crop.harvestSeason}</Text>
            </View>
            <View style={styles.statBox}>
              <Droplets size={18} color="#60A5FA" />
              <Text style={styles.statLabel}>Water</Text>
              <Text style={styles.statValue}>{crop.waterNeeds}</Text>
            </View>
            <View style={styles.statBox}>
              <Mountain size={18} color={Colors.light.accent} />
              <Text style={styles.statLabel}>Soil</Text>
              <Text style={styles.statValue}>{crop.soilType}</Text>
            </View>
          </View>

          {/* Yields */}
          <Text style={styles.sectionTitle}>Average Yields</Text>
          <View style={styles.yieldContainer}>
            <View style={styles.yieldBox}>
              <Text style={styles.yieldLabel}>Average</Text>
              <Text style={styles.yieldValue}>{crop.yieldAverage}</Text>
            </View>
            <View style={styles.yieldBox}>
              <Text style={styles.yieldLabel}>Potential</Text>
              <Text style={styles.yieldValue}>{crop.yieldPotential}</Text>
            </View>
          </View>

          {/* Diseases */}
          <Text style={styles.sectionTitle}>Common Diseases</Text>
          <View style={styles.diseaseList}>
            {crop.diseases.map((d, i) => (
              <View key={i} style={styles.diseaseChip}>
                <AlertCircle size={14} color={Colors.light.error} />
                <Text style={styles.diseaseText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Fun Fact */}
          <View style={styles.factBox}>
            <Text style={styles.factLabel}>Did you know?</Text>
            <Text style={styles.factText}>{crop.funFact}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  errorLink: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.tint,
  },
  heroWrap: {
    height: 340,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: 340,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  backBtn: {
    position: "absolute",
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  heroContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FCD34D",
  },
  heroName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroNameAr: {
    fontSize: 22,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  heroNameFr: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    fontStyle: "italic",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.light.textSecondary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
    marginBottom: 8,
  },
  statBox: {
    width: "47%",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 12,
  },
  diseaseList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  diseaseChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  diseaseText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.error,
  },
  factBox: {
    backgroundColor: "#EDF2D8",
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
    marginBottom: 8,
  },
  factLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.tintDark,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  factText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 21,
    fontStyle: "italic",
  },
  yieldContainer: {
    flexDirection: "row",
    gap: 12,
  },
  yieldBox: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 14,
  },
  yieldLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  yieldValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
  },
});
