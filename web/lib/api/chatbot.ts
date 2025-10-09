import { z } from "zod";
import { post } from "./client";
import { getUserTimezone } from "../utils/date";

// Zod schemas
export const ChatMessageRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  timezone: z.string(),
  model: z.string().optional(),
});

export const ChatMessageResponseSchema = z.object({
  message: z.string(),
  data: z.unknown().optional(),
  followUp: z.string().optional(),
  pending: z.boolean().optional(),
  collectedParams: z.record(z.string(), z.unknown()).optional(),
  availableSlots: z
    .array(
      z.object({
        start: z.string(),
        end: z.string(),
      })
    )
    .optional(),
});

// Type exports
export type ChatMessageRequest = z.infer<typeof ChatMessageRequestSchema>;
export type ChatMessageResponse = z.infer<typeof ChatMessageResponseSchema>;

export interface ChatMessage {
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  data?: unknown;
  followUp?: string;
  pending?: boolean;
  collectedParams?: Record<string, unknown>;
  availableSlots?: Array<{ start: string; end: string }>;
  isError?: boolean;
}

// API functions
export async function sendMessage(message: string, model?: string): Promise<ChatMessageResponse> {
  const data: ChatMessageRequest = {
    message,
    timezone: getUserTimezone(),
    ...(model && { model }),
  };

  const validated = ChatMessageRequestSchema.parse(data);
  return post<ChatMessageResponse>("/api/chatbot/message", validated);
}
