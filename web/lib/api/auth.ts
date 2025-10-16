import { z } from "zod";
import { post, get, put, setAuthToken, removeAuthToken } from "./client";
import type { AxiosRequestConfig, AxiosError } from "axios";
import { isAxiosError } from "axios";

// Zod schemas for validation
export const UserSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string().email(),
  connectedCalendars: z
    .array(
      z.object({
        provider: z.enum(["google", "microsoft"]),
        email: z.string().email(),
        connectedAt: z.string(),
      })
    )
    .optional(),
  preferences: z
    .object({
      defaultCalendar: z.string().optional(),
      workingHours: z
        .object({
          start: z.string(),
          end: z.string(),
        })
        .optional(),
    })
    .optional(),
});

export const RegisterRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// API functions
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const validated = RegisterRequestSchema.parse(data);
  const response = await post<AuthResponse>("/auth/register", validated);

  // Store token on successful registration
  setAuthToken(response.token);

  return response;
}

/**
 * Authenticate a user using their credentials and persist the returned auth token.
 *
 * @param data - The user's login credentials (email and password)
 * @returns The authentication response containing an auth token and the authenticated user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const validated = LoginRequestSchema.parse(data);
  const response = await post<AuthResponse>("/auth/login", validated);

  // Store token on successful login
  setAuthToken(response.token);

  return response;
}

/**
 * Retrieve the current authenticated user, optionally using an override token.
 *
 * @param tokenOverride - Optional auth token to include in the request instead of the stored token
 * @returns An object `{ user }` containing the authenticated user's data
 * @throws Error when the response does not include a user or when the request fails
 */
export async function getCurrentUser(tokenOverride?: string): Promise<{ user: User }> {
  // Debug logging only in development or when explicit flag is set
  const debugEnabled =
    process.env.NEXT_PUBLIC_DEBUG === "true" || process.env.NODE_ENV === "development";
  const logDebug = (...args: unknown[]) => {
    if (debugEnabled) console.debug(...args);
  };

  logDebug("[getCurrentUser] Called with tokenOverride:", !!tokenOverride);
  logDebug("[getCurrentUser] API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL);

  const config: AxiosRequestConfig | undefined = tokenOverride
    ? {
        headers: {
          // redact token from any debug output
          "x-auth-token": tokenOverride,
        },
      }
    : undefined;

  // If debug, log a redacted view of the request config (tokens replaced)
  if (debugEnabled && config && config.headers) {
    const redacted = { ...config, headers: { ...config.headers, ["x-auth-token"]: "[REDACTED]" } };
    logDebug("[getCurrentUser] Request config (redacted):", redacted);
  }

  try {
    const res = (await get<Partial<{ user: User }>>("/auth/me", config)) as Partial<{ user: User }>;

    // Don't log the full response (may contain PII). In debug, show presence and anonymized id only.
    const user = res?.user;
    if (debugEnabled && user) {
      const rawId: string | undefined =
        typeof user._id === "string" ? user._id : (user as unknown as { id?: string }).id;
      const anonId = rawId ? `...${String(rawId).slice(-6)}` : "unknown";
      logDebug("[getCurrentUser] Response received: user present", {
        anonId,
        hasEmail: !!user.email,
      });
    } else {
      logDebug("[getCurrentUser] Response received: user present:", !!user);
    }

    if (!user) {
      // Log minimal error without PII
      console.error("[getCurrentUser] No user in /auth/me response");
      throw new Error("User not found in /auth/me response");
    }

    return { user };
  } catch (error: unknown) {
    // Avoid printing full error objects that may contain PII or token headers; log safe summary
    let msg = String(error);
    let status: number | undefined;
    if (isAxiosError(error)) {
      msg = error.message;
      status = (error as AxiosError)?.response?.status;
    } else if (error instanceof Error) {
      msg = error.message;
    }

    if (debugEnabled) {
      console.error("[getCurrentUser] Error (debug):", msg, status);
    } else {
      console.error("[getCurrentUser] Error:", msg);
    }
    throw error;
  }
}

/**
 * Clears authentication state for the current client.
 *
 * Removes the stored authentication token and, if running in a browser, removes the "user" entry from localStorage.
 */
export async function logout(): Promise<void> {
  // Clear token from storage
  removeAuthToken();

  // Also clear user data if stored
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
}

/**
 * Build the Google OAuth URL using NEXT_PUBLIC_API_BASE_URL or "http://localhost:5001" as the base.
 *
 * @returns The full Google OAuth URL (e.g. `${baseUrl}/auth/google`).
 */
export function getGoogleAuthUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
  return `${baseUrl}/auth/google`;
}

/**
 * Builds the absolute URL for initiating Microsoft OAuth with the API.
 *
 * @returns The absolute URL of the API's Microsoft authentication endpoint.
 */
export function getMicrosoftAuthUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
  return `${baseUrl}/auth/microsoft`;
}

export async function disconnectCalendar(
  provider: "google" | "microsoft"
): Promise<{ message: string }> {
  return post<{ message: string }>("/auth/disconnect", { provider });
}

export interface UserPreferences {
  defaultCalendar?: string;
  workingHours?: {
    start: string;
    end: string;
  };
  [key: string]: unknown;
}

/**
 * Update the current user's preferences.
 *
 * @param preferences - Preferences to set; may include `defaultCalendar` and `workingHours` (`start`, `end`)
 * @returns An object containing the updated `user`
 */
export async function updateUserPreferences(preferences: UserPreferences): Promise<{ user: User }> {
  return put<{ user: User }>("/auth/preferences", preferences);
}
