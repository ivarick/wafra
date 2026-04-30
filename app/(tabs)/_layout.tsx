/* eslint-disable import/no-duplicates */
import { Tabs } from "expo-router";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
} from "react-native";
import {
  Home,
  MessageCircle,
  BookOpen,
  MapPin,
  ScanLine,
} from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";
import { router } from "expo-router";
import { useAppLanguage } from "@/hooks/useAppLanguage";


function CustomTabBar({ state, navigation }: any) {
  const { lang } = useAppLanguage();
  const tabText = {
    en: { home: "Home", sheets: "Sheets", map: "Map", scan: "Scan" },
    fr: { home: "Accueil", sheets: "Fiches", map: "Carte", scan: "Scan" },
    ar: { home: "الرئيسية", sheets: "المحاصيل", map: "الخريطة", scan: "فحص" },
  }[lang];
  const tabs = [
    { name: "home",   label: tabText.home,   icon: Home },
    { name: "sheets", label: tabText.sheets, icon: BookOpen },
    { name: "map",    label: tabText.map,    icon: MapPin },
  ];
  
  const scanTab = { name: "diagnosis", label: tabText.scan, icon: ScanLine };

  // routes
  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {/* Left two tabs */}
        {tabs.slice(0, 2).map((tab) => {
          const active = activeRouteName === tab.name;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.75}
            >
              <Icon
                size={22}
                color={active ? Colors.light.tint : Colors.light.tabIconDefault}
              />
              <Text
                style={[
                  styles.tabLabel,
                  active && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/*chat bot*/}
        <TouchableOpacity
          style={styles.scanSlot}
          onPress={() => router.push("/chat")}
          activeOpacity={0.85}
        >
          <View style={styles.scanBtn}>
            <MessageCircle size={26} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Right tabs - scan and map */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.push("/diagnosis")}
          activeOpacity={0.75}
        >
          <ScanLine
            size={22}
            color={activeRouteName === "diagnosis" ? Colors.light.tint : Colors.light.tabIconDefault}
          />
          <Text
            style={[
              styles.tabLabel,
              activeRouteName === "diagnosis" && styles.tabLabelActive,
            ]}
          >
            {scanTab.label}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("map")}
          activeOpacity={0.75}
        >
          <MapPin
            size={22}
            color={activeRouteName === "map" ? Colors.light.tint : Colors.light.tabIconDefault}
          />
          <Text
            style={[
              styles.tabLabel,
              activeRouteName === "map" && styles.tabLabelActive,
            ]}
          >
            {tabText.map}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="sheets" />
      <Tabs.Screen name="map" />
    </Tabs>
  );
}


const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 8,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.light.tabIconDefault,
  },
  tabLabelActive: {
    color: Colors.light.tint,
  },
  scanSlot: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -24,
  },
  scanBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: Colors.light.background,
  },
});