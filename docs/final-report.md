## Smart Calendar – Final Project Report

### 1. Introduction
Smart Calendar is a unified, AI‑assisted scheduling platform that streamlines meeting creation across Google (and scaffolded Microsoft) calendars. It focuses on: fast multi‑turn natural interaction (chatbot), conflict‑aware slot suggestion, and seamless event write‑back. The architecture was designed to be provider‑agnostic, enabling future expansion (Microsoft full parity, other providers) with minimal refactoring.

### 2. Core Objectives
1. Secure user authentication (email/password + OAuth).
2. Aggregate calendar availability across participants.
3. Provide guided conversational meeting scheduling with conflict resolution.
4. Persist and synchronize events to external calendar providers.
5. Offer clean, modular frontend UX for manual and assisted scheduling.

### 3. Functional Overview
| Domain | Implemented | Notes |
|--------|-------------|-------|
| User Auth (JWT) | ✅ | Login / register; token middleware protects APIs. |
| Google OAuth2 | ✅ | Access + refresh tokens stored; auto refresh handler. |
| Microsoft OAuth2 | 🟡 (partial) | Structure present; limited runtime integration. |
| Event Fetch (Google) | ✅ | events.list with time window filtering. |
| Event Create (Google) | ✅ | calendar.events.insert incl. attendees + notifications. |
| Event Fetch (Microsoft) | ✅ (basic) | /me/events listing. |
| Event Create (Microsoft) | ✅ (basic) | /me/events POST; timezone aware. |
| Unified Availability | ✅ | Merges Google freeBusy + provider events; slot scoring. |
| Chatbot Scheduling | ✅ | Multi‑turn, conflict detection, alternative slot selection. |
| Timezone Handling | ✅ | Frontend timezone supplied; prevents UTC shift errors. |
| Attendee Normalization | ✅ | Email extraction & deduplication. |
| Slot Scoring | ✅ | Prefers midday (13:00) & proximity to requested start. |
| Session Persistence | In‑Memory | Future: Redis / DB for durability. |
| Unknown Domains Handling | ✅ | Skipped gracefully; reported as unreachable. |

### 4. Architecture Summary
Backend (Express + MongoDB):
- Layers: Routes → Services (Calendar, Chatbot) → External APIs.
- Auth middleware injects user on protected routes.
- CalendarService abstracts Google/Microsoft operations; supports token refresh.
- ChatbotService manages conversational state (Map) + scheduling logic.

Frontend (React + Tailwind):
- Component segmentation: Navigation, Calendar views, New Meeting form, Chatbot.
- API layer (`services/api.js`) isolates HTTP details.
- Chatbot component renders conversational flow, slot buttons, typing indicator.

Data Flow (Meeting Scheduling):
1. User initiates scheduling (chat or form).
2. Chatbot collects required fields sequentially (title/date/time/attendees).
3. Conflict detection queries day events (Google/Microsoft).
4. On conflict, unified availability enumerates candidate free slots.
5. User selects alternative; event created & confirmed; session cleared.

### 5. Key Algorithms
**Busy Merge & Slot Extraction**
1. Collect busy intervals (freeBusy + events).
2. Sort + merge overlaps (O(n log n) with sort).
3. Traverse business hours window (default 09:00–17:00).
4. Generate candidate slots at fixed increment (30m) meeting required duration.

**Scoring Function**
score = 0.6 * (1 / (1 + hoursFromDesired)) + 0.4 * (1 - min(|hour - 13| / 8, 1))

**Natural Input Parsing**
- Dates: today, tomorrow, weekday names, multiple numeric & verbal formats.
- Times: 12h / 24h, with am/pm fallback normalization.
- Attendees: Regex extraction, lowercasing & dedupe.

### 6. Timezone Strategy
- Browser timezone string forwarded each message.
- Event payload uses local naive start/end + explicit `timeZone` (no premature UTC conversion).
- Safety: If computed end <= start, auto +30m adjustment to avoid provider rejection.

### 7. Security Considerations
- JWT for API access; tokens stored client‑side (localStorage) – could be hardened (httpOnly cookie).
- OAuth refresh token persisted (Google); rotated when new refresh presented.
- Input sanitation in chatbot minimal (improve for production to mitigate prompt injection / large payloads).
- Rate limiting & CSRF not yet implemented (future hardening).

### 8. Error Handling & Resilience
- Google token expiry → refresh via OAuth client event.
- Invalid credentials → surfaced 401; front‑end can trigger reconnect UI.
- Graceful degradation for unreachable attendee calendars.
- Fallback parsing paths for malformed date/time ensure prompts continue.

### 9. Limitations
- Sessions ephemeral (server memory; lost on restart / scaling horizontally).
- Microsoft attendee free/busy not aggregated (no getSchedule integration yet).
- Recurring events unsupported (single-instance only).
- Reminders & notification customization minimal.
- No persistence of user preferences (business hours, slot increment, duration defaults) beyond code defaults.

### 10. Future Enhancements
| Area | Enhancement |
|------|-------------|
| Session Layer | Move to Redis with TTL + multi-instance support. |
| Provider Parity | Implement Microsoft getSchedule / findMeetingTimes API. |
| Availability | Incorporate attendee working hours & timezones. |
| Recurrence | Add RRULE handling & UI for repeating events. |
| Preferences | User-defined business hours, default duration, slot granularity. |
| Notifications | Email/web push reminders & reschedule suggestions. |
| LLM Upgrade | Swap intent parser for richer model; add summarization of week ahead. |
| Security | Add rate limiting, audit logging, secret rotation, cookie-based auth. |
| Analytics | Meeting load charts, focus time metrics, cancellation rates. |
| Testing | Expand unit/integration tests & contract tests for external APIs. |

### 11. Deployment Notes
- Requires env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, DB connection string, (future: Microsoft client credentials).
- Scaling memory sessions requires sticky sessions or external store.
- API rate limits: cache freeBusy responses briefly when exploring alternatives.

### 12. Quick Start (Dev)
```bash
git clone https://github.com/Soul1754/Smart-Calendar.git
cd Smart-Calendar

# Backend
cd backend
npm install
cp .env.example .env   # fill in Google credentials, DB, JWT secret
npm run dev

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev
```
Open: http://localhost:5173 (frontend) | Backend default: http://localhost:5001

### 13. High-Level Sequence (Chatbot Scheduling)
1. User: "Schedule meeting tomorrow 2pm with alice@example.com".
2. Intent parser extracts partial fields; session starts (missing title).
3. Bot prompts for title; user supplies.
4. Conflict check → conflict found → alt slots generated.
5. User picks slot button (e.g. #2).
6. Event created; confirmation returned.

### 14. Repository Layout (Essential)
```
backend/
  routes/ (auth, calendar, chatbot)
  services/ (calendar.js, chatbot.js)
  models/ (User.js)
frontend/
  src/components/ (Chatbot, NewMeeting, Calendar, ...)
  src/services/api.js
docs/ (api-documentation.md, project-documentation.md, final-report.md)
```

### 15. Conclusion
The project establishes a solid, extensible foundation for intelligent cross‑provider scheduling. Its modular service layer, structured availability algorithm, and adaptive chatbot flow enable rapid iteration toward enterprise features (preference personalization, analytics, multi‑tenant scaling). Completing Microsoft parity and adding persistence for sessions & preferences are the most impactful next steps.

---
Maintained by: Smart Calendar Team
License: MIT (adjust if different)
