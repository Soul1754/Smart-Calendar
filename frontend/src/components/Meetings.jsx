import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

const Meetings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // Mock data for meetings
  const [meetings, setMeetings] = useState([
    {
      id: 1,
      title: "Team Standup",
      date: new Date(),
      startTime: "10:00 AM",
      endTime: "10:30 AM",
      attendees: ["john@example.com", "sarah@example.com"],
      status: "upcoming",
    },
    {
      id: 2,
      title: "Project Review",
      date: new Date(Date.now() + 86400000), // Tomorrow
      startTime: "2:00 PM",
      endTime: "3:00 PM",
      attendees: ["mike@example.com", "lisa@example.com"],
      status: "upcoming",
    },
    {
      id: 3,
      title: "Client Meeting",
      date: new Date(Date.now() - 86400000), // Yesterday
      startTime: "11:00 AM",
      endTime: "12:00 PM",
      attendees: ["client@example.com", "john@example.com"],
      status: "completed",
    },
  ]);

  // Filter meetings based on search term and filter
  const filteredMeetings = meetings.filter((meeting) => {
    const matchesSearch = meeting.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || meeting.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Meetings</h2>
        <Link
          to="/meetings/new"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Meeting</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search meetings..."
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md transition duration-200 ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-4 py-2 rounded-md transition duration-200 ${
                filter === "upcoming"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-md transition duration-200 ${
                filter === "completed"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {filteredMeetings.length > 0 ? (
          <div className="space-y-4">
            {filteredMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="border rounded-lg p-4 hover:shadow-md transition duration-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg text-gray-800">
                      {meeting.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-gray-600 mt-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        {format(meeting.date, "MMMM d, yyyy")} •{" "}
                        {meeting.startTime} - {meeting.endTime}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        meeting.status === "upcoming"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {meeting.status === "upcoming" ? "Upcoming" : "Completed"}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-sm text-gray-600">
                    {meeting.attendees.length} attendees
                  </span>
                  <div className="flex mt-2 space-x-1">
                    {meeting.attendees.slice(0, 3).map((attendee, index) => (
                      <div
                        key={index}
                        className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {attendee}
                      </div>
                    ))}
                    {meeting.attendees.length > 3 && (
                      <div className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                        +{meeting.attendees.length - 3} more
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <Link
                    to={`/meetings/${meeting.id}`}
                    className="text-blue-600 hover:text-blue-800 transition duration-200"
                  >
                    View Details
                  </Link>
                  {meeting.status === "upcoming" && (
                    <button className="text-red-600 hover:text-red-800 transition duration-200">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <CalendarIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No meetings found
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "Try a different search term or filter"
                : "Schedule your first meeting to get started"}
            </p>
            {!searchTerm && (
              <Link
                to="/meetings/new"
                className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition duration-200"
              >
                Schedule Meeting
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Meetings;
