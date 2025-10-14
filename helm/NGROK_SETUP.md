# ngrok Setup Guide for Smart Calendar

## Overview

This guide will help you expose your Smart Calendar application publicly using ngrok's Kubernetes Operator with a **FREE ngrok account**.

## Prerequisites

✅ ngrok Kubernetes Operator installed (already done in your cluster)  
✅ ngrok account (free or paid)  
✅ Static ngrok domain from your dashboard

---

## Step 1: Get Your Static ngrok Domain

### For FREE ngrok accounts:

1. **Go to ngrok Dashboard:**

   ```
   https://dashboard.ngrok.com/cloud-edge/domains
   ```

2. **Create a Free Static Domain:**

   - Click "New Domain" or "Create Domain"
   - Free accounts get ONE static domain like: `random-name-12345.ngrok-free.app`
   - Copy this domain name (you'll need it in Step 3)

3. **Example domain format:**
   ```
   smart-calendar-abc123.ngrok-free.app
   ```

> **Note:** Free accounts get one static domain. If you need more, you'll need a paid plan.

---

## Step 2: Update Helm Values

Edit `helm/smart-calendar/values.yaml` and update the ngrok section:

```yaml
ngrok:
  # Enable ngrok
  enabled: true

  # YOUR static domain from Step 1
  domain: "smart-calendar-abc123.ngrok-free.app" # ← CHANGE THIS!

  # Target service configuration
  target:
    # Expose backend API
    serviceName: "backend"
    servicePort: 5001

    # OR expose frontend (uncomment below and comment above)
    # serviceName: "frontend"
    # servicePort: 3000
```

---

## Step 3: Deploy with ngrok

### Option A: Fresh Install

```bash
helm install smart-calendar ./helm/smart-calendar \
  --set ngrok.enabled=true \
  --set ngrok.domain="YOUR-DOMAIN.ngrok-free.app"
```

### Option B: Upgrade Existing Release

```bash
helm upgrade smart-calendar ./helm/smart-calendar \
  --set ngrok.enabled=true \
  --set ngrok.domain="YOUR-DOMAIN.ngrok-free.app"
```

---

## Step 4: Verify Deployment

### Check Ingress Status

```bash
kubectl get ingress smart-calendar-ngrok
```

Expected output:

```
NAME                     CLASS   HOSTS                              ADDRESS   PORTS   AGE
smart-calendar-ngrok     ngrok   your-domain.ngrok-free.app         ...       80      10s
```

### Check Ingress Details

```bash
kubectl describe ingress smart-calendar-ngrok
```

Look for:

- ✅ No error events
- ✅ Host matches your domain
- ✅ Backend service is correct

---

## Step 5: Test Your Public URL

### Access Your Application

```bash
# Your backend will be available at:
https://YOUR-DOMAIN.ngrok-free.app

# Test health endpoint
curl https://YOUR-DOMAIN.ngrok-free.app/health

# Or open in browser
open https://YOUR-DOMAIN.ngrok-free.app
```

### For Free Accounts

Free ngrok domains show a warning page first:

1. User sees ngrok interstitial page
2. Click "Visit Site" button
3. Redirected to your application

---

## Quick Commands Reference

```bash
# Get your ngrok domain from dashboard first!
# Then run:

# Deploy with ngrok enabled
helm upgrade smart-calendar ./helm/smart-calendar \
  --set ngrok.enabled=true \
  --set ngrok.domain="YOUR-DOMAIN.ngrok-free.app"

# Check status
kubectl get ingress smart-calendar-ngrok

# Test endpoint
curl https://YOUR-DOMAIN.ngrok-free.app/health

# View logs
kubectl logs -l app.kubernetes.io/component=backend --tail=50
```

---

## Troubleshooting

### Issue: "404 Tunnel not found"

**Solution:**

1. Verify domain exists in ngrok dashboard
2. Check domain spelling in values.yaml
3. Verify target service exists:
   ```bash
   kubectl get svc | grep smart-calendar
   ```

---

### Issue: Cannot reach application

**Check pods:**

```bash
kubectl get pods -l app.kubernetes.io/name=smart-calendar
kubectl logs -l app.kubernetes.io/component=backend --tail=50
```

---

## Summary

✅ Create static domain in ngrok dashboard  
✅ Update `values.yaml` with your domain  
✅ Deploy with `helm upgrade`  
✅ Access via `https://your-domain.ngrok-free.app`

Happy tunneling! 🚀
