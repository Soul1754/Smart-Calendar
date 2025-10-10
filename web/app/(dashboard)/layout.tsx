"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";

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
