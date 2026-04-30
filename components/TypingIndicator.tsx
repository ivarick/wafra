import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

export function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (anim: Animated.Value, delay: number) => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.delay(400),
          ])
        ),
      ]).start();
    };

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { opacity: dot1, transform: [{ translateY: dot1.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />
      <Animated.View style={[styles.dot, { opacity: dot2, transform: [{ translateY: dot2.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />
      <Animated.View style={[styles.dot, { opacity: dot3, transform: [{ translateY: dot3.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: "flex-start",
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
    marginLeft: 16,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.textSecondary,
  },
});
