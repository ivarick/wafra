import React, { useRef } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

interface OtpInputProps {
  value: string[];
  onChange: (v: string[]) => void;
}

export function OtpInput({ value, onChange }: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));

  const handleChange = (text: string, idx: number) => {
    const digit = text.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[idx] = digit;
    onChange(next);
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (!digit && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  return (
    <View style={otpStyles.row}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <TextInput
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          style={[otpStyles.cell, value[idx] ? otpStyles.cellFilled : null]}
          maxLength={1}
          keyboardType="number-pad"
          value={value[idx] ?? ""}
          onChangeText={(t) => handleChange(t, idx)}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const otpStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  cell: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: Colors.light.text,
  },
  cellFilled: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
});
