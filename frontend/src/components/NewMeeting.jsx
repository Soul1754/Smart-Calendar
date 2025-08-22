import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { calendarService } from "../services/api";
import { toast } from "react-toastify";

const NewMeeting = () => {
  const [meetingData, setMeetingData] = useState({
    title: "",
    description: "",
    date: new Date(),
    startTime: "",
    endTime: "",
    duration: 30,
    attendees: [],
  });
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [suggestedTimeSlots, setSuggestedTimeSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMeetingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date) => {
    setMeetingData((prev) => ({
      ...prev,
      date,
    }));
  };

  const handleAddAttendee = (e) => {
    e.preventDefault();
    if (attendeeEmail && !meetingData.attendees.includes(attendeeEmail)) {
      setMeetingData((prev) => ({
        ...prev,
        attendees: [...prev.attendees, attendeeEmail],
      }));
      setAttendeeEmail("");
    }
  };

  const handleRemoveAttendee = (email) => {
    setMeetingData((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((attendee) => attendee !== email),
    }));
  };

  const handleFindTimeSlots = async () => {
    try {
      setIsLoading(true);
      setSuggestedTimeSlots([]);
      const dateStr = format(meetingData.date, "yyyy-MM-dd");
      const payload = {
        date: dateStr,
        duration: meetingData.duration,
        attendees: meetingData.attendees,
        // optionally could send businessHours or incrementMinutes
      };
      const resp = await calendarService.findUnifiedAvailableSlots(payload);
      const slots = (resp.availableSlots || []).map(s => ({
        startTime: s.startTime || s.startTimeISO, // backend returns formatted startTime
        endTime: s.endTime || s.endTimeISO,
        score: s.score
      }));
      setSuggestedTimeSlots(slots);
      if (slots.length === 0) {
        toast.info("No suitable time slots found for that day.");
      }
    } catch (e) {
      console.error("Find time slots error", e);
      toast.error(e.response?.data?.message || "Failed to fetch availability");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleMeeting = async (timeSlot) => {
    try {
      setIsLoading(true);

      // Convert timeSlot string to ISO format
      const dateStr = format(meetingData.date, "yyyy-MM-dd");
      const startDateTime = new Date(`${dateStr} ${timeSlot.startTime}`);
      const endDateTime = new Date(`${dateStr} ${timeSlot.endTime}`);

      // Prepare event data for Google Calendar
      const eventData = {
        summary: meetingData.title,
        description: meetingData.description,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        attendees: meetingData.attendees,
      };

      // Call the API to create the event
      const response = await calendarService.createGoogleEvent(eventData);

      // Show success message
      toast.success(`Meeting "${meetingData.title}" scheduled successfully!`);

      // Reset form or redirect as needed
      setSuggestedTimeSlots([]);
      setMeetingData({
        title: "",
        description: "",
        date: new Date(),
        startTime: "",
        endTime: "",
        duration: 30,
        attendees: [],
      });
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      toast.error("Failed to schedule meeting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Schedule New Meeting
      </h2>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Meeting Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={meetingData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Meeting title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={meetingData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Meeting description"
                  rows="3"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <DatePicker
                  selected={meetingData.date}
                  onChange={handleDateChange}
                  dateFormat="MMMM d, yyyy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  name="duration"
                  value={meetingData.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Attendees
            </h3>

            <div className="space-y-4">
              <form onSubmit={handleAddAttendee} className="flex space-x-2">
                <input
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add attendee email"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
                >
                  Add
                </button>
              </form>

              <div className="border rounded-md p-4 min-h-[200px]">
                {meetingData.attendees.length > 0 ? (
                  <ul className="space-y-2">
                    {meetingData.attendees.map((email, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center bg-gray-50 p-2 rounded"
                      >
                        <span>{email}</span>
                        <button
                          onClick={() => handleRemoveAttendee(email)}
                          className="text-red-600 hover:text-red-800 transition duration-200"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No attendees added yet
                  </div>
                )}
              </div>

              <button
                onClick={handleFindTimeSlots}
                disabled={
                  !meetingData.title ||
                  meetingData.attendees.length === 0 ||
                  isLoading
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Finding optimal times..."
                  : "Find Optimal Meeting Times"}
              </button>
            </div>
          </div>
        </div>

        {suggestedTimeSlots.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              AI-Suggested Time Slots
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Unified availability service analyzed calendars and found these
              suggested time slots for your meeting on{" "}
              {format(meetingData.date, "MMMM d, yyyy")}:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suggestedTimeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="border rounded-md p-4 hover:shadow-md hover:border-blue-500 transition duration-200"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {Math.round(slot.score * 100)}% match
                    </span>
                  </div>
                  <button
                    onClick={() => handleScheduleMeeting(slot)}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed flex justify-center items-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewMeeting;
