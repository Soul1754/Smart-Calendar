"use client";

import { useEffect } from "react";
import {
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

interface Attendee {
  email: string;
  displayName?: string;
  responseStatus?: string;
}

interface EventDetails {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  attendees?: Attendee[];
}

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventDetails | null;
}

export function EventDetailsModal({ isOpen, onClose, event }: EventDetailsModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const formatTime = (date: Date) => {
    return format(date, "h:mm a");
  };

  const formatDate = (date: Date) => {
    return format(date, "EEEE, MMMM d, yyyy");
  };

  const getDuration = () => {
    const diffMs = event.end.getTime() - event.start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const getResponseStatusBadge = (status?: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "accepted") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Accepted
        </span>
      );
    } else if (statusLower === "tentative") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          Tentative
        </span>
      );
    } else if (statusLower === "declined") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Declined
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
          Pending
        </span>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/25" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 pr-4">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{event.title}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {formatDate(event.start)}
            </p>
          </div>
      
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto bg-white dark:bg-gray-800">
          <div className="flex items-start gap-3">
            <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatTime(event.start)} - {formatTime(event.end)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Duration: {getDuration()}
              </div>
            </div>
          </div>

          {event.location && (
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Location
                </div>
                <div className="text-sm text-gray-900 dark:text-white">{event.location}</div>
              </div>
            </div>
          )}

          {event.description && (
            <div className="flex items-start gap-3">
              <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Description
                </div>
                <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-3">
              <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Attendees ({event.attendees.length})
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {event.attendees.map((attendee, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {(attendee.displayName || attendee.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          {attendee.displayName && (
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {attendee.displayName}
                            </div>
                          )}
                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {attendee.email}
                          </div>
                        </div>
                      </div>
                      {attendee.responseStatus && (
                        <div className="ml-2">
                          {getResponseStatusBadge(attendee.responseStatus)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
