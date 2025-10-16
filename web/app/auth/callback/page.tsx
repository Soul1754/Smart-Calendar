"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";

/**
 * Completes the OAuth callback flow, establishes the authenticated session, and shows a loading UI while processing.
 *
 * Attempts to read `token` and `error` from the URL search parameters. On `error` or a missing `token`, it shows an error toast and redirects to `/login`. If a `token` is present, it saves the token via the API client, fetches the current user with the token, calls the app `login` with the token and user, displays a success toast, and redirects to `/calendar`. Any failures during token saving or user retrieval show an error toast and redirect to `/login`.
 *
 * @returns The JSX element that renders a centered loading indicator and messages while the callback is handled.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        toast.error("Authentication failed", {
          description: decodeURIComponent(error),
        });
        router.push("/login");
        return;
      }

      if (!token) {
        toast.error("No authentication token received");
        router.push("/login");
        return;
      }

      try {
        // Ensure we save the token with the exact key used by the API client
        const { setAuthToken } = await import("@/lib/api/client");
        console.log("[Callback] Saving token to localStorage");
        setAuthToken(token);

        // Fetch user data with the token
        console.log("[Callback] Calling getCurrentUser with token");
        const { getCurrentUser } = await import("@/lib/api/auth");
        
        try {
          const response = await getCurrentUser(token);
          console.log("[Callback] getCurrentUser response:", response);
          
          const { user } = response;
          if (!user) {
            throw new Error("User object is missing from response");
          }

          // Now login with both token and user data
          login(token, user);

          toast.success("Successfully connected your calendar!");
          router.push("/calendar");
        } catch (getUserError) {
          console.error("[Callback] getCurrentUser failed:", getUserError);
          console.error("[Callback] Error details:", {
            message: getUserError instanceof Error ? getUserError.message : String(getUserError),
            stack: getUserError instanceof Error ? getUserError.stack : undefined
          });
          throw getUserError;
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        const errorMessage = error instanceof Error ? error.message : "Please try again";
        toast.error("Failed to complete authentication", {
          description: errorMessage,
        });
        router.push("/login");
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" />
        <h2 className="text-xl font-semibold text-foreground">Completing authentication...</h2>
        <p className="text-muted-foreground">Please wait while we connect your calendar</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Loading...</h2>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}