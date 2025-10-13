import { z } from "zod";
import { post, get, put, setAuthToken, removeAuthToken } from "./client";

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

export async function getCurrentUser(): Promise<{ user: User }> {
  return get<{ user: User }>("/auth/me");
}

export async function logout(): Promise<void> {
  // Clear token from storage
  removeAuthToken();

  // Also clear user data if stored
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
}

export function getGoogleAuthUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
  return `${baseUrl}/auth/google/callback`;
}

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

export async function updateUserPreferences(preferences: UserPreferences): Promise<{ user: User }> {
  return put<{ user: User }>("/auth/preferences", preferences);
}
