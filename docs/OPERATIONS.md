# Operations Runbook – Smart Calendar

This runbook helps SREs and operators diagnose, triage, and fix common production issues.

## Service Map
- Frontend: Next.js (Vercel or Kubernetes service `frontend`)
- Backend: Node/Express service `backend` (Kubernetes), exposes `/health`, `/auth/*`, `/api/*`
- Database: MongoDB Atlas (external)
- OAuth Provider: Google

## Health Checks
- Liveness: `GET /health` returns 200
- Auth flow happy path:
  1) `GET /auth/google` → Google login page
  2) Callback → redirect to `/auth/callback?token=<jwt>`
  3) Frontend calls `GET /auth/me` with `x-auth-token`

## Logs & Observability
- Backend logs (stdout): show method, path, origin, presence of token, and detailed `/auth/me` decoding.
- Kubernetes: `kubectl logs -l app.kubernetes.io/component=backend --tail=200`
- Vercel: Project → Deployments → Logs (frontend)

## Common Incidents
### 1) OAuth fails at callback
Symptoms: redirect to login with error, or `redirect_uri_mismatch`
- Validate env:
  - `FRONTEND_URL` (backend) matches deployed frontend origin
  - `NEXT_PUBLIC_API_BASE_URL` (frontend) points to backend public URL
  - `GOOGLE_CALLBACK_URL` equals `<public-backend>/auth/google/callback` (or allow server default)
- Google Console:
  - Authorized origins include frontend domain
  - Authorized redirect URI equals backend callback URL

### 2) `/auth/me` returns 204/404/401
- 204/No Content previously caused by CORS preflight only: ensure actual GET happens
- 401: token missing/invalid → check `x-auth-token` header
- 404: user not found → user record deleted or wrong DB; verify `_id` and email in JWT vs DB
- For ngrok domains: require header `ngrok-skip-browser-warning: true`; backend CORS must allow it

### 3) CORS errors
- Confirm backend CORS options:
  - origin = `FRONTEND_URL`
  - `allowedHeaders` include `Content-Type`, `x-auth-token`, `Authorization`, `ngrok-skip-browser-warning`
  - `optionsSuccessStatus=200`

### 4) Database connectivity
- Check `MONGO_URI` secret/ConfigMap
- Verify Atlas IP access list (allow cluster egress IP)

### 5) Calendaring failures
- Check user document for `googleAccessToken`; if missing, user must re‑connect Google
- Verify Google Calendar API enabled in Console

## Operational Tasks
- Rollout
  - Helm: `helm upgrade --install smart-calendar ./helm/smart-calendar`
  - Verify: `kubectl get ingress smart-calendar-ngrok` or standard ingress
- Rollback
  - Helm: `helm rollback smart-calendar <REVISION>`
  - Vercel: promote previous deployment

## Security
- Rotate `JWT_SECRET` and OAuth secrets periodically (use K8s Secrets / Vercel envs)
- Principle of least privilege in Google scopes
- Enforce HTTPS (Ingress TLS in production)

## SLOs (suggested)
- Availability: 99.9%
- P95 OAuth callback latency: < 1s
- Error rate (5xx): < 0.5%

## Escalation
- If auth is globally down: disable login links and post status; investigate Google API status & recent deploys
- If calendar create fails: degrade gracefully to manual entry; collect failure payloads for diagnosis
