# Deployment Guide – Smart Calendar

This guide covers production‑ready deployment paths for Smart Calendar.

Supported topologies:
- Vercel (frontend) + public backend (ngrok ingress or standard ingress with DNS)
- Full Kubernetes via Helm (frontend + backend) with optional ngrok ingress

---

## 1) Prerequisites
- Cloud MongoDB (MongoDB Atlas recommended): create DB and get `MONGO_URI`.
- Google OAuth Client (Web): get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- Domains:
	- Frontend domain (e.g., Vercel project URL)
	- Backend public URL (DNS/Ingress or ngrok domain)

---

## 2) Environment Variables

Backend (`backend/.env`):
```
PORT=5001
MONGO_URI=<mongodb-connection-string>
JWT_SECRET=<strong-random-secret>
FRONTEND_URL=<https://frontend-domain>
BACKEND_URL=<https://backend-domain>     # optional when NGROK_URL used
NGROK_URL=<https://your-domain.ngrok-free.app>  # optional for demos
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>
# Optional explicit override
GOOGLE_CALLBACK_URL=<https://backend-domain-or-ngrok>/auth/google/callback
```

Frontend (`web/.env`):
```
NEXT_PUBLIC_API_BASE_URL=<https://backend-domain-or-ngrok>
NEXT_PUBLIC_AUTH_TOKEN_NAME=token
```

CORS requirements on backend:
- origin = `FRONTEND_URL`
- allowed headers include: `Content-Type`, `x-auth-token`, `Authorization`, `ngrok-skip-browser-warning`
- methods include: `GET,POST,PUT,DELETE,OPTIONS,PATCH`

---

## 3) Vercel (Frontend) + Public Backend

1. Deploy `web/` to Vercel.
	 - In Vercel Project Settings → Environment Variables:
		 - `NEXT_PUBLIC_API_BASE_URL` = backend public URL
	 - Redeploy.

2. Host backend publicly:
	 - Option A: Kubernetes Helm with standard Ingress + DNS/TLS
	 - Option B: Kubernetes Helm with ngrok ingress (fastest demo path)

3. Google OAuth Console:
	 - Authorized JavaScript origin = your Vercel frontend URL
	 - Authorized redirect URI = `<backend-public-url>/auth/google/callback`

4. Validate:
	 - `curl <backend>/health` returns 200
	 - OAuth flow completes and `/auth/me` returns user JSON

---

## 4) Kubernetes via Helm

Chart location: `helm/smart-calendar/`

### 4.1 Standard Ingress (production)
```bash
helm upgrade --install smart-calendar ./helm/smart-calendar \
	--set ngrok.enabled=false \
	--values ./helm/smart-calendar/values.yaml
```
Configure your Ingress controller (nginx/traefik) and DNS records to point to the ingress address. Add TLS via cert‑manager where applicable.

### 4.2 ngrok Ingress (demo/QA)
```bash
helm upgrade --install smart-calendar ./helm/smart-calendar \
	--set ngrok.enabled=true \
	--set ngrok.domain="YOUR-DOMAIN.ngrok-free.app"

# Verify
kubectl get ingress smart-calendar-ngrok
kubectl describe ingress smart-calendar-ngrok
```
The template `templates/ngrok-ingress.yaml` binds your static ngrok domain to the chosen service (backend by default), giving you an instant public HTTPS URL.

> Free ngrok domains show an interstitial. Frontend requests must include header `ngrok-skip-browser-warning: true`, and backend CORS must allow this header.

---

## 5) Backend service expectations
- Health endpoint: `GET /health` → 200 OK
- Auth endpoints: `/auth/google`, `/auth/google/callback`, `/auth/me`
- Calendar endpoints under `/api/calendar/*`

Logs: server prints request line and CORS preflights including origins and headers.

---

## 6) Post‑deployment checklist
- [ ] Vercel env `NEXT_PUBLIC_API_BASE_URL` points to the public backend URL
- [ ] Backend env `FRONTEND_URL` matches the deployed frontend origin
- [ ] Google Console redirect URI matches `<public-backend>/auth/google/callback`
- [ ] MongoDB Atlas: metrics show connections, collections seeded
- [ ] CORS preflight returns 200 and includes allowed headers above
- [ ] OAuth sign‑in completes; `/auth/me` returns the authenticated user

---

## 7) Rollback
```bash
helm rollback smart-calendar <REVISION>
```

For Vercel, select the previous deployment and promote.

---

## 8) Security Notes
- Use a unique, strong `JWT_SECRET`; rotate periodically
- Restrict `FRONTEND_URL` precisely (no `*`)
- Store OAuth secrets in cluster secrets / Vercel envs, never in repo
- Prefer HTTPS everywhere; if using standard ingress, configure TLS

---

## 9) SRE Runbook (Quick)
- Investigate login failures:
	- Check backend logs for `/auth/google` and `/auth/me`
	- Look for `redirect_uri_mismatch`, `Invalid token`, or CORS errors
	- Confirm `ngrok-skip-browser-warning` header is present for ngrok domains
- Calendar errors:
	- Verify Google token presence on user record; refresh if missing
- DB issues:
	- `kubectl logs` backend pod; ensure `MONGO_URI` reachable

