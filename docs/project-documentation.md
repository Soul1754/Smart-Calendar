# Smart Calendar Application Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Backend Implementation](#backend-implementation)
   - [Server Setup](#server-setup)
   - [Authentication System](#authentication-system)
   - [Calendar Integration](#calendar-integration)
   - [API Endpoints](#api-endpoints)
4. [Frontend Implementation](#frontend-implementation)
   - [Component Structure](#component-structure)
   - [Authentication Flow](#authentication-flow)
   - [Calendar Management](#calendar-management)
   - [Meeting Scheduling](#meeting-scheduling)
5. [Data Models](#data-models)
6. [Integration with External Services](#integration-with-external-services)
   - [Google Calendar](#google-calendar)
   - [Microsoft Calendar](#microsoft-calendar)

## Project Overview

Smart Calendar is a comprehensive calendar management application that integrates with popular calendar services like Google Calendar and Microsoft Calendar. It allows users to view, create, and manage events across different calendar platforms from a single interface. The application features user authentication, calendar synchronization, and meeting scheduling capabilities.

## System Architecture

The Smart Calendar application follows a client-server architecture:

- **Frontend**: React-based single-page application (SPA) with component-based architecture
- **Backend**: Node.js/Express.js RESTful API server
- **Database**: MongoDB for storing user data and application state
- **External APIs**: Integration with Google Calendar API and Microsoft Graph API

### Technology Stack

- **Frontend**: React, React Router, Axios, Tailwind CSS, Heroicons
- **Backend**: Node.js, Express.js, Mongoose (MongoDB ODM)
- **Authentication**: JWT (JSON Web Tokens), Passport.js for OAuth
- **External Services**: Google OAuth 2.0, Microsoft OAuth 2.0

## Backend Implementation

### Server Setup

The backend server is built with Express.js and configured with necessary middleware for handling JSON requests, CORS, and authentication. The server connects to MongoDB using Mongoose and exposes RESTful API endpoints for authentication and calendar operations.

```javascript
// Server initialization in server.js
const app = express();
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/calendar", require("./routes/calendar"));
```

### Authentication System

The application implements a dual authentication system:

1. **Local Authentication**: Email/password-based authentication with JWT
2. **OAuth Authentication**: Sign-in with Google and Microsoft accounts

#### JWT Authentication

The application uses JSON Web Tokens (JWT) for maintaining user sessions. When a user logs in, the server generates a JWT token that is sent to the client and stored in local storage. This token is included in the Authorization header for subsequent API requests.

```javascript
// JWT token generation
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "7d" }
  );
};
```

#### OAuth Implementation

The application uses Passport.js for implementing OAuth authentication with Google and Microsoft. The OAuth flow is as follows:

1. User clicks on "Sign in with Google/Microsoft" button
2. User is redirected to the respective OAuth provider
3. After successful authentication, the provider redirects back to the application with an authorization code
4. The server exchanges the code for access and refresh tokens
5. The server creates or updates the user record with the tokens and user information
6. The server generates a JWT token and redirects the user to the frontend with the token

```javascript
// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
    },
    async (accessToken, refreshToken, profile, done) => {
      // Implementation details for user creation/update
    }
  )
);
```

### Calendar Integration

The application integrates with Google Calendar and Microsoft Calendar using their respective APIs. The integration allows users to:

- View events from their calendars
- Create new events that sync with their calendars
- Manage calendar events across platforms

#### Google Calendar Integration

The application uses the Google Calendar API through the `googleapis` library. When a user connects their Google account, the application stores the access and refresh tokens in the user's record. These tokens are used to authenticate API requests to Google Calendar.

```javascript
// Google Calendar API setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "/auth/google/callback"
);

oauth2Client.setCredentials({
  access_token: user.googleAccessToken,
  refresh_token: user.googleRefreshToken,
});

const calendar = google.calendar({ version: "v3", auth: oauth2Client });
```

#### Microsoft Calendar Integration

The application uses the Microsoft Graph API to integrate with Microsoft Calendar. Similar to Google Calendar, the application stores the Microsoft access and refresh tokens in the user's record.

```javascript
// Microsoft Graph API request
const response = await axios.get("https://graph.microsoft.com/v1.0/me/events", {
  headers: {
    Authorization: `Bearer ${user.microsoftAccessToken}`,
  },
  params: {
    $top: 10,
    $orderby: "start/dateTime",
    $select: "subject,organizer,start,end,location",
  },
});
```

### API Endpoints

#### Authentication Endpoints

- `POST /auth/register`: Register a new user
- `POST /auth/login`: Login with email and password
- `GET /auth/google`: Initiate Google OAuth flow
- `GET /auth/google/callback`: Handle Google OAuth callback
- `GET /auth/microsoft`: Initiate Microsoft OAuth flow
- `GET /auth/microsoft/callback`: Handle Microsoft OAuth callback
- `GET /auth/me`: Get current user information

#### Calendar Endpoints

- `GET /calendar/google/events`: Get events from Google Calendar
- `POST /calendar/google/events`: Create an event in Google Calendar
- `GET /calendar/microsoft/events`: Get events from Microsoft Calendar
- `POST /calendar/microsoft/events`: Create an event in Microsoft Calendar

## Frontend Implementation

### Component Structure

The frontend is built with React and organized into reusable components:

- **Layout**: Main layout component with navigation
- **Auth Components**: Login, Register, RequireAuth
- **Calendar Components**: Calendar, NewMeeting, Meetings
- **User Components**: Profile, Home

### Authentication Flow

The frontend implements the authentication flow using React Context API. The `AuthContext` provides authentication state and methods to all components.

```javascript
// Auth context provider
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

  // ... other implementation details

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

The application uses a `RequireAuth` component to protect routes that require authentication:

```javascript
const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};
```

### Calendar Management

The Calendar component is responsible for displaying events from connected calendars. It fetches events from the backend API and renders them in a calendar view.

```javascript
// Fetch Google Calendar events
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

    // Transform and set events
    setEvents(formattedEvents);
  } catch (error) {
    setError("Failed to fetch events");
  } finally {
    setIsLoading(false);
  }
};
```

### Meeting Scheduling

The NewMeeting component allows users to schedule new meetings. It provides a form for entering meeting details and attendees, and it can suggest optimal meeting times based on attendees' availability.

```javascript
// Schedule meeting function
const handleScheduleMeeting = (timeSlot) => {
  // In a real application, this would make an API call to schedule the meeting
  // and add it to all attendees' calendars
  alert(
    `Meeting "${meetingData.title}" scheduled for ${format(
      meetingData.date,
      "MMMM d, yyyy"
    )} at ${timeSlot.startTime}`
  );
};
```

## Data Models

### User Model

The User model stores user information and authentication credentials:

```javascript
const UserSchema = new mongoose.Schema({
  googleId: { type: String, sparse: true },
  microsoftId: { type: String, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Not required for OAuth users
  googleAccessToken: String,
  googleRefreshToken: String,
  microsoftAccessToken: String,
  microsoftRefreshToken: String,
  createdAt: { type: Date, default: Date.now },
});
```

## Integration with External Services

### Google Calendar

The application integrates with Google Calendar using the OAuth 2.0 protocol. The integration requires the following steps:

1. Create a Google Cloud Platform project
2. Enable the Google Calendar API
3. Configure OAuth consent screen
4. Create OAuth client ID credentials
5. Configure the application with client ID and secret

The application requests the following scopes from Google:

- `profile`: To get user profile information
- `email`: To get user email address
- `https://www.googleapis.com/auth/calendar`: To access and modify Google Calendar

### Microsoft Calendar

The application integrates with Microsoft Calendar using the Microsoft Identity Platform and Microsoft Graph API. The integration requires the following steps:

1. Register an application in the Azure Portal
2. Configure authentication settings
3. Request API permissions for Microsoft Graph
4. Create client secret
5. Configure the application with client ID and secret

The application requests the following scopes from Microsoft:

- `user.read`: To get user profile information
- `calendars.read`: To read calendar events
- `calendars.readwrite`: To create and modify calendar events

---

This documentation provides an overview of the Smart Calendar application's architecture, implementation details, and integration with external services. It serves as a reference for developers working on the project and provides insights into the application's functionality and design decisions.
