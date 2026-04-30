import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/hooks/useAuth";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AppLanguageProvider } from "@/hooks/useAppLanguage";
import { PlanProvider } from "@/hooks/usePlan";
import { warmOfflineKnowledgeCache } from "@/utils/offlineKnowledgeCache";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="diagnosis" options={{ headerShown: false }} />
      <Stack.Screen name="sheet/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="calculator" options={{ headerShown: false }} />
      <Stack.Screen name="sheets" options={{ headerShown: false }} />
      <Stack.Screen name="gallery" options={{ headerShown: false }} />
      <Stack.Screen name="journal" options={{ headerShown: false }} />
      <Stack.Screen name="reports" options={{ headerShown: false }} />
      <Stack.Screen name="pricing" options={{ headerShown: false, presentation: 'transparentModal' }} />
      <Stack.Screen name="faq" options={{ headerShown: false }} />
      <Stack.Screen name="account" options={{ headerShown: false }} />
      <Stack.Screen name="map" options={{ headerShown: false }} />
      <Stack.Screen name="create-locator" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    void warmOfflineKnowledgeCache();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppLanguageProvider>
          <PlanProvider>
            <GestureHandlerRootView>
              <OfflineBanner />
              <RootLayoutNav />
            </GestureHandlerRootView>
          </PlanProvider>
        </AppLanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
