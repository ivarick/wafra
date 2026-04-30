import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform, Modal, Alert } from "react-native";
import { BlurView } from "expo-blur";
import { Mic, MicOff, X } from "lucide-react-native";
import { Audio } from "expo-av";

import Colors from "@/constants/colors";
import type { Lang } from "@/constants/i18n";
import { fetchChatbot } from "@/utils/chatbotApi";

interface ParticleProps {
  delay: number;
  angle: number;
  distance: number;
  size?: number;
}

function Particle({ delay, angle, distance, size = 6 }: ParticleProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.delay(400),
      ])
    ).start();
  }, [anim, delay]);

  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance] });
  const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance] });
  const opacity = anim.interpolate({ inputRange: [0, 0.3, 0.8, 1], outputRange: [0, 0.9, 0.6, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.4, 1, 0.5] });

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.light.tint,
        opacity,
        transform: [{ translateX: tx }, { translateY: ty }, { scale }],
      }}
    />
  );
}

interface VoiceOverlayProps {
  visible: boolean;
  onClose: () => void;
  onTranscript: (text: string, detectedLang: string) => void;
  lang: Lang;
}

// Voice-optimised recording settings: mono 16 kHz for speech recognition.
// HIGH_QUALITY is stereo 44.1 kHz — 8× larger files, much slower to upload.
const VOICE_RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: false,
  android: {
    extension: ".m4a",
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 48000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 48000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 48000,
  },
};

export function VoiceOverlay({ visible, onClose, onTranscript, lang }: VoiceOverlayProps) {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const micScale = useRef(new Animated.Value(0.8)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isBusyRef = useRef(false);
  const recordingStartRef = useRef<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const particles = Array.from({ length: 10 }, (_, i) => ({
    angle: (i / 10) * Math.PI * 2,
    distance: 72 + (i % 3) * 18,
    delay: i * 110,
    size: 5 + (i % 3) * 2,
  }));

  const releaseAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (err) {
      console.error("Failed to reset audio mode", err);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error("Microphone permission was denied.");
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        VOICE_RECORDING_OPTIONS
      );
      recordingRef.current = recording;
      recordingStartRef.current = Date.now(); // track start time
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Voice input unavailable", "Microphone access is required to use voice mode.");
      onClose();
    }
  }, [onClose]);

  const processAudio = async (uri: string) => {
    setIsProcessing(true);
    // AbortController truly cancels the HTTP request on timeout.
    // Promise.race alone only rejected the JS promise — the fetch kept running,
    // holding the audio session open and causing the "stuck" state.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    try {
      const formData = new FormData();
      const filename = uri.split("/").pop() || "audio.m4a";

      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append("file", blob, filename);
      } else {
        const ext = (filename.split(".").pop() || "m4a").toLowerCase();
        const mimeMap: Record<string, string> = {
          m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav",
          mp3: "audio/mpeg", ogg: "audio/ogg", webm: "audio/webm",
        };
        formData.append("file", { uri, name: filename, type: mimeMap[ext] ?? "audio/mp4" } as never);
      }

      // Send as language_hint — backend will auto-detect with Whisper
      // if the UI is set to "en" (the default), so Arabic speech is
      // always recognised correctly regardless of UI language selection.
      formData.append("language_hint", lang);

      const res = await fetchChatbot("/voice/transcribe", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Transcription error ${res.status}: ${body.slice(0, 120)}`);
      }

      const data = await res.json();
      if (data.text) {
        // Pass detected language back so TTS speaks in the right language.
        onTranscript(data.text, data.language || lang);
        return;
      }
      throw new Error("No transcript in response.");
    } catch (err: any) {
      console.error("processAudio error:", err);
      const isAbort = err?.name === "AbortError";
      Alert.alert(
        isAbort ? "Request timed out" : "Could not transcribe",
        isAbort
          ? "Transcription took over 15s. Check your Wi-Fi and that the backend is running."
          : "We could not process your recording. Please try again."
      );
      onClose();
    } finally {
      clearTimeout(timeoutId);
      setIsProcessing(false);
    }
  };

  const stopRecording = async (shouldSubmit: boolean) => {
    const currentRecording = recordingRef.current;
    if (!currentRecording) {
      // No active recording — always close the overlay.
      await releaseAudioMode();
      onClose();
      return;
    }

    recordingRef.current = null;

    try {
      // Use wall-clock time to guard against very short recordings.
      // getStatusAsync() is unreliable on Android during the first few frames.
      if (shouldSubmit) {
        const elapsed = Date.now() - recordingStartRef.current;
        if (elapsed < 800) {
          await currentRecording.stopAndUnloadAsync();
          await releaseAudioMode();
          Alert.alert("Too short", "Hold the button longer and speak clearly, then tap Stop & Send.");
          onClose();
          return;
        }
      }

      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      await releaseAudioMode();

      if (shouldSubmit && uri) {
        await processAudio(uri);
      } else {
        onClose();
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
      await releaseAudioMode();
      if (shouldSubmit) {
        Alert.alert("Voice input unavailable", "We could not finish that recording. Please try again.");
      }
      onClose();
    }
  };

  const handleCancel = async () => {
    if (isBusyRef.current) return;
    await stopRecording(false);
  };

  const handleSubmit = async () => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    try {
      await stopRecording(true);
    } finally {
      // Always reset so a failed attempt never freezes the button.
      isBusyRef.current = false;
    }
  };

  useEffect(() => {
    if (!visible) {
      return;
    }

    // Reset processing state each time overlay opens.
    setIsProcessing(false);
    isBusyRef.current = false;

    startRecording();

    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    Animated.spring(micScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }).start();

    const ring = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1.55, duration: 900, useNativeDriver: true }),
          Animated.timing(value, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );

    ring(pulse1, 0).start();
    ring(pulse2, 300).start();
    ring(pulse3, 600).start();

    return () => {
      // Stop animations.
      [pulse1, pulse2, pulse3, micScale, fadeIn].forEach((v) => v.stopAnimation());
      fadeIn.setValue(0);
      micScale.setValue(0.8);
      [pulse1, pulse2, pulse3].forEach((v) => v.setValue(1));

      // Force-stop any active recording so audio session is always released.
      const rec = recordingRef.current;
      if (rec) {
        recordingRef.current = null;
        rec.stopAndUnloadAsync().catch(() => {});
        Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }).catch(() => {});
      }

      // Reset state for next open.
      isBusyRef.current = false;
    };
  }, [fadeIn, micScale, pulse1, pulse2, pulse3, startRecording, visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
        <Animated.View style={[overlayStyles.container, { opacity: fadeIn }]}>
          {/* Close button — disabled while transcribing */}
          {!isProcessing && (
            <TouchableOpacity style={overlayStyles.closeBtn} onPress={handleCancel} activeOpacity={0.8}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {isProcessing ? (
            // Processing state: show a spinner-like label
            <>
              <Text style={overlayStyles.listeningLabel}>Transcribing...</Text>
              <Text style={overlayStyles.listeningHint}>Processing your voice message</Text>
            </>
          ) : (
            <>
              <Text style={overlayStyles.listeningLabel}>Listening...</Text>
              <Text style={overlayStyles.listeningHint}>Speak your question in any language</Text>
            </>
          )}

          <View style={overlayStyles.animCenter}>
            <Animated.View style={[overlayStyles.ring, overlayStyles.ring3, { transform: [{ scale: pulse3 }] }]} />
            <Animated.View style={[overlayStyles.ring, overlayStyles.ring2, { transform: [{ scale: pulse2 }] }]} />
            <Animated.View style={[overlayStyles.ring, overlayStyles.ring1, { transform: [{ scale: pulse1 }] }]} />

            {particles.map((particle, index) => (
              <Particle
                key={index}
                angle={particle.angle}
                distance={particle.distance}
                delay={particle.delay}
                size={particle.size}
              />
            ))}

            <Animated.View style={[overlayStyles.micCircle, { transform: [{ scale: micScale }] }]}>
              <Mic size={34} color="#fff" />
            </Animated.View>
          </View>

          <TouchableOpacity style={overlayStyles.stopBtn} onPress={handleSubmit} activeOpacity={0.8}>
            <MicOff size={18} color={Colors.light.tint} />
            <Text style={overlayStyles.stopBtnText}>Stop And Send</Text>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const overlayStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  closeBtn: {
    position: "absolute",
    top: 56,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  listeningLabel: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  listeningHint: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 64,
    textAlign: "center",
  },
  animCenter: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 72,
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1.5,
  },
  ring1: {
    width: 120,
    height: 120,
    borderColor: `${Colors.light.tint}90`,
    backgroundColor: `${Colors.light.tint}12`,
  },
  ring2: {
    width: 148,
    height: 148,
    borderColor: `${Colors.light.tint}55`,
    backgroundColor: `${Colors.light.tint}08`,
  },
  ring3: {
    width: 176,
    height: 176,
    borderColor: `${Colors.light.tint}30`,
    backgroundColor: `${Colors.light.tint}04`,
  },
  micCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 12,
  },
  stopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },
  stopBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.tint,
  },
});
