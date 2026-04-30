/* eslint-disable react-hooks/exhaustive-deps */

import { CapsuleToggle, type LoginMode } from "@/components/auth/CapsuleToggle";
import Colors from "@/constants/colors";
import { router } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Leaf, Mail } from "lucide-react-native";
import { useCallback, useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const {
    user,
    isLoading,
    checkEmail,
    signInWithEmail,
    signInWithGoogle,
    requestOtp,
    isSigningIn,
    error,
    clearError,
  } = useAuth();

  useEffect(() => {
    if (user && !isLoading) {
      router.replace("/(tabs)/home");
    }
  }, [user, isLoading]);

  const [loginMode, setLoginMode] = useState<LoginMode>("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  
  // New flow states
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const fieldAnim = useRef(new Animated.Value(1)).current;

  const switchMode = useCallback(
    (newMode: LoginMode) => {
      if (newMode === loginMode) return;
      Animated.sequence([
        Animated.timing(fieldAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fieldAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setLoginMode(newMode);
      clearError();
    },
    [loginMode],
  );

  const handleCredentialsSubmit = useCallback(async () => {
    if (loginMode === "email") {
      if (!showPasswordField) {
        if (!email.trim()) {
          Alert.alert("Missing email", "Please enter your email.");
          return;
        }
        const isNew = await checkEmail(email);
        // If checkEmail succeeds, we show the password field
        // (It returns true if a password was sent to a new user, false otherwise)
        if (error) return; // If checkEmail set an error, don't proceed
        
        setShowPasswordField(true);
        setIsNewUser(isNew);
      } else {
        if (!password.trim()) {
          Alert.alert("Missing password", "Please enter your password.");
          return;
        }
        const success = await signInWithEmail(email, password);
        if (success) {
          router.replace("/(tabs)/home");
        }
      }
    } else {
      if (!phone.trim() || phone.length < 9) {
        Alert.alert("Invalid number", "Please enter a valid phone number.");
        return;
      }
      const success = await requestOtp(phone);
      if (success) {
        // Phone flow not fully implemented in backend yet
        Alert.alert("Notice", "Phone login is not yet supported by the backend.");
      }
    }
  }, [loginMode, email, password, phone, showPasswordField, checkEmail, signInWithEmail, requestOtp, error]);


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (showPasswordField) {
              setShowPasswordField(false);
              clearError();
            } else {
              router.push("/onboarding");
            }
          }}
        >
          <ArrowLeft size={18} color={Colors.light.tint} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Leaf size={32} color={Colors.light.tint} />
          </View>
          <Text style={styles.title}>Welcome to WAFRA</Text>
          <Text style={styles.subtitle}>Sign in to your farm account</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.errorDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.toggleRow}>
          <CapsuleToggle mode={loginMode} onSwitch={switchMode} />
        </View>

        <Animated.View
          style={[
            styles.form,
            {
              opacity: fieldAnim,
              transform: [
                {
                  translateY: fieldAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {loginMode === "email" ? (
            <>
              {isNewUser && showPasswordField && (
                <View style={styles.codeSentBox}>
                  <View style={styles.codeSentIcon}>
                    <Mail size={22} color={Colors.light.tint} />
                  </View>
                  <Text style={styles.codeSentTitle}>Password Sent</Text>
                  <Text style={styles.codeSentSubtitle}>
                    A secure password has been sent to your email.
                  </Text>
                </View>
              )}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, showPasswordField && styles.inputDisabled]}
                  placeholder="farmer@example.com"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!showPasswordField}
                />
              </View>
              
              {showPasswordField && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Enter your password"
                      placeholderTextColor={Colors.light.textSecondary}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color={Colors.light.textSecondary} />
                      ) : (
                        <Eye size={20} color={Colors.light.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.phonePrefixBox}>
                  <Text style={styles.phonePrefixText}>🇩🇿 +213</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="06 XX XX XX XX"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleCredentialsSubmit}
            activeOpacity={0.85}
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>
                {loginMode === "email" ? (showPasswordField ? "Log In" : "Continue") : "Send OTP"}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={async () => {
              const success = await signInWithGoogle();
              if (success) router.replace("/(tabs)/home");
            }}
            disabled={isSigningIn}
            activeOpacity={0.85}
          >
            {isSigningIn ? (
              <ActivityIndicator color={Colors.light.tint} />
            ) : (
              <Text style={styles.socialText}>Google</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.tint,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EDF2D8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    color: Colors.light.error,
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 16,
  },
  toggleRow: {
    alignItems: "center",
    marginBottom: 28,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.text,
  },
  inputDisabled: {
    backgroundColor: "#F3F4F6",
    color: Colors.light.textSecondary,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingRight: 48,
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    padding: 4,
  },
  phoneRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  phonePrefixBox: {
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
  },
  phoneInput: {
    flex: 1,
  },
  loginBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: Colors.light.card,
  },
  socialText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  // ── Verify step styles ───────────────────────────────────────
  emailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  emailRowLeft: {
    gap: 2,
  },
  emailDisplay: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: "500",
  },
  editText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.tint,
  },
  codeSentBox: {
    alignItems: "center",
    marginBottom: 24,
    gap: 6,
  },
  codeSentIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EDF2D8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  codeSentTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.tint,
  },
  codeSentSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  resendLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.tint,
  },
});
