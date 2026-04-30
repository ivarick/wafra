/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as SecureStore from "@/utils/storage";
import { ArrowUpRight } from "lucide-react-native";
import Colors from "@/constants/colors";

const { width, height } = Dimensions.get("window");

//change this to a picture later ig
function TopographicPattern() {
  const lines = [
    { top: 40, left: -20, width: 180, height: 140, borderRadius: 70 },
    { top: 20, left: 120, width: 200, height: 160, borderRadius: 80 },
    { top: 80, left: 60, width: 160, height: 120, borderRadius: 60 },
    { top: 0, left: 220, width: 220, height: 180, borderRadius: 90 },
    { top: 140, left: -10, width: 140, height: 100, borderRadius: 50 },
    { top: 160, left: 100, width: 180, height: 140, borderRadius: 70 },
    { top: 120, left: 200, width: 200, height: 150, borderRadius: 75 },
    { top: 200, left: 40, width: 160, height: 120, borderRadius: 60 },
    { top: 220, left: 160, width: 180, height: 130, borderRadius: 65 },
    { top: 260, left: -20, width: 200, height: 150, borderRadius: 75 },
    { top: 280, left: 130, width: 220, height: 160, borderRadius: 80 },
    { top: 320, left: 20, width: 160, height: 120, borderRadius: 60 },
    { top: 350, left: 180, width: 180, height: 140, borderRadius: 70 },
    { top: 400, left: 60, width: 200, height: 150, borderRadius: 75 },
    { top: 440, left: 150, width: 160, height: 120, borderRadius: 60 },
    { top: 480, left: -10, width: 180, height: 130, borderRadius: 65 },
    { top: 500, left: 120, width: 200, height: 150, borderRadius: 75 },
  ];

  return (
    <View style={styles.patternContainer} pointerEvents="none">
      {lines.map((line, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: line.top,
            left: line.left,
            width: line.width,
            height: line.height,
            borderRadius: line.borderRadius,
            borderWidth: 1.5,
            borderColor: Colors.light.topoLine,
            opacity: 0.6,
          }}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();

  const handleStart = useCallback(async () => {
    await SecureStore.setItemAsync("onboarding_seen", "true");
    router.replace("./login");
  }, []);

  return (
    <View style={styles.container}>
      <TopographicPattern />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.titleLine}>BOOSTING</Text>

          <View style={styles.pill}>
            <Text style={styles.pillText}>AGRICULTURE</Text>
          </View>

          <Text style={styles.titleLine}>fOR</Text>
          <Text style={styles.titleLine}>EVERYONE</Text>

          <View style={styles.spacer} />

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <View style={styles.ctaIcon}>
              <ArrowUpRight size={20} color="#fff" />
            </View>
          </TouchableOpacity>
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
  patternContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
    overflow: "hidden",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  content: {
    paddingHorizontal: 28,
  },
  titleLine: {
    fontSize: 36,
    fontWeight: "300",
    color: Colors.light.text,
    letterSpacing: 1,
    lineHeight: 46,
  },
  pill: {
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: Colors.light.text,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginVertical: 4,
  },
  pillText: {
    fontSize: 28,
    fontWeight: "400",
    color: Colors.light.text,
    letterSpacing: 2,
  },
  mechanizationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  arrowLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.light.text,
    marginTop: 4,
  },
  spacer: {
    height: 100,
  },
  ctaButton: {
    position: "absolute",
    right: 28,
    bottom: 32,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    letterSpacing: 1,
  },
  ctaIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
});
