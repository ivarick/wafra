import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ChevronDown } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAppLanguage } from "@/hooks/useAppLanguage";

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const rotateAnim = useState(new Animated.Value(0))[0];

  const toggle = () => {
    Animated.spring(rotateAnim, {
      toValue: open ? 0 : 1,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
    setOpen(!open);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <View style={faqStyles.item}>
      <TouchableOpacity
        style={faqStyles.questionRow}
        onPress={toggle}
        activeOpacity={0.75}
      >
        <Text style={faqStyles.questionText}>{question}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={18} color={Colors.light.textSecondary} />
        </Animated.View>
      </TouchableOpacity>
      {open && <Text style={faqStyles.answerText}>{answer}</Text>}
    </View>
  );
}

const faqStyles = StyleSheet.create({
  item: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 10,
    overflow: "hidden",
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
    lineHeight: 21,
  },
  answerText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default function FaqScreen() {
  const insets = useSafeAreaInsets();
  const { lang, isRtl } = useAppLanguage();
  const content = {
    en: {
      title: "FAQ",
      intro: "Have a question? We have answers. If you cannot find what you need, contact our team.",
      faqs: [
        { q: "What is WAFRA?", a: "WAFRA is an AI-powered agricultural assistant tailored for Algerian farmers." },
        { q: "How does diagnosis work?", a: "Use Scan to upload a crop photo. The model analyzes it and suggests disease and treatment." },
        { q: "Is my data secure?", a: "Yes. Personal and farm data is encrypted in transit and at rest." },
        { q: "Which languages are supported?", a: "English, French, and Arabic are supported across the app." },
      ],
    },
    fr: {
      title: "FAQ",
      intro: "Une question ? Nous avons des reponses. Si vous ne trouvez pas ce qu'il faut, contactez notre equipe.",
      faqs: [
        { q: "Qu'est-ce que WAFRA ?", a: "WAFRA est un assistant agricole base sur l'IA pour les agriculteurs algeriens." },
        { q: "Comment fonctionne le diagnostic ?", a: "Utilisez Scan pour envoyer une photo de la culture. Le modele propose une maladie et un traitement." },
        { q: "Mes donnees sont-elles securisees ?", a: "Oui. Les donnees sont chiffrees en transit et au repos." },
        { q: "Quelles langues sont prises en charge ?", a: "L'anglais, le francais et l'arabe sont disponibles dans l'application." },
      ],
    },
    ar: {
      title: "الاسئلة الشائعة",
      intro: "عندك سؤال؟ هنا تلقى الاجابة. اذا ما لقيتش المطلوب، تواصل مع فريقنا.",
      faqs: [
        { q: "ما هو WAFRA؟", a: "WAFRA مساعد فلاحي بالذكاء الاصطناعي موجه للفلاحين في الجزائر." },
        { q: "كيف يعمل التشخيص؟", a: "استعمل زر الفحص لرفع صورة المحصول. النموذج يحللها ويعطيك المرض والعلاج." },
        { q: "هل بياناتي آمنة؟", a: "نعم، البيانات مشفرة اثناء النقل وعند التخزين." },
        { q: "ما هي اللغات المدعومة؟", a: "التطبيق يدعم الانجليزية والفرنسية والعربية." },
      ],
    },
  }[lang];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={[styles.title, isRtl && styles.rtl]}>{content.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, isRtl && styles.rtl]}>{content.intro}</Text>

        {content.faqs.map((faq, i) => (
          <FaqItem key={i} question={faq.q} answer={faq.a} />
        ))}
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
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "700", color: Colors.light.text },
  content: { padding: 20 },
  intro: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  rtl: { textAlign: "right", writingDirection: "rtl" },
});
