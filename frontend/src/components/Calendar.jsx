import React, { useState, useEffect, useContext } from "react";
import DatePicker from "react-datepicker";
import { format, startOfDay, endOfDay, parseISO, addDays, subDays, addWeeks, subWeeks, isWithinInterval } from "date-fns";
import { useTheme } from "../contexts/ThemeContext";
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
  const { isDarkMode } = useTheme();

  // Calculate week range
  // Calculate week range
  const weekStart = startOfDay(selectedDate);
  const weekEnd = endOfDay(addDays(selectedDate, 6));
  
  // Create array of dates for the week
  const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Function to fetch Google Calendar events
  const fetchGoogleEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get events for the entire week
      const weekStart = startOfDay(selectedDate);
      const weekEnd = endOfDay(addDays(selectedDate, 6));
      const googleEvents = await googleCalendarService.getEventsByDateRange(
        weekStart,
        weekEnd
      );

      setEvents(googleEvents); // Store raw events for easier filtering in the grid
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

  // Helper function to check if a date has any events
  const hasEventsForDate = (date) => {
    return events.some(event => 
      isWithinInterval(parseISO(event.start.dateTime), {
        start: startOfDay(date),
        end: endOfDay(date)
      })
    );
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
          <Link to={"/meetings/new"} >
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200">
            <PlusIcon className="h-5 w-5" />
            <span>New Meeting</span>
          </button>
          </Link>
        </div>
      </div>

      <div className={`rounded-lg shadow-md p-6 mb-6 ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setSelectedDate(subWeeks(selectedDate, 1))}
            className={`p-2 rounded-full transition duration-200 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronLeftIcon className={`h-5 w-5 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`} />
          </button>

          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="MMMM d, yyyy"
            className={`text-xl font-medium text-center cursor-pointer ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}
            customInput={<div>{format(selectedDate, "MMMM yyyy")}</div>}
          />

          <button
            onClick={() => setSelectedDate(addWeeks(selectedDate, 1))}
            className={`p-2 rounded-full transition duration-200 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronRightIcon className={`h-5 w-5 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`} />
          </button>
        </div>

        {/* Week view grid */}
        <div className="grid grid-cols-7 gap-4">
          {/* Day headers */}
          {weekDates.map((date) => (
            <div key={date.toString()} className="text-center">
              <div className={`text-sm mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {format(date, 'EEE')}
              </div>
              <div className="relative">
                <div className={`text-lg font-medium ${
                  format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    ? 'text-blue-500'
                    : isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {format(date, 'd')}
                </div>
                {hasEventsForDate(date) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Events grid */}
          {weekDates.map((date) => (
            <div key={date.toString()} className={`min-h-[200px] border rounded-lg p-2
              ${isDarkMode 
                ? 'border-gray-700 hover:bg-gray-700/50' 
                : 'border-gray-200 hover:bg-gray-50'}`}
            >
              {events
                .filter(event => isWithinInterval(parseISO(event.start.dateTime), {
                  start: startOfDay(date),
                  end: endOfDay(date)
                }))
                .map(event => (
                  <div
                    key={event.id}
                    className={`mb-2 p-2 rounded-lg text-sm ${
                      isDarkMode
                        ? 'bg-blue-900/50 hover:bg-blue-900/70'
                        : 'bg-blue-50 hover:bg-blue-100'
                    } cursor-pointer transition-colors duration-200`}
                  >
                    <div className={`font-medium ${
                      isDarkMode ? 'text-blue-200' : 'text-blue-800'
                    }`}>
                      {event.summary}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {format(parseISO(event.start.dateTime), 'h:mm a')}
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>

        {/* Loading and error states */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              <p className={`mt-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                Loading events...
              </p>
            </div>
          </div>
        )}

        {error && (
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
        )}

        {!user?.hasGoogleCalendar && (
          <div className="text-center py-8">
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>
              Google Calendar is not connected.
            </p>
            <a
              href="http://localhost:5001/auth/google"
              className="block mt-2 text-blue-600 hover:text-blue-800"
            >
              Connect Google Calendar
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
