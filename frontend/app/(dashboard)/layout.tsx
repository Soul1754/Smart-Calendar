"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";


/**
 * Renders the dashboard layout and redirects unauthenticated users to the login page.
 *
 * Displays a centered loading UI while the authentication state is being determined. If authentication is resolved as unauthenticated and the user is not logging out, triggers a client-side redirect to "/login" and returns `null`. When the user is authenticated or currently logging out, renders the Navbar and the provided page content inside the dashboard layout.
 *
 * @param children - The page content to render inside the dashboard's main area.
 * @returns The dashboard layout element when authenticated or logging out, a loading UI while authentication is resolving, or `null` when redirecting to the login page.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, loading, loggingOut } = useAuth();

  useEffect(() => {
    // Don't redirect if user is in the process of logging out
    if (!loading && !isAuthenticated && !loggingOut) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, loggingOut, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated AND not logging out (will redirect)
  if (!isAuthenticated && !loggingOut) {
    return null;
  }

  return (
    <div className="dashboard-layout h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-hidden">{children}</main>
      

      
    </div>
  );
}