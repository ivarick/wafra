import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from "react-native";
import { Mail, Phone } from "lucide-react-native";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");
const TOGGLE_WIDTH = width - 64;
const PILL_WIDTH = (TOGGLE_WIDTH - 4) / 2;

export type LoginMode = "email" | "phone";

interface CapsuleToggleProps {
  mode: LoginMode;
  onSwitch: (m: LoginMode) => void;
}

export function CapsuleToggle({ mode, onSwitch }: CapsuleToggleProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: mode === "email" ? 0 : PILL_WIDTH + 4,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [mode]);

  return (
    <View style={toggleStyles.track}>
      <Animated.View
        style={[
          toggleStyles.pill,
          { transform: [{ translateX: slideAnim }] },
        ]}
      />
      <TouchableOpacity
        style={toggleStyles.option}
        onPress={() => onSwitch("email")}
        activeOpacity={0.85}
      >
        <Mail
          size={13}
          color={mode === "email" ? "#fff" : Colors.light.textSecondary}
        />
        <Text
          style={[
            toggleStyles.optionText,
            mode === "email" && toggleStyles.optionTextActive,
          ]}
        >
          Email
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={toggleStyles.option}
        onPress={() => onSwitch("phone")}
        activeOpacity={0.85}
      >
        <Phone
          size={13}
          color={mode === "phone" ? "#fff" : Colors.light.textSecondary}
        />
        <Text
          style={[
            toggleStyles.optionText,
            mode === "phone" && toggleStyles.optionTextActive,
          ]}
        >
          Phone
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  track: {
    width: TOGGLE_WIDTH,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.border,
    flexDirection: "row",
    alignItems: "center",
    padding: 2,
    position: "relative",
  },
  pill: {
    position: "absolute",
    left: 2,
    top: 2,
    width: PILL_WIDTH,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.tint,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  option: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    zIndex: 1,
  },
  optionText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  optionTextActive: {
    color: "#fff",
  },
});
