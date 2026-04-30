export type ChatMessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  text: string;
  sender: ChatMessageRole;
  timestamp: Date;
  isAudio?: boolean;
}
