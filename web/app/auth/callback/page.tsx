"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";

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
        console.log("OAuth callback: received token", token.substring(0, 20) + "...");
        
        // Ensure we save the token with the exact key used by the API client
        const { setAuthToken } = await import("@/lib/api/client");
        setAuthToken(token);
        console.log("OAuth callback: token saved to localStorage");

        // Fetch user data with the token
        const { getCurrentUser } = await import("@/lib/api/auth");
        console.log("OAuth callback: fetching user...");
        const response = await getCurrentUser(token);
        console.log("OAuth callback: received user response", response);
        
        const { user } = response;
        if (!user) {
          throw new Error("User object is missing from response");
        }
        console.log("OAuth callback: user data", { id: user._id, email: user.email });

        // Now login with both token and user data
        login(token, user);
        console.log("OAuth callback: login() called");

        toast.success("Successfully connected your calendar!");
        router.push("/calendar");
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
