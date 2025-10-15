import { z } from "zod";
import { post, get, put, setAuthToken, removeAuthToken } from "./client";
import type { AxiosRequestConfig } from "axios";

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

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const validated = LoginRequestSchema.parse(data);
  const response = await post<AuthResponse>("/auth/login", validated);

  // Store token on successful login
  setAuthToken(response.token);

  return response;
}

export async function getCurrentUser(tokenOverride?: string): Promise<{ user: User }> {
  console.log("[getCurrentUser] Called with tokenOverride:", !!tokenOverride);
  console.log("[getCurrentUser] API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
  
  const config: AxiosRequestConfig | undefined = tokenOverride
    ? { 
        headers: { 
          "x-auth-token": tokenOverride,
          "ngrok-skip-browser-warning": "true" // Add ngrok header here too
        } 
      }
    : undefined;
  
  console.log("[getCurrentUser] Request config:", config);
  
  try {
    const res = await get<Partial<{ user: User }>>("/auth/me", config);
    console.log("[getCurrentUser] Response received:", res);
    
    if (!res || !res.user) {
      console.error("[getCurrentUser] No user in response, full response:", res);
      throw new Error("User not found in /auth/me response");
    }
    return { user: res.user };
  } catch (error) {
    console.error("[getCurrentUser] Error caught:", error);
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