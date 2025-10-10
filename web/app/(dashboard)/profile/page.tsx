"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { toast } from "sonner";
import {
  UserCircleIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  // Disconnect calendar mutation
  const disconnectMutation = useMutation({
    mutationFn: async (provider: "google" | "microsoft") => {
      await authAPI.disconnectCalendar(provider);
    },
    onSuccess: (_, provider) => {
      toast.success(`${provider} calendar disconnected`);
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast.error("Failed to disconnect calendar", {
        description: errorMessage,
      });
    },
  });

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      await authAPI.updateUserPreferences({
        name: formData.name,
      });
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      refreshUser();
      setIsEditing(false);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast.error("Failed to update profile", {
        description: errorMessage,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const handleDisconnect = (provider: "google" | "microsoft") => {
    if (confirm(`Are you sure you want to disconnect your ${provider} calendar?`)) {
      disconnectMutation.mutate(provider);
    }
  };

  const handleConnectGoogle = () => {
    const url = authAPI.getGoogleAuthUrl();
    window.location.href = url;
  };

  const handleConnectMicrosoft = () => {
    const url = authAPI.getMicrosoftAuthUrl();
    window.location.href = url;
  };

  // Helper to check if calendar is connected
  const isGoogleConnected = user?.connectedCalendars?.some((cal) => cal.provider === "google");
  const isMicrosoftConnected = user?.connectedCalendars?.some(
    (cal) => cal.provider === "microsoft"
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account and calendar connections</p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Name */}
                <div className="flex items-center gap-4">
                  <UserCircleIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="name">Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{user?.name || "Not set"}</p>
                    )}
                  </div>
                </div>

                {/* Email (read-only) */}
                <div className="flex items-center gap-4">
                  <EnvelopeIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <Label>Email</Label>
                    <p className="text-foreground font-medium">{user?.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {isEditing ? (
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ name: user?.name || "", email: user?.email || "" });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end pt-4 border-t border-border">
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Calendar Connections Card */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar Connections</CardTitle>
            <CardDescription>Manage your connected calendars</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Calendar */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <CalendarDaysIcon className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">
                    {isGoogleConnected ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isGoogleConnected ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnect("google")}
                      disabled={disconnectMutation.isPending}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-5 w-5 text-muted-foreground" />
                    <Button size="sm" onClick={handleConnectGoogle}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Microsoft Calendar */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <CalendarDaysIcon className="h-6 w-6 text-accent" />
                <div>
                  <p className="font-medium text-foreground">Microsoft Calendar</p>
                  <p className="text-sm text-muted-foreground">
                    {isMicrosoftConnected ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isMicrosoftConnected ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnect("microsoft")}
                      disabled={disconnectMutation.isPending}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-5 w-5 text-muted-foreground" />
                    <Button size="sm" onClick={handleConnectMicrosoft}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Default Calendar</p>
                <p className="text-sm text-muted-foreground">
                  Choose which calendar to use by default for new events
                </p>
              </div>
              <select
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                defaultValue="google"
              >
                <option value="google">Google</option>
                <option value="microsoft">Microsoft</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="font-medium text-foreground">Time Format</p>
                <p className="text-sm text-muted-foreground">
                  Choose 12-hour or 24-hour time format
                </p>
              </div>
              <select
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                defaultValue="12"
              >
                <option value="12">12-hour</option>
                <option value="24">24-hour</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
