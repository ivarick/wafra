import {
  Check,
  Leaf,
  Lock,
  X,
  Crown,
  ShieldCheck,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { usePlan } from "@/hooks/usePlan";

type PlanKey = "free" | "pro";

interface Plan {
  key: PlanKey;
  number: string;
  label: string;
  price: string;
  period: string;
  badge?: string;
  accentColor: string;
  icon: React.ElementType;
  perks: string[];
}

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W - 20 * 2 - 28;
const SNAP = CARD_W + 12;
const CLOSE_DELAY = 7;

const PLANS: Plan[] = [
  {
    key: "free",
    number: "01",
    label: "Free Tier",
    price: "0 DZD",
    period: "forever",
    accentColor: "#8FB339",
    icon: ShieldCheck,
    perks: [
      "AI Chat",
      "Disease Diagnosis",
      "Crop Sheets",
      "Map + Calculator",
    ],
  },
  {
    key: "pro",
    number: "02",
    label: "Pro Farmer",
    price: "3999",
    period: "DZD / month",
    badge: "Popular",
    accentColor: "#5A7D1A",
    icon: Crown,
    perks: [
      "XAI Explanation Overlay",
      "Voice (STT / TTS)",
      "Reports Export (PDF)",
      "Journal (backend sync)",
    ],
  },
];

export default function PricingScreen() {
  const insets = useSafeAreaInsets();
  const { plan, setPlan } = usePlan();

  const [countdown, setCountdown] = useState(CLOSE_DELAY);
  const [canClose, setCanClose] = useState(false);
  
  // Start the selection on what they currently have, or default to PRO to upsell
  const initialIndex = plan === "pro" ? 1 : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(plan as PlanKey || "pro");

  // shakke page
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(Dimensions.get("window").height)).current;
  //bar
  const timerBar = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setCountdown(CLOSE_DELAY);
    setCanClose(false);
    timerBar.setValue(1);

    // Slide in
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(sheetAnim, {
        toValue: 0,
        damping: 20,
        stiffness: 160,
        useNativeDriver: true,
      }),
    ]).start();

    // timer bar
    Animated.timing(timerBar, {
      toValue: 0,
      duration: CLOSE_DELAY * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    let remaining = CLOSE_DELAY;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        setCanClose(true);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [backdropAnim, sheetAnim, timerBar]);

  const animateOut = useCallback((cb: () => void) => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: Dimensions.get("window").height,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(cb);
  }, [backdropAnim, sheetAnim]);

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -4,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeAnim]);

  const handleClose = useCallback(() => {
    if (!canClose) {
      triggerShake();
      return;
    }
    animateOut(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    });
  }, [canClose, animateOut, triggerShake]);

  const handleGetStarted = useCallback(() => {
    animateOut(() => {
      setPlan(selectedPlan);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    });
  }, [selectedPlan, setPlan, animateOut]);

  const handleScroll = useCallback(
    (e: any) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SNAP);
      const clamped = Math.max(0, Math.min(index, PLANS.length - 1));
      if (clamped !== activeIndex) {
        setActiveIndex(clamped);
        setSelectedPlan(PLANS[clamped].key);
      }
    },
    [activeIndex],
  );

  const activePlan = PLANS[activeIndex];
  const initialScrollIndex = plan === "pro" ? 1 : 0;

  return (
    <View style={styles.fullScreen}>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 12 },
          {
            transform: [{ translateY: sheetAnim }, { translateX: shakeAnim }],
          },
        ]}
      >
        <View style={styles.timerTrack}>
          <Animated.View
            style={[
              styles.timerFill,
              {
                width: timerBar.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
                backgroundColor: timerBar.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: ["#DC2626", "#D4A843", "#8FB339"],
                }),
              },
            ]}
          />
        </View>

        <View style={styles.topBar}>
          <View style={styles.leafBadge}>
            <Leaf size={16} color="#8FB339" />
          </View>
          <Text style={styles.topBarLabel}>NABTA PLANS</Text>

          <TouchableOpacity
            style={[
              styles.closeBtn,
              canClose ? styles.closeBtnReady : styles.closeBtnLocked,
            ]}
            onPress={handleClose}
            activeOpacity={0.75}
          >
            {canClose ? (
              <X size={15} color="#4d5e4b" />
            ) : (
              <>
                <Lock size={13} color="#9CA3AF" />
                <Text style={styles.countBubble}>{countdown}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Grow smarter,{"\n"}harvest more.</Text>
          <Text style={styles.heroSub}>Free to grow · Paid to scale.</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
          decelerationRate="fast"
          snapToInterval={SNAP}
          snapToAlignment="start"
          pagingEnabled={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          contentOffset={{ x: initialScrollIndex * SNAP, y: 0 }}
        >
          {PLANS.map((p, i) => {
            const Icon = p.icon;
            const isActive = activeIndex === i;
            return (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.planCard,
                  { width: CARD_W },
                  isActive && {
                    borderColor: p.accentColor,
                    borderWidth: 2,
                    backgroundColor: p.accentColor + "0D",
                  },
                ]}
                onPress={() => {
                  setActiveIndex(i);
                  setSelectedPlan(p.key);
                }}
                activeOpacity={0.82}
              >
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.numBadge,
                      { backgroundColor: p.accentColor + "20" },
                    ]}
                  >
                    <Text style={[styles.numText, { color: p.accentColor }]}>
                      {p.number}
                    </Text>
                  </View>
                  {p.badge && (
                    <View
                      style={[
                        styles.badgePill,
                        { backgroundColor: p.accentColor },
                      ]}
                    >
                      <Text style={styles.badgePillText}>{p.badge}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }} />
                  {isActive && (
                    <View
                      style={[
                        styles.checkCircle,
                        { backgroundColor: p.accentColor },
                      ]}
                    >
                      <Check size={10} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </View>

                <View style={styles.iconNameRow}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: p.accentColor + "20" },
                    ]}
                  >
                    <Icon size={17} color={p.accentColor} />
                  </View>
                  <Text
                    style={[styles.planName, { color: p.accentColor }]}
                    numberOfLines={2}
                  >
                    {p.label}
                  </Text>
                </View>

                <Text style={styles.priceText}>{p.price}</Text>
                <Text style={styles.periodText}>{p.period}</Text>

                <View style={styles.perkList}>
                  {p.perks.map((perk) => (
                    <View key={perk} style={styles.perkRow}>
                      <View
                        style={[
                          styles.perkDot,
                          { backgroundColor: p.accentColor },
                        ]}
                      />
                      <Text style={styles.perkText}>{perk}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.dotsRow}>
          {PLANS.map((p, i) => (
            <View
              key={p.key}
              style={[
                styles.dot,
                activeIndex === i && {
                  backgroundColor: PLANS[activeIndex].accentColor,
                  width: 18,
                  borderRadius: 4,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaArea}>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: activePlan.accentColor }]}
            onPress={handleGetStarted}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>
              {selectedPlan === plan
                ? "Current Plan"
                : selectedPlan === "free"
                  ? "Switch to Free"
                  : "Upgrade to Pro"}
            </Text>
          </TouchableOpacity>

          {!canClose && (
            <Text style={styles.lockNote}>
              Please review our plans — you can close in{" "}
              <Text style={{ fontWeight: "700", color: "#D4A843" }}>
                {countdown}s
              </Text>
            </Text>
          )}
          {canClose && (
            <Text style={styles.legalNote}>
              Subscriptions renew automatically · Cancel anytime
            </Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FAFBF5",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: { elevation: 20 },
    }),
  },

  timerTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "#E5E7EB",
  },
  timerFill: {
    height: 4,
    borderRadius: 0,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 10,
  },
  leafBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EDF2D8",
    justifyContent: "center",
    alignItems: "center",
  },
  topBarLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "#8FB339",
  },
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  closeBtnReady: {
    backgroundColor: "#F3F4F6",
  },
  closeBtnLocked: {
    backgroundColor: "#F3F4F6",
    opacity: 0.6,
  },
  countBubble: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },

  hero: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#4d5e4b",
    lineHeight: 29,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  cardsContainer: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
    alignItems: "flex-start",
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 14,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  numBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  numText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  badgePill: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  iconNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  planName: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  priceText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4d5e4b",
    lineHeight: 26,
  },
  periodText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: -4,
  },
  perkList: {
    gap: 5,
    marginTop: 2,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  perkDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  perkText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
  },

  ctaArea: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 6,
  },
  ctaBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  lockNote: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
  legalNote: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
