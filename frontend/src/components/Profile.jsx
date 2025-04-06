import React, { useState, useContext, useEffect } from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { AuthContext } from "../App";
import { authService } from "../services/api";

const Profile = () => {
  const { user: authUser } = useContext(AuthContext);
  const [user, setUser] = useState({
    name: authUser?.name || "",
    email: authUser?.email || "",
    connectedCalendars: [
      {
        id: 1,
        type: "google",
        email: authUser?.email || "",
        connected: authUser?.hasGoogleCalendar || false,
      },
      {
        id: 2,
        type: "microsoft",
        email: authUser?.email || "",
        connected: authUser?.hasMicrosoftCalendar || false,
      },
    ],
    preferences: {
      workingHours: {
        start: "09:00",
        end: "17:00",
      },
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      bufferTime: 15, // minutes between meetings
    },
  });

  // Update user state when authUser changes
  useEffect(() => {
    if (authUser) {
      setUser((prev) => ({
        ...prev,
        name: authUser.name || prev.name,
        email: authUser.email || prev.email,
        connectedCalendars: [
          {
            id: 1,
            type: "google",
            email: authUser.email || prev.email,
            connected: authUser.hasGoogleCalendar || false,
          },
          {
            id: 2,
            type: "microsoft",
            email: authUser.email || prev.email,
            connected: authUser.hasMicrosoftCalendar || false,
          },
        ],
      }));
    }
  }, [authUser]);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    workingHoursStart: user.preferences.workingHours.start,
    workingHoursEnd: user.preferences.workingHours.end,
    bufferTime: user.preferences.bufferTime,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      // Prepare the updated preferences data
      const updatedPreferences = {
        name: formData.name,
        preferences: {
          workingHours: {
            start: formData.workingHoursStart,
            end: formData.workingHoursEnd,
          },
          workingDays: user.preferences.workingDays, // Keep existing working days
          bufferTime: parseInt(formData.bufferTime),
        },
      };

      // Send updated preferences to the backend
      await authService.updateUserPreferences(updatedPreferences);

      // Update local state
      setUser((prev) => ({
        ...prev,
        name: formData.name,
        preferences: {
          ...prev.preferences,
          workingHours: {
            start: formData.workingHoursStart,
            end: formData.workingHoursEnd,
          },
          bufferTime: parseInt(formData.bufferTime),
        },
      }));

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating preferences:", error);
      // You could add error handling here, such as displaying an error message
    }
  };

  const handleConnectCalendar = (type) => {
    // Redirect to backend OAuth route using the API service
    if (type.toLowerCase() === "google") {
      window.location.href = authService.getGoogleAuthUrl();
    } else if (type.toLowerCase() === "microsoft") {
      window.location.href = authService.getMicrosoftAuthUrl();
    }
  };

  const handleDisconnectCalendar = async (id) => {
    try {
      // In a real implementation, you would call an API to disconnect the calendar
      // await authService.disconnectCalendar(id);

      // For now, just update the UI
      setUser((prev) => ({
        ...prev,
        connectedCalendars: prev.connectedCalendars.map((cal) =>
          cal.id === id ? { ...cal, connected: false } : cal
        ),
      }));
    } catch (error) {
      console.error("Error disconnecting calendar:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h2>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-medium text-gray-800">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {isEditing ? (
          <div className="border-t pt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Working Hours Start
                  </label>
                  <input
                    type="time"
                    name="workingHoursStart"
                    value={formData.workingHoursStart}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Working Hours End
                  </label>
                  <input
                    type="time"
                    name="workingHoursEnd"
                    value={formData.workingHoursEnd}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buffer Time Between Meetings (minutes)
                </label>
                <select
                  name="bufferTime"
                  value={formData.bufferTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="0">No buffer</option>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>

              <button
                onClick={handleSaveChanges}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition duration-200"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t pt-6">
            <h4 className="text-lg font-medium text-gray-800 mb-4">
              Calendar Preferences
            </h4>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-700">Working Hours:</span>
                <span className="font-medium">
                  {user.preferences.workingHours.start} -{" "}
                  {user.preferences.workingHours.end}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-700">Working Days:</span>
                <span className="font-medium">
                  {user.preferences.workingDays.includes(1) && "Mon, "}
                  {user.preferences.workingDays.includes(2) && "Tue, "}
                  {user.preferences.workingDays.includes(3) && "Wed, "}
                  {user.preferences.workingDays.includes(4) && "Thu, "}
                  {user.preferences.workingDays.includes(5) && "Fri, "}
                  {user.preferences.workingDays.includes(6) && "Sat, "}
                  {user.preferences.workingDays.includes(0) && "Sun"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-700">
                  Buffer Time Between Meetings:
                </span>
                <span className="font-medium">
                  {user.preferences.bufferTime} minutes
                </span>
              </div>
            </div>

            <h4 className="text-lg font-medium text-gray-800 mb-4">
              Connected Calendars
            </h4>

            <div className="space-y-4">
              {user.connectedCalendars.map((calendar) => (
                <div
                  key={calendar.id}
                  className="flex justify-between items-center p-3 border rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                    <div>
                      <div className="font-medium capitalize">
                        {calendar.type} Calendar
                      </div>
                      <div className="text-sm text-gray-600">
                        {calendar.email}
                      </div>
                    </div>
                  </div>

                  {calendar.connected ? (
                    <button
                      onClick={() => handleDisconnectCalendar(calendar.id)}
                      className="text-red-600 hover:text-red-800 transition duration-200"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnectCalendar(calendar.type)}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded transition duration-200"
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}

              <button className="w-full border border-dashed border-gray-300 p-3 rounded-md text-gray-600 hover:bg-gray-50 transition duration-200">
                + Add Another Calendar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
