# Smart Calendar

AI‑assisted meeting scheduling across Google (live) and Microsoft (scaffolded). Users authenticate via OAuth, chat with an assistant to collect meeting details, check conflicts, and create events. This repo contains a Next.js 14 frontend (`web/`), an Express backend (`backend/`), and Kubernetes Helm charts (`helm/`).

## Contents
- Features and architecture
- Local development (Next.js + Express + MongoDB Atlas)
- OAuth configuration (Google) and required env vars
- Deployment (Vercel + ngrok, or Kubernetes via Helm)
- Operations: logging, troubleshooting, security notes

---

## ✨ Features
- Authentication: JWT + Google OAuth2 (Passport) with refresh-ready storage
- Calendar: Google events create/list, freeBusy conflict checking; Microsoft stubs
- Conversational scheduling: multi‑turn flow collects title/date/time/attendees
- Availability: unified busy merge, ranked slot suggestions, timezone‑aware
- Frontend: Next.js App Router, Tailwind, React Query; Chatbot + manual create

## 🏗 Architecture
```
web/ (Next.js 14, App Router, TS)
  ├─ app/ (routes, layouts)
  ├─ components/ (chat, calendar, ui)
  └─ lib/api (axios client, API wrappers)

backend/ (Express, Passport, Mongoose)
  ├─ routes/ (auth, calendar, chatbot)
  ├─ models/ (User)
  ├─ services/ (calendar/chatbot helpers)
  └─ server.js (CORS, Passport config, health)

helm/
  └─ smart-calendar/ (Deployments, Services, Ingress incl. optional ngrok ingress)
```

## ⚙️ Environment Variables

Backend (`backend/.env`):
- `PORT=5001`
- `MONGO_URI=<mongodb-connection-string>`
- `JWT_SECRET=<random-strong-secret>`
- `FRONTEND_URL=<https://your-frontend-domain>`
- `BACKEND_URL=<https://public-backend-domain>`
- `NGROK_URL=<https://your-ngrok-domain>` (optional, preferred when set)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL=<https://public-backend>/auth/google/callback` (optional override)

Frontend (`web/.env`):
- `NEXT_PUBLIC_API_BASE_URL=<https://public-backend-domain>`
- `NEXT_PUBLIC_AUTH_TOKEN_NAME=token` (default)

Notes
- CORS on backend must allow `FRONTEND_URL` and headers: `x-auth-token`, `Authorization`, and `ngrok-skip-browser-warning` (used to bypass ngrok interstitial on free domains).
- OAuth redirect must match the public backend URL: `<BACKEND|NGROK>_URL/auth/google/callback`.

## 🧪 Local Development
```bash
# 1) Backend
cd backend
npm install
npm run dev      # nodemon server.js

# 2) Frontend
cd ../web
npm install
npm run dev      # next dev

# App runs at http://localhost:3000 (web) and http://localhost:5001 (backend)
```

## 🔐 Google OAuth (Quick)
1) Create OAuth Client (Web) in Google Cloud.
2) Authorized redirect URIs: `https://<public-backend>/auth/google/callback` (use ngrok or prod domain).
3) Authorized JS origins: your frontend (e.g., Vercel URL).
4) Set env vars in backend (`GOOGLE_CLIENT_ID/SECRET`, `FRONTEND_URL`, `BACKEND_URL` or `NGROK_URL`).
5) Set `NEXT_PUBLIC_API_BASE_URL` in frontend (Vercel project settings).

Detailed guide: `docs/google-oauth-setup.md`.

## 🚀 Deployment
Choose one of:

1) Vercel (web) + ngrok (backend public URL)
   - Frontend deployed on Vercel; backend reachable via ngrok (Kubernetes or local)
   - Set `NEXT_PUBLIC_API_BASE_URL` to ngrok domain
   - Ensure backend CORS allows `FRONTEND_URL` and `ngrok-skip-browser-warning`

2) Kubernetes via Helm (`helm/smart-calendar/`)
   - Standard Ingress for production with DNS/TLS
   - Optional ngrok ingress for demos: set `ngrok.enabled=true` and `ngrok.domain`

See `docs/DEPLOYMENT.md` and `helm/NGROK_SETUP.md`.

## 📡 Key Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /auth/google | GET | Start Google OAuth flow |
| /auth/google/callback | GET | OAuth callback, redirects with token |
| /auth/me | GET | Return current user (requires `x-auth-token`) |
| /api/calendar/... | GET/POST | Calendar operations |
| /health | GET | Liveness check |

## � Troubleshooting
- `redirect_uri_mismatch`: ensure Google Console URI matches `<public-backend>/auth/google/callback` exactly.
- ngrok interstitial page: header `ngrok-skip-browser-warning: true` must be sent; backend CORS must allow it.
- 204/No Content from `/auth/me`: confirm token included as `x-auth-token`; check CORS preflight logs.

## 📚 More Docs
- `docs/DEPLOYMENT.md` – production‑grade steps
- `docs/google-oauth-setup.md` – full OAuth setup
- `helm/NGROK_SETUP.md` – ngrok ingress quick start
- `docs/OPERATIONS.md` – logs, runbook, security, SLOs (new)

---
Built for unified, intelligent scheduling – production‑ready and extensible.
