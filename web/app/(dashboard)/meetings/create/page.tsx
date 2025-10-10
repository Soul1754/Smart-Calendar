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
import { ArrowLeftIcon, XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

interface TimeSlot {
  startTime: string;
  endTime: string;
  score?: number;
}

export default function CreateMeetingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    summary: "",
    description: "",
    location: "",
    date: new Date(),
    duration: 30,
    provider: "google" as "google" | "microsoft",
  });

  // Attendee management
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);

  // AI slot finder
  const [suggestedSlots, setSuggestedSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Pre-fill times from URL params (for manual scheduling from calendar click)
  useEffect(() => {
    const start = searchParams.get("start");
    if (start) {
      const startDate = new Date(start);
      setFormData((prev) => ({
        ...prev,
        date: startDate,
      }));
    }
  }, [searchParams]);

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = new Date(e.target.value);
    setFormData((prev) => ({ ...prev, date: dateValue }));
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) }));
  };

  // Attendee management
  const handleAddAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    const email = attendeeEmail.trim().toLowerCase();

    if (!email) {
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (attendees.includes(email)) {
      toast.error("This attendee is already added");
      return;
    }

    setAttendees((prev) => [...prev, email]);
    setAttendeeEmail("");
  };

  const handleRemoveAttendee = (email: string) => {
    setAttendees((prev) => prev.filter((e) => e !== email));
  };

  // Find optimal time slots using AI
  const handleFindTimeSlots = async () => {
    if (!formData.summary.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }

    if (attendees.length === 0) {
      toast.error("Please add at least one attendee");
      return;
    }

    try {
      setIsLoadingSlots(true);
      setSuggestedSlots([]);

      const dateStr = format(formData.date, "yyyy-MM-dd");
      const payload = {
        date: dateStr,
        duration: formData.duration,
        attendees: attendees,
      };

      const response = await calendarAPI.findUnifiedAvailableSlots(payload);
      const slots: TimeSlot[] = (response.availableSlots || []).map((s: { startTime?: string; start?: string; endTime?: string; end?: string; score?: number }) => ({
        startTime: s.startTime || s.start || "",
        endTime: s.endTime || s.end || "",
        score: s.score || 0.5,
      }));

      setSuggestedSlots(slots);

      if (slots.length === 0) {
        toast.info("No suitable time slots found for that day. Try another date?");
      } else {
        toast.success(`Found ${slots.length} optimal time slots!`);
      }
    } catch (error) {
      console.error("Find time slots error:", error);
      const errorMessage = error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response &&
        error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
        ? String(error.response.data.message)
        : "Failed to fetch availability";
      toast.error(errorMessage);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Schedule meeting at specific time slot
  const scheduleMutation = useMutation({
    mutationFn: async (timeSlot: TimeSlot) => {
      const dateStr = format(formData.date, "yyyy-MM-dd");
      const startDateTime = new Date(`${dateStr} ${timeSlot.startTime}`);
      const endDateTime = new Date(`${dateStr} ${timeSlot.endTime}`);

      const eventData = {
        summary: formData.summary,
        description: formData.description,
        location: formData.location,
        start: {
          dateTime: startDateTime.toISOString(),
        },
        end: {
          dateTime: endDateTime.toISOString(),
        },
        attendees: attendees,
      };

      if (formData.provider === "google") {
        return await calendarAPI.createGoogleEvent(eventData);
      } else {
        return await calendarAPI.createMicrosoftEvent(eventData);
      }
    },
    onSuccess: () => {
      toast.success(`Meeting "${formData.summary}" scheduled successfully!`);
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });

      // Reset form
      setFormData({
        summary: "",
        description: "",
        location: "",
        date: new Date(),
        duration: 30,
        provider: "google",
      });
      setAttendees([]);
      setSuggestedSlots([]);

      // Redirect to calendar
      setTimeout(() => router.push("/calendar"), 1000);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Please try again";
      toast.error("Failed to schedule meeting", {
        description: errorMessage,
      });
    },
  });

  const handleScheduleSlot = (slot: TimeSlot) => {
    scheduleMutation.mutate(slot);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Meeting</h1>
            <p className="text-muted-foreground mt-1">
              Use AI to find the perfect time for your meeting
            </p>
          </div>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Meeting Details */}
          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
              <CardDescription>Basic information about the meeting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="summary">Meeting Title *</Label>
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

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={format(formData.date, "yyyy-MM-dd")}
                  onChange={handleDateChange}
                  required
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration *</Label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleDurationChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
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
                  rows={3}
                  placeholder="Meeting agenda, notes, etc."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Attendees */}
          <Card>
            <CardHeader>
              <CardTitle>Attendees</CardTitle>
              <CardDescription>Add people to invite to this meeting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Attendee Form */}
              <form onSubmit={handleAddAttendee} className="flex gap-2">
                <Input
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1"
                />
                <Button type="submit">Add</Button>
              </form>

              {/* Attendee List */}
              <div className="border border-border rounded-md p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                {attendees.length > 0 ? (
                  <ul className="space-y-2">
                    {attendees.map((email, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center bg-muted/50 p-3 rounded-md group hover:bg-muted transition-colors"
                      >
                        <span className="text-sm">{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttendee(email)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                          aria-label="Remove attendee"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <p className="text-muted-foreground text-sm">No attendees added yet</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Add at least one attendee to find optimal times
                    </p>
                  </div>
                )}
              </div>

              {/* Find Time Slots Button */}
              <Button
                type="button"
                onClick={handleFindTimeSlots}
                disabled={!formData.summary || attendees.length === 0 || isLoadingSlots}
                className="w-full"
                size="lg"
              >
                {isLoadingSlots ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Finding optimal times...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Find Optimal Meeting Times
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Suggested Time Slots */}
        {suggestedSlots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="h-6 w-6 text-primary" />
                AI-Suggested Time Slots
              </CardTitle>
              <CardDescription>
                Analyzed calendars and found these optimal time slots for{" "}
                {format(formData.date, "MMMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all duration-200 bg-card"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-lg font-semibold">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {Math.round((slot.score || 0.5) * 100)}% match
                      </span>
                    </div>
                    <Button
                      onClick={() => handleScheduleSlot(slot)}
                      disabled={scheduleMutation.isPending}
                      className="w-full"
                    >
                      {scheduleMutation.isPending ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        "Schedule"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
