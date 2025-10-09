# Next.js Migration Map (App Router)

This document inventories current frontend routes, components, services, and API endpoints to guide a smooth migration from Vite React to Next.js (App Router, TypeScript, Tailwind, next-themes, React Query, Zod, GSAP).

## Routing and Pages Mapping

- Public
  - `/` → Landing page → `app/page.tsx`
  - `/login` → Login page → `app/(auth)/login/page.tsx`
  - `/register` → Register page → `app/(auth)/register/page.tsx`
- Protected (requires auth)
  - `/dashboard` → Weekly calendar default → `app/dashboard/page.tsx`
  - `/dashboard/meetings/new` → Create meeting → `app/dashboard/meetings/new/page.tsx`
  - `/dashboard/profile` → Profile → `app/dashboard/profile/page.tsx`
- Global/shared UI
  - Navbar → `app/(components)/Navbar.tsx` or part of `app/dashboard/layout.tsx`
  - Chatbot widget → client component rendered in a layout (e.g., `app/layout.tsx` or `app/dashboard/layout.tsx`)

Auth protection options in Next.js:

- Phase 1 (simple): client-side guard inside pages (check token in localStorage; redirect if missing)
- Phase 2 (better): middleware-based protection for `/dashboard(.*)` using cookie/session (requires backend issuing an HTTP-only cookie); keep current `x-auth-token` approach initially for speed of migration

## Client Context/Providers

- `contexts/ChatModelContext.jsx` → Wrap in `app/providers.tsx` and expose via context
- `contexts/ThemeContext.jsx` → Replace with `next-themes` integration; Tailwind dark mode via `class`

## Services: API Client and Endpoints

Shared axios instance: `frontend/src/services/api.js`

- Base URL: `http://localhost:5001` (migrate to `process.env.NEXT_PUBLIC_API_BASE_URL`)
- Request interceptor: adds `x-auth-token` from `localStorage`

In Next.js:

- Create `lib/api.ts` (axios instance)
  - baseURL = `process.env.NEXT_PUBLIC_API_BASE_URL`
  - Attach `x-auth-token` from `localStorage` in browser only (client components)
  - For SSR/route handlers, prefer cookies later; Phase 1 remains CSR

### Auth Service

- POST `/auth/register`
  - Input: `{ name, email, password }` (from `Register.jsx`)
  - Output: `{ token, user }` (token stored in `localStorage`, inferred from usage)
- POST `/auth/login`
  - Input: `{ email, password }`
  - Output: `{ token, user }`
- GET `/auth/me`
  - Output: `{ user }`
- OAuth start URLs (external redirects):
  - GET `${API_URL}/auth/google` → Start Google OAuth
  - GET `${API_URL}/auth/microsoft` → Start Microsoft OAuth
- POST `/auth/disconnect`
  - Input: `{ calendarId }`
  - Output: `{ success: boolean }`
- PUT `/auth/preferences`
  - Input: `preferences` object
  - Output: `{ user | success }`

References:

- Used in `Login.jsx`, `Register.jsx`, `Profile.jsx`, `App.jsx` (bootstrap session via `/auth/me`)

### Calendar Service

Google Calendar

- GET `/api/calendar/google/events` with optional query params
  - `timeMin` (ISO8601) | `timeMax` (ISO8601)
  - Output: `{ events: Event[] }`
- POST `/api/calendar/google/events`
  - Input: `eventData`
  - Output: `{ event } | { id }`
- PUT `/api/calendar/google/events/:eventId`
  - Input: `eventData`
  - Output: `{ event }`
- DELETE `/api/calendar/google/events/:eventId`
  - Output: `{ success }`

Microsoft Calendar

- GET `/api/calendar/microsoft/events`
  - Output: `{ events }` (shape aligned to unified UI)
- POST `/api/calendar/microsoft/events`
  - Input: `eventData`
  - Output: `{ event }`

Unified availability

- POST `/api/calendar/unified/findAvailableSlots`
  - Input: `{ date, duration, attendees, businessHours?, incrementMinutes?, maxResults? }`
  - Output: `{ slots: Slot[] } | Slot[]`

References:

- `WeeklyCalendar.jsx` uses `calendarService.getEvents` for weekly range
- `NewMeeting.jsx` uses `findUnifiedAvailableSlots` and `createGoogleEvent`
- `googleCalendarService` offers `getEventsByDateRange`, `createEvent`, `updateEvent`, `deleteEvent`

### Chatbot Service

- POST `/api/chatbot/message`
  - Input: `{ message, timezone, model? }`
  - Output: `{ reply | message | messages }` (server-defined; UI expects a bot message string)

References:

- `Chatbot.jsx` (floating widget), uses model from `ChatModelContext`

## Component → Next.js Mapping

- `Landing.jsx` → `app/page.tsx`
  - GSAP hero animations, CTA to `/register`
- `Login.jsx`, `Register.jsx` → `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`
  - Dark cards, input styles, OAuth buttons
- `WeeklyCalendar.jsx` → `app/dashboard/page.tsx` (extract as a child component `WeeklyCalendar.tsx`)
  - Full-screen weekly grid, left time column, scrollable
  - Header: month, navigation, New Meeting button, profile menu
- `NewMeeting.jsx` → `app/dashboard/meetings/new/page.tsx`
  - Use unified availability API, create Google event
- `Profile.jsx` → `app/dashboard/profile/page.tsx`
  - Preferences form, connect/disconnect calendars, OAuth redirects
- `Navbar.jsx` → `app/dashboard/layout.tsx` (top bar within dashboard)
- `Chatbot.jsx` + `styles/Chatbot.css` → client component rendered in `app/layout.tsx` or `app/dashboard/layout.tsx`

## Theming and Styling

- Tailwind CSS with dark theme
  - Migrate current palette (from `src/theme/colors.js`) into CSS variables (e.g., `:root` and `.dark`)
  - Use `next-themes` to toggle; Tailwind `darkMode: 'class'`
- Keep GSAP-based animations where applicable; use `use client` at top of animated components

## State and Data Fetching

- Introduce TanStack Query for API calls in client components
  - Wrap app in `QueryClientProvider` via `app/providers.tsx`
  - Create Zod schemas for inputs/outputs (optional Phase 1)
- Axios instance in `lib/api.ts` using `NEXT_PUBLIC_API_BASE_URL`

## Auth Handling in Next.js

- Phase 1
  - Persist token in `localStorage` (matching current behavior)
  - Axios interceptor adds `x-auth-token`
  - Client-side guards in pages; redirect to `/login` if missing
- Phase 2 (optional)
  - Switch to cookie-based auth (HTTP-only)
  - Add `middleware.ts` to protect `/dashboard(.*)`

## Edge Cases and Notes

- Token missing/expired → redirect to `/login`
- OAuth flows keep using backend redirects via `window.location.href = authService.getGoogleAuthUrl()`
- Calendar grid performance → consider dynamic import for heavy libs (if adopted)
- Chatbot relies on timezone: always include `Intl.DateTimeFormat().resolvedOptions().timeZone`

## Environment Variables

Create `.env.local` in Next.js app with:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:5001`

## Deliverables (Phase 1 Migration)

- Scaffolding: Next.js App Router (TypeScript) under `/web` directory
- Global setup: Tailwind, next-themes, React Query, path aliases
- Ported pages/components:
  - Landing, Login, Register
  - Dashboard (Weekly Calendar), New Meeting, Profile
  - Navbar, Chatbot
- API client: `lib/api.ts` with axios + auth header
- Optional: Zod schema types for API responses and inputs

## Source References

- Services
  - `frontend/src/services/api.js`
  - `frontend/src/services/googleCalendar.js`
- Components linking routes and APIs
  - `frontend/src/components/WeeklyCalendar.jsx`
  - `frontend/src/components/NewMeeting.jsx`
  - `frontend/src/components/Profile.jsx`
  - `frontend/src/components/Login.jsx`
  - `frontend/src/components/Register.jsx`
  - `frontend/src/components/Landing.jsx`
  - `frontend/src/components/Chatbot.jsx` + `frontend/src/styles/Chatbot.css`
