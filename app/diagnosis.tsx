import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  Camera,
  ImageIcon,
  ScanLine,
  AlertTriangle,
  Pill,
  Sprout,
  ShieldCheck,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { usePlan } from "@/hooks/usePlan";

const BACKEND_URL = process.env.EXPO_PUBLIC_DISEASE_API_URL ?? (Platform.OS === 'android' ? "http://10.0.2.2:8001" : "http://localhost:8001");

type DiagnosisState = "idle" | "analyzing" | "result";

interface DiagnosisResult {
  crop: string;
  disease: string;
  healthy: boolean;
  confidence: number;
  confidence_pct: string;
  margin: number;
  severity: string;
  severity_label: string;
  severity_color: string;
  treatment: string;
  uncertain: boolean;
  diagnosis_supported: boolean;
  crop_source: string;
  crop_confidence: number;
  crop_confidence_pct: string;
  advisory: string;
  explanation: string;
  confidence_level: "high" | "medium" | "uncertain";
  heatmap_url: string;
}

export default function DiagnosisScreen() {
  const insets = useSafeAreaInsets();
  const { lang } = useAppLanguage();
  const { hasFeature } = usePlan();
  const t = {
    en: {
      title: "Crop Diagnosis",
      idleTitle: "Identify Crop Diseases",
      idleDesc:
        "Take a photo or upload an image of your crop to get an instant AI-powered diagnosis and treatment recommendations.",
      takePhoto: "Take Photo",
      gallery: "Gallery",
      analyzing: "Analyzing...",
    },
    fr: {
      title: "Diagnostic des cultures",
      idleTitle: "Identifier les maladies",
      idleDesc:
        "Prenez une photo ou importez une image pour obtenir un diagnostic IA et des recommandations de traitement.",
      takePhoto: "Prendre photo",
      gallery: "Galerie",
      analyzing: "Analyse en cours...",
    },
    ar: {
      title: "تشخيص المحاصيل",
      idleTitle: "تحديد امراض المحاصيل",
      idleDesc:
        "التقط صورة او ارفع صورة للمحصول للحصول على تشخيص فوري بالذكاء الاصطناعي مع توصيات العلاج.",
      takePhoto: "التقاط صورة",
      gallery: "المعرض",
      analyzing: "جاري التحليل...",
    },
  }[lang];
  const [state, setState] = useState<DiagnosisState>("idle");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showXaiOverlay, setShowXaiOverlay] = useState(true);

  const processImage = async (uri: string) => {
    setImageUri(uri);
    setState("analyzing");
    setErrorMsg(null);
    setShowXaiOverlay(true);
    try {
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('image', blob, 'image.jpg');
      } else {
        const filename = uri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('image', { uri, name: filename, type } as any);
      }

      const response = await fetch(`${BACKEND_URL}/diagnose`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResult(data);
      setState("result");
    } catch (err) {
      console.error(err);
      setErrorMsg(`Failed to analyze image. Please ensure the backend is running on ${BACKEND_URL}`);
      setState("idle");
      setImageUri(null);
    }
  };

  const handleCapture = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Camera permission is required!");
      return;
    }
    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!pickerResult.canceled && pickerResult.assets[0]) {
      processImage(pickerResult.assets[0].uri);
    }
  }, []);

  const handleGallery = useCallback(async () => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!pickerResult.canceled && pickerResult.assets[0]) {
      processImage(pickerResult.assets[0].uri);
    }
  }, []);

  const handleReset = useCallback(() => {
    setState("idle");
    setImageUri(null);
    setResult(null);
    setErrorMsg(null);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
        }}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <View style={styles.backBtn} />
        </View>

        {state === "idle" && (
          <View style={styles.idleContent}>
            <View style={styles.scanCircle}>
              <ScanLine size={48} color={Colors.light.tint} />
            </View>
            <Text style={styles.idleTitle}>{t.idleTitle}</Text>
            <Text style={styles.idleDesc}>{t.idleDesc}</Text>

            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={handleCapture}
                activeOpacity={0.85}
              >
                <View style={styles.actionIcon}>
                  <Camera size={28} color={Colors.light.tint} />
                </View>
                <Text style={styles.actionTitle}>{t.takePhoto}</Text>
                <Text style={styles.actionDesc}>Use camera to capture</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={handleGallery}
                activeOpacity={0.85}
              >
                <View style={styles.actionIcon}>
                  <ImageIcon size={28} color={Colors.light.tint} />
                </View>
                <Text style={styles.actionTitle}>{t.gallery}</Text>
                <Text style={styles.actionDesc}>Upload from device</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tipBox}>
              <AlertTriangle size={18} color={Colors.light.accent} />
              <Text style={styles.tipText}>
                For best results, ensure good lighting and focus on the affected
                leaf or plant part.
              </Text>
            </View>

            {errorMsg && (
              <View style={[styles.tipBox, { backgroundColor: '#FEE2E2', marginTop: 12 }]}>
                <AlertTriangle size={18} color="#B91C1C" />
                <Text style={[styles.tipText, { color: '#B91C1C' }]}>
                  {errorMsg}
                </Text>
              </View>
            )}
          </View>
        )}

        {state === "analyzing" && (
          <View style={styles.analyzingContent}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            )}
            <View style={styles.analyzingBox}>
              <ActivityIndicator size="large" color={Colors.light.tint} />
              <Text style={styles.analyzingTitle}>{t.analyzing}</Text>
              <Text style={styles.analyzingDesc}>
                Our AI model is examining your crop image for signs of disease.
              </Text>
            </View>
          </View>
        )}

        {state === "result" && result && (
          <View style={styles.resultContent}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.resultImage} />
            )}

            <View style={[styles.resultBadge, { backgroundColor: result.severity_color + '20' }]}>
              {result.healthy ? (
                <ShieldCheck size={16} color={result.severity_color} />
              ) : (
                <AlertTriangle size={16} color={result.severity_color} />
              )}
              <Text style={[styles.resultBadgeText, { color: result.severity_color }]}>
                {result.confidence_pct} confidence ({result.confidence_level})
              </Text>
            </View>

            <Text style={styles.diseaseName}>{result.disease}</Text>
            <Text style={[styles.severityText, { color: result.severity_color }]}>
              Crop: {result.crop} • Severity: {result.severity_label}
            </Text>

            {!result.healthy && result.heatmap_url && hasFeature("xaiOverlay") ? (
              <>
                <View style={styles.xaiHeaderRow}>
                  <Text style={styles.sectionTitle}>Highlighted Evidence</Text>
                  <TouchableOpacity
                    style={styles.xaiToggleBtn}
                    onPress={() => setShowXaiOverlay((prev) => !prev)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.xaiToggleText}>
                      {showXaiOverlay ? "Hide AI Overlay" : "Show AI Overlay"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {showXaiOverlay ? (
                  <Image
                    source={{
                      uri: result.heatmap_url.startsWith("http")
                        ? result.heatmap_url
                        : `${BACKEND_URL}${result.heatmap_url}`,
                    }}
                    style={styles.resultImage}
                  />
                ) : null}
              </>
            ) : null}

            {!result.healthy && result.heatmap_url && !hasFeature("xaiOverlay") ? (
              <View style={[styles.tipBox, { marginTop: 12 }]}>
                <AlertTriangle size={18} color={Colors.light.tintDark} />
                <Text style={styles.tipText}>
                  XAI visual overlay is available in Pro Farmer.
                </Text>
              </View>
            ) : null}

            {result.explanation ? (
              <>
                <Text style={styles.sectionTitle}>Why this prediction</Text>
                <Text style={styles.description}>{result.explanation}</Text>
              </>
            ) : null}

            {result.confidence_level === "uncertain" ? (
              <View style={[styles.tipBox, { backgroundColor: "#FEF3C7", marginTop: 12 }]}>
                <AlertTriangle size={18} color="#92400E" />
                <Text style={[styles.tipText, { color: "#92400E" }]}>
                  Uncertain diagnosis - consider another close, clear photo.
                </Text>
              </View>
            ) : null}

            {result.advisory ? (
              <>
                <Text style={styles.sectionTitle}>Advisory</Text>
                <Text style={styles.description}>{result.advisory}</Text>
              </>
            ) : null}

            <Text style={styles.sectionTitle}>Treatment / Recommendation</Text>
            <View style={styles.treatmentRow}>
              <View style={styles.treatmentBullet}>
                {result.healthy ? (
                  <Sprout size={14} color={Colors.light.success} />
                ) : (
                  <Pill size={14} color={Colors.light.tint} />
                )}
              </View>
              <Text style={styles.treatmentText}>{result.treatment}</Text>
            </View>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleReset}
              activeOpacity={0.85}
            >
              <Sprout size={18} color="#fff" />
              <Text style={styles.resetBtnText}>Diagnose Another Crop</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  idleContent: {
    paddingHorizontal: 24,
    alignItems: "center",
    paddingTop: 20,
  },
  scanCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  idleTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  idleDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 14,
    width: "100%",
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  tipBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 14,
    padding: 14,
    marginTop: 24,
    width: "100%",
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 19,
  },
  analyzingContent: {
    paddingHorizontal: 24,
    alignItems: "center",
    paddingTop: 20,
  },
  previewImage: {
    width: 220,
    height: 220,
    borderRadius: 20,
    marginBottom: 24,
  },
  analyzingBox: {
    alignItems: "center",
    gap: 12,
  },
  analyzingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 8,
  },
  analyzingDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  resultContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  resultImage: {
    width: "100%",
    height: 200,
    borderRadius: 18,
    marginBottom: 16,
  },
  xaiHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  xaiToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  xaiToggleText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.tint,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  resultBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
  },
  diseaseName: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.light.text,
  },
  severityText: {
    fontSize: 14,
    color: Colors.light.warning,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 21,
  },
  treatmentRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  treatmentBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
  },
  treatmentText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginTop: 3,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 28,
    marginBottom: 16,
  },
  resetBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
