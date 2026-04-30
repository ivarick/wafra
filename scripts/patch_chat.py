import re

with open(r"app\(tabs)\chat.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add import for Audio
content = content.replace(
    'import Colors from "@/constants/colors";',
    'import Colors from "@/constants/colors";\nimport { Audio } from "expo-av";'
)

# 2. Update VoiceOverlayProps and VoiceOverlay
voice_overlay_old = """interface VoiceOverlayProps {
  visible: boolean;
  onClose: () => void;
}

function VoiceOverlay({ visible, onClose }: VoiceOverlayProps) {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const micScale = useRef(new Animated.Value(0.8)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
    angle: (i / 10) * Math.PI * 2,
    distance: 72 + (i % 3) * 18,
    delay: i * 110,
    size: 5 + (i % 3) * 2,
  }));

  useEffect(() => {
    if (!visible) return;


    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();"""

voice_overlay_new = """interface VoiceOverlayProps {
  visible: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
  lang: Lang;
}

function VoiceOverlay({ visible, onClose, onTranscript, lang }: VoiceOverlayProps) {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const micScale = useRef(new Animated.Value(0.8)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);

  const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
    angle: (i / 10) * Math.PI * 2,
    distance: 72 + (i % 3) * 18,
    delay: i * 110,
    size: 5 + (i % 3) * 2,
  }));

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const processAudio = async (uri: string) => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'audio.m4a';
      
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('file', blob, filename);
      } else {
        formData.append('file', { uri, name: filename, type: 'audio/m4a' } as any);
      }
      
      formData.append('language', lang);

      const res = await fetch('http://localhost:9000/voice/transcribe', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!res.ok) throw new Error("Transcription failed");
      const data = await res.json();
      if (data.text) {
        onTranscript(data.text);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = async () => {
    const currentRecording = recordingRef.current;
    if (!currentRecording) return;
    recordingRef.current = null;
    try {
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      if (uri) {
        await processAudio(uri);
      }
    } catch (err) {
      console.error("Failed to stop", err);
    }
  };

  useEffect(() => {
    if (!visible) {
      stopRecording();
      return;
    }
    
    startRecording();

    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();"""

content = content.replace(voice_overlay_old, voice_overlay_new)

# 3. Update sendMessage and playVoiceResponse
send_message_old = """  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const userMsg: Message = { id: Date.now().toString(), text, sender: "user", timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      setTimeout(() => {
        setIsTyping(false);
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: BOT_REPLIES[lang],
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }, 1400);
    },
    [lang]
  );"""

send_message_new = """  const playVoiceResponse = async (text: string, languageHint: string) => {
    try {
      const response = await fetch("http://localhost:9000/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language_hint: languageHint })
      });
      if (!response.ok) throw new Error("Failed to synthesise speech");
      
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = async () => {
        const base64data = reader.result as string;
        try {
          const { sound } = await Audio.Sound.createAsync({ uri: base64data });
          await sound.playAsync();
        } catch (e) {
          console.error("Audio playback error", e);
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = useCallback(
    async (text: string, isVoiceMode: boolean = false) => {
      if (!text.trim()) return;
      const userMsg: Message = { id: Date.now().toString(), text, sender: "user", timestamp: new Date() };
      
      setMessages((prev) => {
        const newMessages = [...prev, userMsg];
        
        const fetchResponse = async () => {
          setIsTyping(true);
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
          
          try {
            const payload = {
              messages: newMessages.map(m => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
              voice_mode: isVoiceMode,
              language_hint: lang
            };

            const res = await fetch("http://localhost:9000/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            
            if (!res.ok) throw new Error("Failed to fetch from backend");
            
            const data = await res.json();
            
            const botMsg: Message = {
              id: (Date.now() + 1).toString(),
              text: data.reply,
              sender: "bot",
              timestamp: new Date(),
            };
            
            setMessages((current) => [...current, botMsg]);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

            if (isVoiceMode) {
              playVoiceResponse(data.reply, lang);
            }
          } catch (err) {
            console.error(err);
          } finally {
            setIsTyping(false);
          }
        };
        
        fetchResponse();
        return newMessages;
      });
      
      setInput("");
    },
    [lang]
  );"""

content = content.replace(send_message_old, send_message_new)

# 4. Update VoiceOverlay call
overlay_call_old = "<VoiceOverlay visible={voiceVisible} onClose={() => setVoiceVisible(false)} />"
overlay_call_new = """<VoiceOverlay 
        visible={voiceVisible} 
        onClose={() => setVoiceVisible(false)} 
        onTranscript={(text) => {
          setVoiceVisible(false);
          sendMessage(text, true);
        }}
        lang={lang}
      />"""

content = content.replace(overlay_call_old, overlay_call_new)

with open(r"app\(tabs)\chat.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched chat.tsx successfully")
