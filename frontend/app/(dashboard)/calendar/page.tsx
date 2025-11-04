"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { calendarAPI } from "@/lib/api";
import { CalendarView } from "@/components/calendar/CalendarView";
import { EventDetailsModal } from "@/components/calendar/EventDetailsModal";
import { Button } from "@/components/ui/Button";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { FloatingChatbot } from "@/components/chat";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
}

/**
 * Display the user's calendar with navigation controls, day/week view toggles, slot-based meeting creation, event selection, and an event details modal.
 *
 * @returns The CalendarPage React element containing the toolbar, calendar grid, event details modal, and floating chatbot.
 */
export default function CalendarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [view, setView] = useState<"week" | "day">("week");
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch calendar events
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      try {
        return await calendarAPI.getAllEvents();
      } catch (error) {
        toast.error("Failed to load calendar events");
        throw error;
      }
    },
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Refetch every minute
  });

  // Convert API events to calendar format
  const events = useMemo(() => {
    if (!data?.events) {
      return [];
    }

    return data.events.map((event) => ({
      id: event.id,
      title: event.summary,
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
      description: event.description,
      location: event.location,
      attendees: event.attendees,
    }));
  }, [data]);

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      // Navigate to create meeting page with pre-filled time
      const params = new URLSearchParams({
        start: slotInfo.start.toISOString(),
        end: slotInfo.end.toISOString(),
      });
      router.push(`/meetings/create?${params.toString()}`);
    },
    [router]
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    // Open modal with event details
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, []);

  // Navigation handlers
  const handlePrevious = () => {
    const newDate = new Date(date);
    if (view === "week") {
      newDate.setDate(date.getDate() - 7);
    } else {
      newDate.setDate(date.getDate() - 1);
    }
    setDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(date);
    if (view === "week") {
      newDate.setDate(date.getDate() + 7);
    } else {
      newDate.setDate(date.getDate() + 1);
    }
    setDate(newDate);
  };

  const handleToday = () => {
    setDate(new Date());
  };

  // Format current date display
  const getDateDisplay = () => {
    const options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  // Check if calendars are connected
  const hasGoogleCalendar = user?.connectedCalendars?.some((cal) => cal.provider === "google");
  const hasMicrosoftCalendar = user?.connectedCalendars?.some(
    (cal) => cal.provider === "microsoft"
  );
  const hasAnyCalendar = hasGoogleCalendar || hasMicrosoftCalendar;

  if (error) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
          <Button onClick={() => router.push("/meetings/create")}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Create
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-red-600 text-lg">Failed to load calendar events</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar - Fixed at top (like Google Calendar) */}
      <div className="flex-shrink-0 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side: Navigation */}
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push("/meetings/create")} size="sm">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create
            </Button>

            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>

            <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh calendar">
              <ArrowPathIcon className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handlePrevious}>
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNext}>
                <ChevronRightIcon className="h-5 w-5" />
              </Button>
            </div>

            <h2 className="text-xl font-semibold text-foreground">{getDateDisplay()}</h2>
          </div>

          {/* Right side: View toggle */}
          <div className="flex gap-2">
            <Button
              variant={view === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("day")}
            >
              Day
            </Button>
            <Button
              variant={view === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("week")}
            >
              Week
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid - Takes remaining space */}
      <div className="flex-1 overflow-hidden bg-background">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        ) : !hasAnyCalendar ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md px-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Calendar Connected
                </h3>
                <p className="text-muted-foreground mb-6">
                  Connect your Google or Microsoft calendar to view and manage your events
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/profile">
                  <Button>Connect Calendar</Button>
                </Link>
                <Button variant="outline" onClick={() => router.push("/meetings/create")}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Meeting
                </Button>
              </div>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 relative">
              <CalendarView
                events={events}
                view={view}
                date={date}
                onNavigate={setDate}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-4 bg-background/95 backdrop-blur-sm p-8 rounded-lg shadow-lg pointer-events-auto">
                  <p className="text-lg font-medium text-foreground">No events this week</p>
                  <p className="text-sm text-muted-foreground">
                    Click any time slot to create a new meeting
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <CalendarView
            events={events}
            view={view}
            date={date}
            onNavigate={setDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {/* Event Details Modal */}
        <EventDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} event={selectedEvent} />
      </div>
      <FloatingChatbot />
    </div>
  );
}