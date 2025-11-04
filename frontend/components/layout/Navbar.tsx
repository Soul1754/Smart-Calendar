"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  CalendarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/calendar" className="flex items-center space-x-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Smart Calendar</span>
          </Link>

          {/* Right side: User menu */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* User info */}
            {user && (
              <div className="flex items-center gap-2">
                <Link href="/profile">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                    <UserCircleIcon className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground hidden sm:inline-block">
                      {user.name}
                    </span>
                  </button>
                </Link>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
