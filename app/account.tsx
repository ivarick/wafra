import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Shield,
  FileText,
  ChevronRight,
  LogOut,
  Camera,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "../hooks/useAuth";
import { useAppLanguage } from "@/hooks/useAppLanguage";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { lang } = useAppLanguage();
  const t = {
    en: {
      title: "Account",
      details: "Account Details",
      danger: "Danger Zone",
      signOut: "Sign Out",
      delete: "Delete Account",
      noEmail: "No email provided",
      edit: "Edit Profile",
      editHint: "Update your name, email, photo",
      reports: "My Outbreak Reports",
      reportsHint: "Manage your gallery posts",
      phone: "Phone Number",
      privacy: "Privacy",
      privacyHint: "Control what you share",
      terms: "Terms & Conditions",
    },
    fr: {
      title: "Compte",
      details: "Details du compte",
      danger: "Zone sensible",
      signOut: "Deconnexion",
      delete: "Supprimer le compte",
      noEmail: "Aucun email",
      edit: "Modifier profil",
      editHint: "Mettre a jour nom, email, photo",
      reports: "Mes signalements",
      reportsHint: "Gerer vos publications",
      phone: "Numero de telephone",
      privacy: "Confidentialite",
      privacyHint: "Controler vos partages",
      terms: "Conditions generales",
    },
    ar: {
      title: "الحساب",
      details: "تفاصيل الحساب",
      danger: "منطقة الخطر",
      signOut: "تسجيل الخروج",
      delete: "حذف الحساب",
      noEmail: "لا يوجد بريد",
      edit: "تعديل الملف الشخصي",
      editHint: "تحديث الاسم والبريد والصورة",
      reports: "تقارير التفشي الخاصة بي",
      reportsHint: "ادارة منشورات المعرض",
      phone: "رقم الهاتف",
      privacy: "الخصوصية",
      privacyHint: "التحكم فيما تشاركه",
      terms: "الشروط والاحكام",
    },
  }[lang];

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const accountActions = [
    { icon: Edit3, label: t.edit, hint: t.editHint, route: "/edit-profile" },
    { icon: Camera, label: t.reports, hint: t.reportsHint, route: "/my-posts" },
    { icon: Phone, label: t.phone, hint: user?.phone || "+213 -- -- -- --" },
    { icon: Shield, label: t.privacy, hint: t.privacyHint },
    { icon: FileText, label: t.terms },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <User size={36} color={Colors.light.tint} />
          </View>
          <Text style={styles.userName}>{user?.name || "User"}</Text>
          <View style={styles.emailRow}>
            <Mail size={13} color={Colors.light.textSecondary} />
            <Text style={styles.userEmail}>{user?.email || t.noEmail}</Text>
          </View>
          <View style={styles.locationChip}>
            <MapPin size={12} color={Colors.light.tint} />
            <Text style={styles.locationText}>Djelfa, Algeria</Text>
          </View>
        </View>
        <View style={styles.group}>
          <Text style={styles.groupTitle}>{t.details}</Text>
          <View style={styles.groupCard}>
            {accountActions.map((item, idx) => {
              const Icon = item.icon;
              const isLast = idx === accountActions.length - 1;
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

        <View style={styles.group}>
          <Text style={[styles.groupTitle, { color: Colors.light.error }]}>{t.danger}</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity style={[styles.row, styles.rowBorder]} activeOpacity={0.7} onPress={handleSignOut}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#FEE2E2" }]}>
                <LogOut size={18} color={Colors.light.error} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: Colors.light.error }]}>{t.signOut}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.row} activeOpacity={0.7}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#FEE2E2" }]}>
                <Shield size={18} color={Colors.light.error} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: Colors.light.error }]}>{t.delete}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "700", color: Colors.light.text },

  avatarSection: {
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 32,
    gap: 8,
  },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: "#EDF2D8",
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: Colors.light.tint,
    marginBottom: 4,
  },
  userName: { fontSize: 22, fontWeight: "800", color: Colors.light.text, letterSpacing: -0.4 },
  emailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  userEmail: { fontSize: 14, color: Colors.light.textSecondary },
  locationChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#EDF2D8",
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  locationText: { fontSize: 12, fontWeight: "600", color: Colors.light.tint },

  group: { paddingHorizontal: 20, paddingTop: 20 },
  groupTitle: {
    fontSize: 12, fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10,
  },
  groupCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.light.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  rowIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#EDF2D8", justifyContent: "center", alignItems: "center",
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "600", color: Colors.light.text },
  rowHint: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 1 },
});
