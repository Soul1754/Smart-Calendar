# Smart Calendar Frontend Documentation

## Overview

The Smart Calendar frontend is built with React and provides a user-friendly interface for managing calendar events across different platforms. This document outlines the component structure, state management, routing, and UI implementation details.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Component Architecture](#component-architecture)
3. [State Management](#state-management)
4. [Routing](#routing)
5. [Authentication Flow](#authentication-flow)
6. [Calendar Integration](#calendar-integration)
7. [UI/UX Design](#uiux-design)
8. [API Integration](#api-integration)

## Project Structure

The frontend project follows a standard React application structure:

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Calendar.jsx
│   │   ├── Home.jsx
│   │   ├── Layout.jsx
│   │   ├── Login.jsx
│   │   ├── Meetings.jsx
│   │   ├── Navbar.jsx
│   │   ├── NewMeeting.jsx
│   │   ├── Profile.jsx
│   │   ├── Register.jsx
│   │   └── RequireAuth.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── package.json
└── vite.config.js
```

## Component Architecture

The application follows a component-based architecture with the following key components:

### Layout Components

- **Layout**: Main layout wrapper that includes the Navbar and content area
- **Navbar**: Navigation bar with links to different sections and authentication status

### Authentication Components

- **Login**: Handles user login with email/password and OAuth options
- **Register**: Handles new user registration
- **RequireAuth**: Higher-order component that protects routes requiring authentication

### Calendar Components

- **Calendar**: Displays calendar events and provides date navigation
- **Meetings**: Lists upcoming meetings and events
- **NewMeeting**: Form for creating new meetings/events

### User Components

- **Home**: Dashboard with overview of calendar integrations and upcoming events
- **Profile**: User profile management and calendar connection settings

## State Management

The application uses React Context API for global state management, particularly for authentication state.

### AuthContext

The `AuthContext` provides authentication state and methods to all components:

```javascript
export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication methods
  const login = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Verify token and get user data
      const verifyAuth = async () => {
        try {
          const { user: userData } = await authService.getCurrentUser();
          setIsAuthenticated(true);
          setUser(userData);
        } catch (error) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } finally {
          setLoading(false);
        }
      };
      verifyAuth();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

### Local Component State

Individual components manage their own state for form inputs, UI interactions, and component-specific data:

```javascript
// Example from NewMeeting component
const [meetingData, setMeetingData] = useState({
  title: "",
  description: "",
  date: new Date(),
  startTime: "",
  endTime: "",
  duration: 30,
  attendees: [],
});
```

## Routing

The application uses React Router for navigation and route protection:

```javascript
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route
              index
              element={
                <RequireAuth>
                  <Home />
                </RequireAuth>
              }
            />
            <Route
              path="calendar"
              element={
                <RequireAuth>
                  <Calendar />
                </RequireAuth>
              }
            />
            <Route
              path="meetings"
              element={
                <RequireAuth>
                  <Meetings />
                </RequireAuth>
              }
            />
            <Route
              path="new-meeting"
              element={
                <RequireAuth>
                  <NewMeeting />
                </RequireAuth>
              }
            />
            <Route
              path="profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## Authentication Flow

The frontend implements a comprehensive authentication flow:

1. **Local Authentication**:

   - User enters email/password in the Login component
   - Credentials are sent to the backend via API
   - On success, JWT token is stored in localStorage
   - AuthContext is updated with user information

2. **OAuth Authentication**:

   - User clicks "Sign in with Google/Microsoft" button
   - User is redirected to the OAuth provider
   - After successful authentication, provider redirects back with token
   - Token is extracted from URL and stored in localStorage
   - AuthContext is updated with user information

3. **Token Handling**:

   - JWT token is included in all API requests via Axios interceptor
   - Token is verified on application startup
   - Expired or invalid tokens trigger logout

4. **Route Protection**:
   - RequireAuth component checks authentication status
   - Unauthenticated users are redirected to login page
   - Loading state is displayed during authentication check

## Calendar Integration

The frontend integrates with calendar services through the backend API:

### Fetching Calendar Events

```javascript
// Example from Calendar component
const fetchGoogleEvents = async () => {
  setIsLoading(true);
  setError(null);
  try {
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
    }));

    setEvents(formattedEvents);
  } catch (error) {
    setError("Failed to fetch events");
  } finally {
    setIsLoading(false);
  }
};
```

### Creating Calendar Events

```javascript
// Example from NewMeeting component
const handleCreateEvent = async () => {
  setIsLoading(true);
  try {
    // Format event data for API
    const eventData = {
      summary: meetingData.title,
      description: meetingData.description,
      start: new Date(
        `${format(meetingData.date, "yyyy-MM-dd")}T${meetingData.startTime}`
      ).toISOString(),
      end: new Date(
        `${format(meetingData.date, "yyyy-MM-dd")}T${meetingData.endTime}`
      ).toISOString(),
      attendees: meetingData.attendees,
    };

    // Create event in Google Calendar
    await calendarService.createGoogleEvent(eventData);

    // Show success message and redirect
    alert("Meeting created successfully!");
    navigate("/calendar");
  } catch (error) {
    setError("Failed to create meeting");
  } finally {
    setIsLoading(false);
  }
};
```

## UI/UX Design

The application uses Tailwind CSS for styling and Heroicons for icons, creating a modern and responsive user interface:

### Responsive Design

The UI is designed to work on various screen sizes using Tailwind's responsive classes:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

### Loading States

Loading states are displayed during API calls to improve user experience:

```jsx
{isLoading ? (
  <div className="flex justify-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
) : (
  // Content
)}
```

### Error Handling

Errors are displayed to users with clear messages:

```jsx
{
  error && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  );
}
```

## API Integration

The frontend communicates with the backend through a centralized API service:

```javascript
// api.js
import axios from "axios";

const API_URL = "http://localhost:5001";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication service
export const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // OAuth URLs
  getGoogleAuthUrl: () => `${API_URL}/auth/google`,
  getMicrosoftAuthUrl: () => `${API_URL}/auth/microsoft`,
};

// Calendar service
export const calendarService = {
  // Get Google Calendar events
  getGoogleEvents: async () => {
    const response = await api.get("/calendar/google/events");
    return response.data;
  },

  // Get Microsoft Calendar events
  getMicrosoftEvents: async () => {
    const response = await api.get("/calendar/microsoft/events");
    return response.data;
  },

  // Create Google Calendar event
  createGoogleEvent: async (eventData) => {
    const response = await api.post("/calendar/google/events", eventData);
    return response.data;
  },

  // Create Microsoft Calendar event
  createMicrosoftEvent: async (eventData) => {
    const response = await api.post("/calendar/microsoft/events", eventData);
    return response.data;
  },
};

export default api;
```

This service-based approach centralizes API calls and provides a clean interface for components to interact with the backend.
