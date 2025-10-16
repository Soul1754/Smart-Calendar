# Setting Up Google OAuth for Smart Calendar

## Overview

This guide will walk you through the process of setting up Google OAuth credentials for the Smart Calendar application. These credentials are necessary for enabling Google Calendar integration.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Steps to Create Google OAuth Credentials

### 1. Create a New Project in Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click on "New Project"
4. Enter a name for your project (e.g., "Smart Calendar")
5. Click "Create"

### 2. Enable the Google Calendar API

1. Select your newly created project
2. Navigate to "APIs & Services" > "Library"
3. Search for "Google Calendar API"
4. Click on the API and then click "Enable"

### 3. Configure the OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you're using a Google Workspace account)
3. Click "Create"
4. Fill in the required information:
   - App name: "Smart Calendar"
   - User support email: Your email address
   - Developer contact information: Your email address
5. Click "Save and Continue"
5. Add the following scopes:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
7. Click "Save and Continue"
8. Add test users if you're in testing mode
9. Click "Save and Continue"

### 4. Create OAuth Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Name: "Smart Calendar Web Client"
5. Add Authorized JavaScript origins:
   - Local dev: `http://localhost:3000` (Next.js default) or your dev URL
   - Cloud: your Vercel frontend URL (e.g., `https://<project>.vercel.app`)
6. Add Authorized redirect URIs (must be exact):
   - Local tunnel (ngrok): `https://<your-domain>.ngrok-free.app/auth/google/callback`
   - Production: `https://<backend-domain>/auth/google/callback`
7. Click "Create"
8. You will see a modal with your client ID and client secret. Copy these values.

## Configuring Your Application

1. Open the `.env` file in the backend directory
2. Update the following values with your credentials:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```
3. Save the file

## Testing the Integration

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd web && npm run dev`
3. Ensure backend env `FRONTEND_URL` and frontend env `NEXT_PUBLIC_API_BASE_URL` are set correctly
4. Click "Continue with Google"
5. After consenting, you'll be redirected back to `/auth/callback?token=...`; the frontend saves token and calls `/auth/me`.

## Troubleshooting

- If you encounter "redirect_uri_mismatch", ensure the Console redirect URI matches `<public-backend>/auth/google/callback` exactly (including scheme/host/path)
- For "invalid_client" errors, double-check that your client ID and secret are correctly copied into the .env file
- If you see "access_denied" errors, verify that you've enabled the necessary APIs and configured the correct scopes
- For ngrok free domains, the frontend must send header `ngrok-skip-browser-warning: true` and backend CORS must allow it.

## Moving to Production

When deploying to production:

1. Add your production frontend domain to Authorized JavaScript origins
2. Add your production backend callback URL to Authorized redirect URIs
3. If you selected "External" user type, you'll need to verify your app and go through the verification process before it can be used by all users
