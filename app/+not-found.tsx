/* eslint-disable react/no-unescaped-entities */
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Page Not Found", headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>(●'◡'●)</Text>
        <Text style={styles.title}>This page doesn&apos;t exist</Text>
        <Text style={styles.subtitle}>
          blah blah meow
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Return</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: Colors.light.background,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  link: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
