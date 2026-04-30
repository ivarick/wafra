import { Platform } from "react-native";

const envUrl = process.env.EXPO_PUBLIC_CHATBOT_URL?.trim();

let cachedBaseUrl: string | null = null;
let pendingResolution: Promise<string> | null = null;

function normaliseBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function buildCandidateUrls() {
  const candidates = new Set<string>();

  // Always try the env URL first — it is set to the PC's real LAN IP.
  if (envUrl) {
    candidates.add(normaliseBaseUrl(envUrl));
  }

  if (Platform.OS === "android") {
    // 10.0.2.2 only works in the Android Emulator, NOT on a real device.
    // Real-device hotspot IPs are added here as extra fallbacks.
    candidates.add("http://172.17.224.68:9000");
    candidates.add("http://192.168.43.1:9000");
    candidates.add("http://10.0.2.2:9000");
  } else {
    candidates.add("http://localhost:9000");
    candidates.add("http://127.0.0.1:9000");
    candidates.add("http://172.20.10.2:9000");
  }

  return [...candidates];
}

async function isHealthy(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function resolveChatbotBaseUrl() {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  if (pendingResolution) {
    return pendingResolution;
  }

  pendingResolution = (async () => {
    const candidates = buildCandidateUrls();

    for (const candidate of candidates) {
      if (await isHealthy(candidate)) {
        cachedBaseUrl = candidate;
        return candidate;
      }
    }

    const fallback = candidates[0] ?? "http://localhost:9000";
    cachedBaseUrl = fallback;
    return fallback;
  })();

  try {
    return await pendingResolution;
  } finally {
    pendingResolution = null;
  }
}

export async function fetchChatbot(path: string, init?: RequestInit) {
  // If the caller already aborted before we start, fail immediately.
  if ((init?.signal as AbortSignal | undefined)?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const candidates = [await resolveChatbotBaseUrl(), ...buildCandidateUrls()];
  const tried = new Set<string>();
  let lastError: unknown;

  for (const baseUrl of candidates) {
    if (tried.has(baseUrl)) {
      continue;
    }

    tried.add(baseUrl);

    try {
      const response = await fetch(`${baseUrl}${path}`, init);
      cachedBaseUrl = baseUrl;
      return response;
    } catch (error: any) {
      lastError = error;
      // If the request was aborted, stop trying other candidates immediately.
      if (error?.name === "AbortError") {
        break;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to reach the chatbot service.");
}
