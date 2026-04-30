import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { ArrowLeft, FileText, Download, TrendingUp } from "lucide-react-native";
import Colors from "@/constants/colors";
import { usePlan } from "@/hooks/usePlan";

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { hasFeature } = usePlan();
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    if (!hasFeature("pdfReports")) {
      Alert.alert("Pro feature", "PDF report export is available in Pro Farmer.");
      return;
    }
    setIsGenerating(true);
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1F2937; line-height: 1.5; }
              h1 { color: #166534; border-bottom: 2px solid #22C55E; padding-bottom: 10px; margin-bottom: 5px; }
              .header { display: flex; justify-content: space-between; margin-bottom: 40px; align-items: flex-end; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
              th, td { border: 1px solid #E5E7EB; padding: 14px; text-align: left; }
              th { background-color: #F3F4F6; color: #166534; font-weight: 700; }
              .trend-up { color: #DC2626; font-weight: bold; }
              .trend-down { color: #16A34A; font-weight: bold; }
              h2 { color: #1F2937; margin-top: 30px; }
              .footer { margin-top: 60px; font-size: 12px; color: #9CA3AF; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 20px; }
              .highlight-box { background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1>WAFRA Diagnostics</h1>
                <p style="font-size: 18px; color: #4B5563; margin: 0;">Weekly Manager Report</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p style="margin: 5px 0 0 0;"><strong>Region:</strong> Mitidja Cooperative</p>
              </div>
            </div>

            <div class="highlight-box">
              <strong>Executive Summary:</strong> This week saw a significant spike in fungal infections due to increased humidity in the northern coastal regions. Solanaceous crops require immediate preventive action.
            </div>

            <h2>Top Emerging Threats</h2>
            <table>
              <tr>
                <th>Crop</th>
                <th>Disease Detected</th>
                <th>Diagnostics Count</th>
                <th>Recommended Action</th>
              </tr>
              <tr>
                <td>Tomato</td>
                <td>Late Blight (Phytophthora infestans)</td>
                <td class="trend-up">145 (+34%)</td>
                <td>Apply Copper Oxychloride and improve greenhouse ventilation.</td>
              </tr>
              <tr>
                <td>Wheat</td>
                <td>Brown Rust</td>
                <td class="trend-up">210 (+45%)</td>
                <td>Urgent application of Triazole-based fungicides.</td>
              </tr>
              <tr>
                <td>Potato</td>
                <td>Early Blight (Alternaria solani)</td>
                <td class="trend-up">89 (+12%)</td>
                <td>Preventive spraying with Mancozeb before anticipated rains.</td>
              </tr>
              <tr>
                <td>Citrus</td>
                <td>Tristeza Virus</td>
                <td class="trend-down">12 (-5%)</td>
                <td>Isolate infected trees and manage aphid populations.</td>
              </tr>
            </table>

            <h2>Regional Trends</h2>
            <p><strong>Blida / Tipaza:</strong> High humidity triggering Late Blight in greenhouse tomatoes and field potatoes.</p>
            <p><strong>Biskra:</strong> Stable arid conditions. Tuta absoluta populations in greenhouses remain controlled but require active pheromone trapping.</p>
            <p><strong>Sétif:</strong> High precipitation early in the week favors rust development in wheat. Agronomists should scout fields immediately.</p>
            
            <div class="footer">
              <p>Generated automatically by WAFRA Agronomy AI for Cooperative Managers.</p>
              <p>For more detailed analytics, visit the WAFRA Manager Dashboard.</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Weekly Report",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", "PDF generated at: " + uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not generate PDF report.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manager Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <FileText size={48} color={Colors.light.tint} />
          </View>
        </View>
        
        <Text style={styles.title}>Weekly Diagnostics Report</Text>
        <Text style={styles.description}>
          Generate a beautiful one-page PDF summarizing the week's AI diagnostics. 
          Includes crops affected, recommended treatments, and emerging disease trends by region.
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <TrendingUp size={20} color={Colors.light.error} />
            <Text style={styles.featureText}>Track emerging disease spikes</Text>
          </View>
          <View style={styles.featureItem}>
            <FileText size={20} color={Colors.light.tintDark} />
            <Text style={styles.featureText}>Review recommended treatments</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]} 
          onPress={generatePDF}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          <Download size={20} color="#fff" />
          <Text style={styles.generateBtnText}>
            {isGenerating ? "Generating PDF..." : "Generate PDF Report"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.light.text,
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EDF2D8",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  featureList: {
    width: "100%",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.light.text,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.light.tint,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  generateBtnDisabled: {
    opacity: 0.7,
  },
  generateBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
