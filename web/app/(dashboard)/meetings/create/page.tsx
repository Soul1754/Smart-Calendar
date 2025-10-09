"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { calendarAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { toast } from "sonner";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function CreateMeetingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    summary: "",
    description: "",
    location: "",
    startDateTime: "",
    endDateTime: "",
    attendees: "",
    provider: "google" as "google" | "microsoft",
  });

  // Pre-fill times from URL params (from calendar slot selection)
  useEffect(() => {
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (start) {
      const startDate = new Date(start);
      setFormData((prev) => ({
        ...prev,
        startDateTime: formatDateTimeLocal(startDate),
      }));
    }

    if (end) {
      const endDate = new Date(end);
      setFormData((prev) => ({
        ...prev,
        endDateTime: formatDateTimeLocal(endDate),
      }));
    }
  }, [searchParams]);

  // Create meeting mutation
  const createMeetingMutation = useMutation({
    mutationFn: async () => {
      const attendeesList = formData.attendees
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);

      const eventData = {
        summary: formData.summary,
        description: formData.description,
        location: formData.location,
        start: {
          dateTime: new Date(formData.startDateTime).toISOString(),
        },
        end: {
          dateTime: new Date(formData.endDateTime).toISOString(),
        },
        attendees: attendeesList, // Just the email strings
      };

      if (formData.provider === "google") {
        return await calendarAPI.createGoogleEvent(eventData);
      } else {
        return await calendarAPI.createMicrosoftEvent(eventData);
      }
    },
    onSuccess: () => {
      toast.success("Meeting created successfully!");
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      router.push("/calendar");
    },
    onError: (error: any) => {
      toast.error("Failed to create meeting", {
        description: error.message || "Please try again",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.summary.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }

    if (!formData.startDateTime || !formData.endDateTime) {
      toast.error("Please select start and end times");
      return;
    }

    const start = new Date(formData.startDateTime);
    const end = new Date(formData.endDateTime);

    if (end <= start) {
      toast.error("End time must be after start time");
      return;
    }

    createMeetingMutation.mutate();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Meeting</h1>
            <p className="text-muted-foreground mt-1">Schedule a new meeting with your team</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Details</CardTitle>
            <CardDescription>Fill in the information below to create a new meeting</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Calendar Provider */}
              <div className="space-y-2">
                <Label htmlFor="provider">Calendar Provider</Label>
                <select
                  id="provider"
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="google">Google Calendar</option>
                  <option value="microsoft">Microsoft Calendar</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="summary">Title *</Label>
                <Input
                  id="summary"
                  name="summary"
                  type="text"
                  placeholder="Team sync, Client call, etc."
                  value={formData.summary}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDateTime">Start Time *</Label>
                  <Input
                    id="startDateTime"
                    name="startDateTime"
                    type="datetime-local"
                    value={formData.startDateTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDateTime">End Time *</Label>
                  <Input
                    id="endDateTime"
                    name="endDateTime"
                    type="datetime-local"
                    value={formData.endDateTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Attendees */}
              <div className="space-y-2">
                <Label htmlFor="attendees">Attendees</Label>
                <Input
                  id="attendees"
                  name="attendees"
                  type="text"
                  placeholder="email1@example.com, email2@example.com"
                  value={formData.attendees}
                  onChange={handleChange}
                />
                <p className="text-sm text-muted-foreground">
                  Enter email addresses separated by commas
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="Meeting room, Zoom link, etc."
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Meeting agenda, notes, etc."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMeetingMutation.isPending}>
                  {createMeetingMutation.isPending ? "Creating..." : "Create Meeting"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to format date for datetime-local input
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
