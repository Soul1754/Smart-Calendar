import React, { useState, useEffect, useContext, useRef } from "react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { calendarService } from "../services/api";
import { AuthContext } from "../App";

const WeeklyCalendar = () => {
  const [currentWeek, setCurrentWeek] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  ); // Sunday
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const profileMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    return {
      time:
        hour === 0
          ? "12 AM"
          : hour < 12
          ? `${hour} AM`
          : hour === 12
          ? "12 PM"
          : `${hour - 12} PM`,
      hour: hour,
    };
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  useEffect(() => {
    fetchEvents();
  }, [currentWeek]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const start = startOfDay(currentWeek);
      const end = endOfDay(addDays(currentWeek, 6));

      const response = await calendarService.getEvents(
        start.toISOString(),
        end.toISOString()
      );

      setEvents(response.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDayAndHour = (day, hour) => {
    return events.filter((event) => {
      const eventStart = parseISO(event.start);
      const eventHour = eventStart.getHours();
      return isSameDay(eventStart, day) && eventHour === hour;
    });
  };

  const calculateEventHeight = (event) => {
    const start = parseISO(event.start);
    const end = parseISO(event.end);
    const durationMinutes = (end - start) / (1000 * 60);
    // Each hour is 80px, so calculate proportional height
    return (durationMinutes / 60) * 80;
  };

  const calculateEventTop = (event) => {
    const start = parseISO(event.start);
    const minutes = start.getMinutes();
    // Calculate offset within the hour slot
    return (minutes / 60) * 80;
  };

  const handlePrevWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleToday = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const isToday = (day) => {
    return isSameDay(day, new Date());
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleProfileClick = () => {
    setShowProfileMenu(false);
    navigate("/dashboard/profile");
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0e27] text-white overflow-hidden">
      {/* Header */}
      <div className="flex-none bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Calendar
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {format(currentWeek, "MMMM yyyy")}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-900/50 rounded-xl p-1">
              <button
                onClick={handlePrevWeek}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-300" />
              </button>
              <button
                onClick={handleToday}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNextWeek}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            <button
              onClick={() => navigate("/dashboard/meetings/new")}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300"
            >
              <PlusIcon className="w-5 h-5" />
              New Meeting
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(!showProfileMenu);
                }}
                className="flex items-center gap-2 p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-200"
              >
                <UserCircleIcon className="w-8 h-8 text-gray-300" />
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm text-gray-400">Signed in as</p>
                    <p className="text-sm font-medium text-white truncate">
                      {user?.email || "User"}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileClick();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors"
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      Profile
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[80px_repeat(7,1fr)] min-w-[900px]">
          {/* Header Row - Day Names */}
          <div className="sticky top-0 z-20 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50"></div>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`sticky top-0 z-20 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 p-4 text-center ${
                index < 6 ? "border-r border-gray-700/30" : ""
              }`}
            >
              <div className="text-sm text-gray-400 font-medium">
                {format(day, "EEE")}
              </div>
              <div
                className={`text-2xl font-bold mt-1 ${
                  isToday(day)
                    ? "w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
                    : "text-gray-200"
                }`}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}

          {/* Time Slots and Events */}
          {timeSlots.map((slot, slotIndex) => (
            <React.Fragment key={slotIndex}>
              {/* Time Label */}
              <div className="border-b border-gray-700/30 p-2 text-right pr-4 bg-gray-900/30">
                <span className="text-xs text-gray-500 font-medium">
                  {slot.time}
                </span>
              </div>

              {/* Day Columns */}
              {weekDays.map((day, dayIndex) => {
                const dayEvents = getEventsForDayAndHour(day, slot.hour);

                return (
                  <div
                    key={dayIndex}
                    className={`relative border-b border-gray-700/30 h-20 ${
                      dayIndex < 6 ? "border-r border-gray-700/30" : ""
                    } ${
                      isToday(day) ? "bg-indigo-900/5" : "hover:bg-gray-800/20"
                    } transition-colors cursor-pointer`}
                    onClick={() => navigate("/dashboard/meetings/new")}
                  >
                    {dayEvents.map((event, eventIndex) => {
                      const height = calculateEventHeight(event);
                      const top = calculateEventTop(event);

                      return (
                        <div
                          key={eventIndex}
                          className="absolute left-1 right-1 rounded-lg p-2 overflow-hidden cursor-pointer group"
                          style={{
                            top: `${top}px`,
                            height: `${Math.min(height, 160)}px`, // Cap at 2 hours visible
                            backgroundColor: event.color || "#6366f1",
                            zIndex: 10,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle event click - could open detail modal
                          }}
                        >
                          <div className="text-xs font-semibold text-white truncate">
                            {event.title}
                          </div>
                          <div className="text-xs text-white/80 truncate">
                            {format(parseISO(event.start), "h:mm a")}
                          </div>
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="text-xs text-white/70 truncate mt-1">
                              {event.attendees.length} attendees
                            </div>
                          )}
                          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-lg"></div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Current Time Indicator */}
        {isSameDay(currentWeek, new Date()) && (
          <div
            className="absolute left-20 right-0 h-0.5 bg-red-500 z-30 pointer-events-none"
            style={{
              top: `${
                64 +
                new Date().getHours() * 80 +
                (new Date().getMinutes() / 60) * 80
              }px`,
            }}
          >
            <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#0a0e27]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-gray-400">Loading events...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyCalendar;
