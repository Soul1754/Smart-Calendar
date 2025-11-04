"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { User, getCurrentUser, logout as apiLogout } from "@/lib/api/auth";
import { getAuthToken, setAuthToken, removeAuthToken } from "@/lib/api/client";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  loggingOut: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Verify token and fetch user data on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { user: userData } = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Auth verification failed:", error);
        removeAuthToken();
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback((token: string, userData: User) => {
    setAuthToken(token);
    setUser(userData);

    // Also store user data for quick access
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(userData));
    }
  }, []);

  const logout = useCallback(() => {
    // Set logging out flag FIRST to prevent dashboard redirect
    setLoggingOut(true);

    // Clear auth state
    apiLogout();
    setUser(null);

    // Navigate to landing page using router
    router.push("/");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const { user: userData } = await getCurrentUser();
      setUser(userData);

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      logout();
    }
  }, [logout]);

  const value = {
    user,
    isAuthenticated,
    loading,
    loggingOut,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
