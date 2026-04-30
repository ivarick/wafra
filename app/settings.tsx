/**
 * PRESENTATION LAYER — Settings Screen (Placeholder)
 * Clean, themed shell ready for feature implementation.
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Bell, Lock, Globe, Moon, Smartphone, ChevronRight, LogOut } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "../hooks/useAuth";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import type { Lang } from "@/constants/i18n";
import { usePlan } from "@/hooks/usePlan";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { lang, setLang } = useAppLanguage();
  const { plan } = usePlan();
  const t = {
    en: {
      title: "Settings",
      preferences: "Preferences",
      security: "Security",
      account: "Account",
      notifications: "Notifications",
      notificationsHint: "Manage alerts",
      language: "Language",
      appearance: "Appearance",
      appearanceHint: "Light mode",
      changePassword: "Change Password",
      twoFactor: "Two-Factor Authentication",
      signOut: "Sign Out",
      pricing: "Pricing",
      pricingHint: "Free / Pro Farmer plans",
      currentPlan: "Current plan",
      freePlan: "Free",
      proPlan: "Pro Farmer",
    },
    fr: {
      title: "Parametres",
      preferences: "Preferences",
      security: "Securite",
      account: "Compte",
      notifications: "Notifications",
      notificationsHint: "Gerer les alertes",
      language: "Langue",
      appearance: "Apparence",
      appearanceHint: "Mode clair",
      changePassword: "Changer le mot de passe",
      twoFactor: "Authentification a deux facteurs",
      signOut: "Deconnexion",
      pricing: "Tarification",
      pricingHint: "Forfaits Free / Pro Farmer",
      currentPlan: "Forfait actuel",
      freePlan: "Free",
      proPlan: "Pro Farmer",
    },
    ar: {
      title: "الاعدادات",
      preferences: "التفضيلات",
      security: "الامان",
      account: "الحساب",
      notifications: "الاشعارات",
      notificationsHint: "ادارة التنبيهات",
      language: "اللغة",
      appearance: "المظهر",
      appearanceHint: "الوضع الفاتح",
      changePassword: "تغيير كلمة المرور",
      twoFactor: "المصادقة الثنائية",
      signOut: "تسجيل الخروج",
      pricing: "الاسعار",
      pricingHint: "باقات Free و Pro Farmer",
      currentPlan: "الباقة الحالية",
      freePlan: "Free",
      proPlan: "Pro Farmer",
    },
  }[lang];
  const langLabel = ({ en: "English", fr: "Francais", ar: "العربية" } as const)[lang];
  const planLabel = plan === "pro" ? t.proPlan : t.freePlan;
  const SETTING_GROUPS = [
    {
      title: t.currentPlan,
      items: [
        { icon: Lock, label: t.pricing, hint: `${planLabel} • ${t.pricingHint}`, route: "/pricing" },
      ],
    },
    {
      title: t.preferences,
      items: [
        { icon: Bell, label: t.notifications, hint: t.notificationsHint },
        { icon: Globe, label: t.language, hint: langLabel },
        { icon: Moon, label: t.appearance, hint: t.appearanceHint },
      ],
    },
    {
      title: t.security,
      items: [
        { icon: Lock, label: t.changePassword, route: "/change-password" },
        { icon: Smartphone, label: t.twoFactor },
      ],
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.langSwitcher}>
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {SETTING_GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, idx) => {
                const Icon = item.icon;
                const isLast = idx === group.items.length - 1;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.row, !isLast && styles.rowBorder]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if ("route" in item && item.route) {
                        router.push(item.route as any);
                      }
                    }}
                  >
                    <View style={styles.rowIconWrap}>
                      <Icon size={18} color={Colors.light.tint} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      {"hint" in item && item.hint ? (
                        <Text style={styles.rowHint}>{item.hint}</Text>
                      ) : null}
                    </View>
                    <ChevronRight size={16} color={Colors.light.border} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.group}>
          <Text style={[styles.groupTitle, { color: Colors.light.error }]}>{t.account}</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={handleSignOut}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#FEE2E2" }]}>
                <LogOut size={18} color={Colors.light.error} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: Colors.light.error }]}>{t.signOut}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version stamp */}
        <Text style={styles.version}>WAFRA v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: "center", alignItems: "center",
  },
  title: { fontSize: 17, fontWeight: "700", color: Colors.light.text },
  langSwitcher: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingTop: 14,
    paddingHorizontal: 20,
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  langChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  langChipText: { fontSize: 12, fontWeight: "700", color: Colors.light.textSecondary },
  langChipTextActive: { color: "#fff" },

  group: { paddingHorizontal: 20, paddingTop: 28 },
  groupTitle: {
    fontSize: 12, fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  groupCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  rowIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#EDF2D8",
    justifyContent: "center", alignItems: "center",
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "600", color: Colors.light.text },
  rowHint: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 1 },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 40,
    marginBottom: 8,
  },
});
