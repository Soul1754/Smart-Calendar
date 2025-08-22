# Smart Calendar

Unified, AI‑assisted meeting scheduling across connected calendars (Google live, Microsoft scaffolded). Provides multi‑turn conversational scheduling, conflict detection, alternative slot suggestions, and timezone‑aware event creation.

## ✨ Key Features
| Area | Highlights |
|------|------------|
| Auth | Email/password (JWT) + Google OAuth2 (refresh handling) |
| Calendars | Google fully integrated; Microsoft basic endpoints scaffolded |
| Scheduling | Multi‑turn chatbot gathers title/date/time/attendees |
| Availability | Unified slot finder merges busy intervals & scores candidates |
| Conflict Resolution | Detects clashes; suggests ranked alternative slots (buttons) |
| Timezone Safety | Local timezone forwarded; prevents UTC time drift |
| Attendees | Email extraction, dedupe; unreachable domains reported gracefully |
| Frontend | React + Tailwind responsive SPA with chatbot + manual meeting UI |

## 🧠 Chatbot Flow (High Level)
1. User: “Schedule meeting with alice tomorrow 2pm.”  
2. Intent parser extracts partial params; missing fields prompted sequentially.  
3. All required fields collected → conflict check.  
4. If busy → availability engine returns top slots (e.g. 1–5).  
5. User clicks a slot button or types number/time.  
6. Event created via provider API → confirmation.

## 🧮 Availability Algorithm (Simplified)
1. Fetch busy data:
    - Google: `freeBusy.query` + events list
    - Microsoft: current user events (future: `getSchedule`)
2. Merge overlapping intervals (sort + linear pass).
3. Within business hours (09:00–17:00), slice candidate windows (30m step).
4. Filter for required duration (default 30m). 
5. Score each slot by (distance to desired start & proximity to 13:00). 
6. Return top N (default 5).

Scoring formula (conceptual):
```
score = 0.6 * (1/(1 + hoursFromDesired)) + 0.4 * (1 - min(|hour-13|/8, 1))
```

## 🏗 Architecture Overview
```
frontend (React)
   ├─ components (Chatbot, Calendar, NewMeeting, Auth, Layout)
   ├─ services/api.js (Axios wrappers)
   └─ state (auth context)

backend (Node/Express)
   ├─ routes (auth, calendar, chatbot)
   ├─ services
   │    ├─ calendar.js  (Google / Microsoft API abstraction)
   │    └─ chatbot.js   (Intent + session + scheduling logic)
   ├─ middleware/auth.js (JWT verification)
   └─ models/User.js (tokens, profile)

External APIs:
   Google Calendar API (events.list, events.insert, freeBusy)
   Microsoft Graph API (/me/events, calendarView – future getSchedule)
```

## ⚙️ Tech Stack
**Backend:** Node.js, Express, MongoDB, Google APIs, Microsoft Graph, JWT  
**Frontend:** React, Vite, TailwindCSS, Axios  
**Language:** JavaScript (ES6)  

## 🚀 Quick Start
Clone & install:
```bash
git clone https://github.com/Soul1754/Smart-Calendar.git
cd Smart-Calendar

# Backend
cd backend
npm install
cp .env.example .env   # add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, MONGO_URI, JWT_SECRET
npm run dev

# Frontend
cd ../frontend
npm install
npm run dev
```
Open frontend: http://localhost:5173  |  Backend: http://localhost:5001

## 🔐 Environment Variables (Backend)
| Variable | Purpose |
|----------|---------|
| GOOGLE_CLIENT_ID | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | Google OAuth secret |
| JWT_SECRET | Signing secret for JWT tokens |
| MONGO_URI | MongoDB connection string |
| MS_CLIENT_ID (future) | Microsoft application ID |
| MS_CLIENT_SECRET (future) | Microsoft secret |

Frontend may require a `.env` for API base URL if deploying (e.g. `VITE_API_URL`).

## 📡 Key Internal Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /auth/register | POST | Create user (email/password) |
| /auth/login | POST | JWT login |
| /auth/google | GET | Start Google OAuth flow |
| /api/calendar/google/events | GET/POST | List / create Google events |
| /api/calendar/microsoft/events | GET/POST | List / create MS events |
| /api/calendar/unified/findAvailableSlots | POST | Unified availability search |
| /api/chatbot/message | POST | Conversational scheduling & queries |

## 🕒 Timezone Handling
Frontend sends browser timezone each chatbot message. Backend stores and applies it directly in event payload (avoiding UTC shift errors). If end ≤ start, it auto-adjusts (+30m) for safety.

## 🧪 Testing & Quality (Planned)
- Add unit tests for availability merging & scoring.
- Integration tests with mocked Google/Microsoft APIs (nock / msw).
- Snapshot tests for chatbot state transitions.

## 🧩 Roadmap
- [ ] Persist chatbot sessions (Redis) for scale.
- [ ] Microsoft free/busy via `getSchedule` / `findMeetingTimes`.
- [ ] Recurring event creation (RRULE support).
- [ ] User preferences: business hours, default duration.
- [ ] Enhanced notification + reminder system.
- [ ] Analytics dashboard (focus time, meeting load).
- [ ] Rich LLM responses (summaries, rescheduling suggestions).

## 📚 Extended Documentation
See: `docs/final-report.md` for architecture details & future scope.  
Also: `docs/api-documentation.md`, `docs/project-documentation.md`.

## 🤝 Contributing
1. Fork & branch (`feat/<name>`).  
2. Run lint/tests locally (CI scripts TBD).  
3. Submit PR with concise description & screenshots (if UI).  

## 🛡 License
MIT (adjust if changed). Include LICENSE file for distribution.

## 🙋 Support / Questions
Open an issue or discussion in the repository. PRs improving Microsoft parity or session persistence especially welcome.

---
Built for unified, intelligent scheduling – extensible by design.