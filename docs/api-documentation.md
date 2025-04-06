# Smart Calendar API Documentation

## Base URL

```
http://localhost:5001
```

## Authentication

Most API endpoints require authentication. Include the JWT token in the request header:

```
x-auth-token: <your_jwt_token>
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `404 Not Found`: Resource not found
- `500 Server Error`: Server-side error

Error responses follow this format:

```json
{
  "message": "Error message description"
}
```

## Authentication Endpoints

### Register User

```
POST /auth/register
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Login User

```
POST /auth/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "hasGoogleCalendar": true,
    "hasMicrosoftCalendar": false
  }
}
```

### Get Current User

```
GET /auth/me
```

**Response:**

```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "hasGoogleCalendar": true,
    "hasMicrosoftCalendar": false
  }
}
```

### Google OAuth Authentication

```
GET /auth/google
```

Redirects the user to Google's OAuth consent screen.

### Google OAuth Callback

```
GET /auth/google/callback
```

Callback URL for Google OAuth. Redirects to the frontend with a JWT token.

### Microsoft OAuth Authentication

```
GET /auth/microsoft
```

Redirects the user to Microsoft's OAuth consent screen.

### Microsoft OAuth Callback

```
GET /auth/microsoft/callback
```

Callback URL for Microsoft OAuth. Redirects to the frontend with a JWT token.

## Calendar Endpoints

### Get Google Calendar Events

```
GET /calendar/google/events
```

**Query Parameters:**

- `timeMin` (optional): ISO date string for the start time of events to fetch
- `timeMax` (optional): ISO date string for the end time of events to fetch

**Response:**

```json
{
  "events": [
    {
      "id": "event_id",
      "summary": "Meeting with Team",
      "description": "Weekly team meeting",
      "start": {
        "dateTime": "2023-06-15T09:00:00Z",
        "timeZone": "UTC"
      },
      "end": {
        "dateTime": "2023-06-15T10:00:00Z",
        "timeZone": "UTC"
      },
      "attendees": [
        { "email": "attendee1@example.com" },
        { "email": "attendee2@example.com" }
      ]
    }
  ]
}
```

### Create Google Calendar Event

```
POST /calendar/google/events
```

**Request Body:**

```json
{
  "summary": "Meeting with Team",
  "description": "Weekly team meeting",
  "start": "2023-06-15T09:00:00Z",
  "end": "2023-06-15T10:00:00Z",
  "attendees": ["attendee1@example.com", "attendee2@example.com"]
}
```

**Response:**

```json
{
  "event": {
    "id": "event_id",
    "summary": "Meeting with Team",
    "description": "Weekly team meeting",
    "start": {
      "dateTime": "2023-06-15T09:00:00Z",
      "timeZone": "UTC"
    },
    "end": {
      "dateTime": "2023-06-15T10:00:00Z",
      "timeZone": "UTC"
    },
    "attendees": [
      { "email": "attendee1@example.com" },
      { "email": "attendee2@example.com" }
    ]
  }
}
```

### Get Microsoft Calendar Events

```
GET /calendar/microsoft/events
```

**Response:**

```json
{
  "events": [
    {
      "id": "event_id",
      "subject": "Meeting with Team",
      "organizer": {
        "emailAddress": {
          "name": "John Doe",
          "address": "john@example.com"
        }
      },
      "start": {
        "dateTime": "2023-06-15T09:00:00Z",
        "timeZone": "UTC"
      },
      "end": {
        "dateTime": "2023-06-15T10:00:00Z",
        "timeZone": "UTC"
      },
      "location": {
        "displayName": "Conference Room"
      }
    }
  ]
}
```

### Create Microsoft Calendar Event

```
POST /calendar/microsoft/events
```

**Request Body:**

```json
{
  "subject": "Meeting with Team",
  "body": "<p>Weekly team meeting</p>",
  "start": "2023-06-15T09:00:00Z",
  "end": "2023-06-15T10:00:00Z",
  "attendees": ["attendee1@example.com", "attendee2@example.com"]
}
```

**Response:**

```json
{
  "event": {
    "id": "event_id",
    "subject": "Meeting with Team",
    "body": {
      "contentType": "HTML",
      "content": "<p>Weekly team meeting</p>"
    },
    "start": {
      "dateTime": "2023-06-15T09:00:00Z",
      "timeZone": "UTC"
    },
    "end": {
      "dateTime": "2023-06-15T10:00:00Z",
      "timeZone": "UTC"
    },
    "attendees": [
      {
        "emailAddress": {
          "address": "attendee1@example.com"
        },
        "type": "required"
      },
      {
        "emailAddress": {
          "address": "attendee2@example.com"
        },
        "type": "required"
      }
    ]
  }
}
```

## Error Codes and Troubleshooting

### Common Error Scenarios

1. **Authentication Errors**

   - `401 Unauthorized`: Invalid or expired JWT token
   - `401 Unauthorized`: Google/Microsoft authentication failed

2. **Calendar Integration Errors**

   - `400 Bad Request`: Calendar not connected
   - `401 Unauthorized`: Calendar access token expired

3. **Request Validation Errors**
   - `400 Bad Request`: Missing required fields
   - `400 Bad Request`: Invalid date format

### Troubleshooting Tips

1. **JWT Token Issues**

   - Ensure the token is included in the `x-auth-token` header
   - Check if the token has expired
   - Verify that the token was generated by the server

2. **OAuth Connection Issues**

   - Reconnect the calendar service if authentication fails
   - Check if the required scopes were granted during OAuth
   - Verify that the OAuth credentials are correctly configured

3. **Calendar API Issues**
   - Ensure the event data follows the required format
   - Check if the user has permission to access/modify the calendar
   - Verify that the calendar service is available
