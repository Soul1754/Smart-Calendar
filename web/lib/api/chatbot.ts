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
  data: z
    .object({
      events: z
        .array(
          z.object({
            title: z.string(),
            time: z.string(),
            attendees: z.number().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  followUp: z.string().optional(),
  // Pending can be either a boolean or an array of strings. Use array type first in the union to match runtime expectations.
  pending: z.union([z.array(z.string()), z.boolean()]).optional(),
  collectedParams: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  availableSlots: z
    .array(
      z.object({
        start: z.string(),
        end: z.string(),
        index: z.number().optional(),
        label: z.string().optional(),
        score: z.number().optional(),
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
  data?: {
    events?: Array<{
      title: string;
      time: string;
      attendees?: number;
    }>;
  };
  followUp?: string;
  // explicit union order: string[] | boolean
  pending?: string[] | boolean;
  collectedParams?: Record<string, string | number | boolean>;
  availableSlots?: Array<{
    start: string;
    end: string;
    index?: number;
    label?: string;
    score?: number;
  }>;
  isError?: boolean;
}
/**
 * Sends a chat message to the chatbot API and returns the chatbot's response.
 *
 * @param message - The text of the message to send
 * @param model - Optional model identifier to use for processing the message
 * @returns The chatbot response object containing `message` and optional `data`, `followUp`, `pending`, `collectedParams`, and `availableSlots`
 */
export async function sendMessage(message: string, model?: string): Promise<ChatMessageResponse> {
  const data: ChatMessageRequest = {
    message,
    timezone: getUserTimezone(),
    ...(model && { model }),
  };

  const validated = ChatMessageRequestSchema.parse(data);
  return post<ChatMessageResponse>("/api/chatbot/message", validated);
}