import { z } from "zod";
import { post, get } from "./client";

// Zod schemas
export const CalendarEventSchema = z.object({
  id: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  start: z.object({
    dateTime: z.string(),
    timeZone: z.string().optional(),
  }),
  end: z.object({
    dateTime: z.string(),
    timeZone: z.string().optional(),
  }),
  attendees: z
    .array(
      z.object({
        email: z.string(),
        displayName: z.string().optional(),
        responseStatus: z.string().optional(),
      })
    )
    .optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  htmlLink: z.string().optional(),
});

export const CreateEventRequestSchema = z.object({
  summary: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start: z.object({
    dateTime: z.string(),
    timeZone: z.string().optional(),
  }),
  end: z.object({
    dateTime: z.string(),
    timeZone: z.string().optional(),
  }),
  attendees: z.array(z.string().email()).optional(),
  location: z.string().optional(),
});

export const AvailableSlotsRequestSchema = z.object({
  date: z.string(), // ISO date string
  duration: z.number().min(15), // minutes
  attendees: z.array(z.string().email()),
  businessHours: z
    .object({
      start: z.string(), // e.g., "09:00"
      end: z.string(), // e.g., "17:00"
    })
    .optional(),
  incrementMinutes: z.number().optional(),
  maxResults: z.number().optional(),
});

// Type exports
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>;
export type AvailableSlotsRequest = z.infer<typeof AvailableSlotsRequestSchema>;

export interface TimeSlot {
  start: string;
  end: string;
}

export interface AvailableSlotsResponse {
  availableSlots: TimeSlot[];
  date: string;
}

// API functions
export async function getGoogleEvents(params?: {
  timeMin?: string;
  timeMax?: string;
}): Promise<{ events: CalendarEvent[] }> {
  const queryParams = new URLSearchParams();
  if (params?.timeMin) queryParams.append("timeMin", params.timeMin);
  if (params?.timeMax) queryParams.append("timeMax", params.timeMax);

  const url = `/api/calendar/google/events${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  return get<{ events: CalendarEvent[] }>(url);
}

export async function getMicrosoftEvents(params?: {
  timeMin?: string;
  timeMax?: string;
}): Promise<{ events: CalendarEvent[] }> {
  const queryParams = new URLSearchParams();
  if (params?.timeMin) queryParams.append("timeMin", params.timeMin);
  if (params?.timeMax) queryParams.append("timeMax", params.timeMax);

  const url = `/api/calendar/microsoft/events${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  return get<{ events: CalendarEvent[] }>(url);
}

export async function createGoogleEvent(
  data: CreateEventRequest
): Promise<{ event: CalendarEvent }> {
  const validated = CreateEventRequestSchema.parse(data);
  return post<{ event: CalendarEvent }>("/api/calendar/google/events", validated);
}

export async function createMicrosoftEvent(
  data: CreateEventRequest
): Promise<{ event: CalendarEvent }> {
  const validated = CreateEventRequestSchema.parse(data);
  return post<{ event: CalendarEvent }>("/api/calendar/microsoft/events", validated);
}

export async function findUnifiedAvailableSlots(
  data: AvailableSlotsRequest
): Promise<AvailableSlotsResponse> {
  const validated = AvailableSlotsRequestSchema.parse(data);
  return post<AvailableSlotsResponse>("/api/calendar/unified/findAvailableSlots", validated);
}

/**
 * Fetches all events from connected calendars (Google + Microsoft)
 * Fetches events from the past 30 days to next 90 days by default
 */
export async function getAllEvents(params?: {
  timeMin?: string;
  timeMax?: string;
}): Promise<{ events: CalendarEvent[] }> {
  try {
    // Default to past 30 days and next 90 days if not specified
    const timeMin =
      params?.timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax =
      params?.timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    console.log("📅 Fetching events with date range:", {
      from: new Date(timeMin).toLocaleDateString(),
      to: new Date(timeMax).toLocaleDateString(),
    });

    const [googleResponse, microsoftResponse] = await Promise.allSettled([
      getGoogleEvents({ timeMin, timeMax }),
      getMicrosoftEvents({ timeMin, timeMax }),
    ]);

    const events: CalendarEvent[] = [];

    if (googleResponse.status === "fulfilled") {
      const count = googleResponse.value.events?.length || 0;
      console.log("✅ Google Calendar:", count, "events");
      events.push(...googleResponse.value.events);
    } else {
      // Check if it's just "not connected" error (expected)
      const error = googleResponse.reason;
      if (error?.message?.includes("not connected")) {
        console.log("ℹ️ Google Calendar: Not connected");
      } else {
        console.error("❌ Google Calendar error:", error?.message || error);
      }
    }

    if (microsoftResponse.status === "fulfilled") {
      const count = microsoftResponse.value.events?.length || 0;
      console.log("✅ Microsoft Calendar:", count, "events");
      events.push(...microsoftResponse.value.events);
    } else {
      // Check if it's just "not connected" error (expected)
      const error = microsoftResponse.reason;
      if (error?.message?.includes("not connected")) {
        console.log("ℹ️ Microsoft Calendar: Not connected");
      } else {
        console.error("❌ Microsoft Calendar error:", error?.message || error);
      }
    }

    console.log("📊 Total events loaded:", events.length);
    return { events };
  } catch (error) {
    console.error("❌ Error fetching all events:", error);
    return { events: [] };
  }
}
