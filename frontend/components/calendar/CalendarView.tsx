"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { SlotInfo, EventPropGetter } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Dynamically import react-big-calendar to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Calendar = dynamic<any>(() => import("react-big-calendar").then((mod) => mod.Calendar), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  ),
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  view: "week" | "day";
  date: Date;
  onNavigate: (date: Date) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export function CalendarView({
  events,
  view,
  date,
  onNavigate,
  onSelectSlot,
  onSelectEvent,
}: CalendarViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localizer, setLocalizer] = useState<any>(null);

  // Initialize localizer on client side
  useEffect(() => {
    import("react-big-calendar").then((mod) => {
      const dateFnsLocalizer = mod.dateFnsLocalizer;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const format = require("date-fns").format;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const parse = require("date-fns").parse;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const startOfWeek = require("date-fns").startOfWeek;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const getDay = require("date-fns").getDay;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const enUS = require("date-fns/locale/en-US").enUS;

      const locales = {
        "en-US": enUS,
      };

      const localizer = dateFnsLocalizer({
        format,
        parse,
        startOfWeek,
        getDay,
        locales,
      });

      setLocalizer(localizer);
    });
  }, []);

  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      onSelectSlot({
        start: slotInfo.start as Date,
        end: slotInfo.end as Date,
      });
    },
    [onSelectSlot]
  );

  // Custom event component to show title first, then time
  const CustomEvent = useCallback(({ event }: { event: CalendarEvent }) => {
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    const startTime = formatTime(event.start);
    const endTime = formatTime(event.end);

    return (
      <div className="event-wrapper flex flex-col h-full px-1 py-0.5 overflow-hidden">
        <div className="event-title font-semibold text-sm truncate leading-tight">
          {event.title}
        </div>
        <div className="event-time text-xs opacity-90 truncate leading-tight">
          {startTime} - {endTime}
        </div>
      </div>
    );
  }, []);

  // Custom event style getter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventStyleGetter: EventPropGetter<any> = useCallback(() => {
    const style = {
      backgroundColor: "rgb(var(--color-primary))",
      borderRadius: "4px",
      opacity: 0.9,
      color: "white",
      border: "0px",
      display: "block",
      fontSize: "0.875rem",
      padding: "0px",
    };
    return { style };
  }, []);

  // Time slot configuration for 12am-12am grid
  const min = useMemo(() => new Date(1970, 1, 1, 0, 0, 0), []); // 12:00 AM
  const max = useMemo(() => new Date(1970, 1, 1, 23, 59, 59), []); // 11:59 PM

  if (!localizer) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        views={["day", "week"]} // Explicitly set available views
        date={date}
        onNavigate={onNavigate}
        onView={() => {}} // View changes handled by parent
        onSelectSlot={handleSelectSlot}
        onSelectEvent={onSelectEvent}
        selectable
        popup
        min={min}
        max={max}
        step={30} // 30-minute intervals
        timeslots={2} // 2 timeslots per step (15-minute subdivisions)
        eventPropGetter={eventStyleGetter}
        scrollToTime={new Date(1970, 1, 1, 6, 0, 0)} // Scroll to 6 AM by default
        components={{
          event: CustomEvent, // Use custom event component
        }}
        formats={{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          timeGutterFormat: (date: Date, culture?: string, localizer?: any) =>
            localizer.format(date, "h a", culture), // 12 AM, 1 AM, etc.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dayFormat: (date: Date, culture?: string, localizer?: any) =>
            localizer.format(date, "EEE d", culture), // Sun 5, Mon 6, etc.
        }}
        style={{ height: "100%" }}
      />
    </div>
  );
}
