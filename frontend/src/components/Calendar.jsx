import React, { useState, useEffect, useContext } from "react";
import DatePicker from "react-datepicker";
import { format, startOfDay, endOfDay, parseISO, addDays } from "date-fns";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import "react-datepicker/dist/react-datepicker.css";
import googleCalendarService from "../services/googleCalendar";
import { AuthContext } from "../App";
import { Link } from "react-router-dom";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  // Function to fetch Google Calendar events
  const fetchGoogleEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get events for the selected date (from start of day to end of day)
      const startDate = startOfDay(selectedDate);
      const endDate = endOfDay(selectedDate);
      const googleEvents = await googleCalendarService.getEventsByDateRange(
        startDate,
        endDate
      );

      // Transform Google Calendar events to our format
      const formattedEvents = googleEvents.map((event) => ({
        id: event.id,
        title: event.summary,
        date: event.start.dateTime
          ? parseISO(event.start.dateTime)
          : selectedDate,
        startTime: event.start.dateTime
          ? format(parseISO(event.start.dateTime), "h:mm a")
          : "All day",
        endTime: event.end.dateTime
          ? format(parseISO(event.end.dateTime), "h:mm a")
          : "",
        attendees: event.attendees
          ? event.attendees.map((attendee) => attendee.email)
          : [],
        description: event.description || "",
        location: event.location || "",
        htmlLink: event.htmlLink || "",
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      // Check if it's an authentication error (401)
      if (error.response && error.response.status === 401) {
        setError(
          "Your Google Calendar connection has expired. Please reconnect your account."
        );
      } else {
        setError("Failed to load calendar events. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch events when selected date changes
  useEffect(() => {
    if (user?.hasGoogleCalendar) {
      fetchGoogleEvents();
    }
  }, [selectedDate, user]);

  // Get events for the selected date
  const dailyEvents = events;

  const handlePrevDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Calendar</h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchGoogleEvents}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200"
            disabled={isLoading}
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200">
            <PlusIcon className="h-5 w-5" />
            <span>New Meeting</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-full hover:bg-gray-100 transition duration-200"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>

          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="MMMM d, yyyy"
            className="text-xl font-medium text-center text-gray-800 cursor-pointer"
            customInput={<div>{format(selectedDate, "MMMM d, yyyy")}</div>}
          />

          <button
            onClick={handleNextDay}
            className="p-2 rounded-full hover:bg-gray-100 transition duration-200"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="border-t pt-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading events...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
              {error.includes("expired") ? (
                <a
                  href="http://localhost:5001/auth/google"
                  className="block mx-auto mt-2 text-blue-600 hover:text-blue-800"
                >
                  Reconnect Google Calendar
                </a>
              ) : (
                <button
                  onClick={fetchGoogleEvents}
                  className="block mx-auto mt-2 text-blue-600 hover:text-blue-800"
                >
                  Try again
                </button>
              )}
            </div>
          ) : !user?.hasGoogleCalendar ? (
            <div className="text-center py-8 text-gray-500">
              <p>Google Calendar is not connected.</p>
              <a
                href="http://localhost:5001/auth/google"
                className="block mt-2 text-blue-600 hover:text-blue-800"
              >
                Connect Google Calendar
              </a>
            </div>
          ) : dailyEvents.length > 0 ? (
            <div className="space-y-4">
              {dailyEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600"
                >
                  <h3 className="font-medium text-gray-800">{event.title}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    {event.startTime} - {event.endTime}
                  </div>
                  {event.location && (
                    <div className="text-sm text-gray-600 mt-1">
                      Location: {event.location}
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    {event.attendees.length} attendees
                  </div>
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                    >
                      View in Google Calendar
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No events scheduled for this day
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
