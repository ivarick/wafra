/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Send, Sparkles, User, RefreshCw, Mic } from "lucide-react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Speech from "expo-speech";

import Colors from "@/constants/colors";
import type { Lang } from "@/constants/i18n";
import { GREETINGS } from "@/constants/i18n";
import type { ChatMessage as Message } from "@/domain/entities/ChatMessage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { VoiceOverlay } from "@/components/VoiceOverlay";
import { fetchChatbot } from "@/utils/chatbotApi";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { usePlan } from "@/hooks/usePlan";

function BotAvatar() {
  return (
    <View style={styles.botAvatarWrap}>
      <Sparkles size={13} color="#fff" />
    </View>
  );
}

function MessageBubble({ msg, lang }: { msg: Message; lang: Lang }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const isUser = msg.sender === "user";

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser && styles.messageRowUser,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {!isUser && <BotAvatar />}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser, lang === "ar" && styles.rtl]}>
          {msg.text}
        </Text>
      </View>
      {isUser && (
        <View style={styles.userAvatarWrap}>
          <User size={13} color="#fff" />
        </View>
      )}
    </Animated.View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { lang, setLang } = useAppLanguage();
  const { hasFeature } = usePlan();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const headerFade = useRef(new Animated.Value(0)).current;
  // Track the active TTS sound so we can stop it before recording starts.
  const activeSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const getErrorMessage = useCallback(
    () =>
      lang === "fr"
        ? "Je n'arrive pas a joindre le service de chat pour le moment. Verifiez que l'API chatbot tourne bien."
        : lang === "ar"
          ? "ما قدرتش نوصل لخدمة الشات حاليا. تأكد بلي chatbot API راهي خدامة."
          : "I could not reach the chatbot service right now. Check that the chatbot API is running.",
    [lang]
  );

  // Stops any currently-playing TTS audio and releases the audio session.
  const stopCurrentTTS = useCallback(async () => {
    const s = activeSoundRef.current;
    if (!s) return;
    activeSoundRef.current = null;
    try {
      await s.stopAsync();
      await s.unloadAsync();
    } catch {
      // Already stopped/unloaded — ignore.
    }
  }, []);

  // Fallback TTS using the device's built-in speech engine.
  const speakWithDeviceTTS = useCallback((text: string, languageHint: string) => {
    const locale =
      languageHint === "ar" ? "ar" :
      languageHint === "fr" ? "fr-FR" : "en-US";
    const clean = text.replace(/[#*_`>\-\[\]]/g, " ").replace(/\s+/g, " ").trim();
    Speech.stop();
    Speech.speak(clean, {
      language: locale,
      rate: Platform.OS === "android" ? 1.0 : 0.95,
    });
  }, []);

  const playVoiceResponse = useCallback(async (text: string, languageHint: string) => {
    // Stop any previous TTS before starting a new one.
    await stopCurrentTTS();
    try {
      // ── Step 1: Try the Orpheus TTS backend (premium quality) ──
      // Requires terms acceptance at:
      // https://console.groq.com/playground?model=canopylabs/orpheus-arabic-saudi
      // https://console.groq.com/playground?model=canopylabs/orpheus-v1-english
      const res = await Promise.race([
        fetchChatbot("/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language_hint: languageHint }),
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TTS timeout")), 15_000)
        ),
      ]);

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Orpheus TTS ${res.status}: ${errBody.slice(0, 200)}`);
      }

      // Decode WAV bytes → base64 → temp file → Audio.Sound
      const wavBlob = await res.blob();
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(wavBlob);
      });

      const tmpPath = `${FileSystem.cacheDirectory}tts_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(tmpPath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: tmpPath },
        { shouldPlay: true }
      );

      activeSoundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          if (activeSoundRef.current === sound) activeSoundRef.current = null;
          sound.unloadAsync();
          FileSystem.deleteAsync(tmpPath, { idempotent: true });
        }
      });

    } catch (err) {
      // ── Step 2: Orpheus unavailable — fall back to device TTS ──
      console.warn("Orpheus TTS unavailable, using device TTS fallback:", err);
      speakWithDeviceTTS(text, languageHint);
    }
  }, [stopCurrentTTS, speakWithDeviceTTS]);

  const sendMessage = useCallback(
    async (text: string, isVoiceMode: boolean = false, detectedLang?: string) => {
      if (!text.trim()) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        text: text.trim(),
        sender: "user",
        timestamp: new Date(),
      };
      const conversation = [...messages, userMsg];

      setMessages(conversation);
      setInput("");
      setIsTyping(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      try {
        const res = await fetchChatbot("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: conversation.map((message) => ({
              role: message.sender === "user" ? "user" : "assistant",
              content: message.text,
            })),
            language_hint: lang,
            voice_mode: isVoiceMode,
          }),
        });

        if (!res.ok) {
          throw new Error(`Chat request failed with status ${res.status}`);
        }

        const data = await res.json();
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: data.reply,
          sender: "assistant",
          timestamp: new Date(),
        };

        setMessages((current) => [...current, botMsg]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

        if (isVoiceMode) {
          // Use the language detected from the user's speech, not the UI selection.
          await playVoiceResponse(data.reply, detectedLang || lang);
        }
      } catch (err) {
        console.error(err);
        setMessages((current) => [
          ...current,
          {
            id: (Date.now() + 2).toString(),
            text: getErrorMessage(),
            sender: "assistant",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [getErrorMessage, lang, messages, playVoiceResponse, speakWithDeviceTTS]
  );

  const switchLang = useCallback((newLang: Lang) => {
    setLang(newLang);
    setMessages([]);
  }, [setLang]);

  const isEmpty = messages.length === 0;
  const greeting = GREETINGS[lang];
  const voiceEnabled = hasFeature("voice");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerInner}>
          <View style={styles.botRow}>
            <View style={styles.botIconWrap}>
              <Sparkles size={16} color="#fff" />
            </View>
            <View>
              <Text style={styles.botName}>WAFRA AI</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => setMessages([])}
              activeOpacity={0.7}
            >
              <RefreshCw size={14} color={Colors.light.textSecondary} />
            </TouchableOpacity>
            <View style={styles.langSelector}>
              {(["en", "fr", "ar"] as Lang[]).map((itemLang) => (
                <TouchableOpacity
                  key={itemLang}
                  style={[styles.langPill, lang === itemLang && styles.langPillActive]}
                  onPress={() => switchLang(itemLang)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.langText, lang === itemLang && styles.langTextActive]}>
                    {itemLang.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {isEmpty && (
        <Animated.View style={[styles.greetingWrap, { opacity: headerFade }]}>
          <Text style={[styles.greetingTitle, lang === "ar" && styles.rtl]}>{greeting.title}</Text>
          <Text style={[styles.greetingSub, lang === "ar" && styles.rtl]}>{greeting.sub}</Text>
        </Animated.View>
      )}

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          ref={scrollRef}
          style={styles.messagesArea}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 12,
            paddingTop: isEmpty ? 0 : 12,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} lang={lang} />
          ))}
          {isTyping && (
            <View style={styles.messageRow}>
              <BotAvatar />
              <View style={styles.bubbleBot}>
                <TypingIndicator />
              </View>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.inputBox}>
          <TouchableOpacity
            style={[styles.micBtn, !voiceEnabled && styles.micBtnDisabled]}
            onPress={() => {
              if (!voiceEnabled) {
                Alert.alert("Pro feature", "Voice input/output is available in Pro Farmer.");
                return;
              }
              // Stop any active TTS BEFORE opening the microphone.
              // This releases the audio session so recording can take over.
              stopCurrentTTS().then(() => setVoiceVisible(true));
            }}
            activeOpacity={0.75}
          >
            <Mic size={22} color={Colors.light.tint} />
          </TouchableOpacity>

          <TextInput
            style={[styles.textInput, lang === "ar" && styles.rtl]}
            placeholder={
              lang === "fr" ? "Posez votre question..." : lang === "ar" ? "اكتب سؤالك..." : "Ask me anything..."
            }
            placeholderTextColor={Colors.light.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            textAlignVertical="center"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <Send size={17} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>Please double-check important responses.</Text>
      </View>

      {voiceEnabled ? (
        <VoiceOverlay
          visible={voiceVisible}
          onClose={() => setVoiceVisible(false)}
          onTranscript={(text, detectedLang) => {
            setVoiceVisible(false);
            sendMessage(text, true, detectedLang);
          }}
          lang={lang}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerInner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  botRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  botIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
  },
  botName: { fontSize: 16, fontWeight: "700", color: Colors.light.text, letterSpacing: -0.2 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.light.success },
  onlineText: { fontSize: 11, color: Colors.light.success, fontWeight: "600" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
  },
  langSelector: { flexDirection: "row", gap: 5 },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  langPillActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  langText: { fontSize: 11, fontWeight: "700", color: Colors.light.textSecondary },
  langTextActive: { color: "#fff" },
  greetingWrap: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  greetingTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.light.text,
    lineHeight: 30,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  greetingSub: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 20 },
  messagesArea: { flex: 1 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 12 },
  messageRowUser: { justifyContent: "flex-end" },
  botAvatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  userAvatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.textSecondary,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  bubble: { maxWidth: "72%", paddingHorizontal: 14, paddingVertical: 11, borderRadius: 18 },
  bubbleBot: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: { backgroundColor: Colors.light.tint, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 21, color: Colors.light.text },
  bubbleTextUser: { color: "#fff" },
  typingWrap: { flexDirection: "row", gap: 5, paddingVertical: 4, paddingHorizontal: 4, alignItems: "center" },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.light.textSecondary },
  inputBar: {
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.background,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 50,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
  },
  micBtnDisabled: {
    opacity: 0.45,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  disclaimer: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  rtl: { textAlign: "right", writingDirection: "rtl" },
});
