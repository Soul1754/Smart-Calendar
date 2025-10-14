# ngrok Tunnel - Quick Command Reference

## Prerequisites
```bash
# Install ngrok Kubernetes Operator
kubectl apply -f https://github.com/ngrok/ngrok-operator/releases/latest/download/ngrok-operator.yaml

# Verify operator is running
kubectl get pods -n ngrok-operator
```

## Install Chart

### Default (exposes backend on port 5001)
```bash
helm install smart-calendar ./helm/smart-calendar
```

### Expose Frontend
```bash
helm install smart-calendar ./helm/smart-calendar \
  --set ngrok.target.serviceName=frontend \
  --set ngrok.target.servicePort=3000
```

### Disable ngrok Tunnel
```bash
helm install smart-calendar ./helm/smart-calendar \
  --set ngrok.enabled=false
```

## View Public URL

```bash
# List all tunnels
kubectl get tunnels

# Get detailed info
kubectl describe tunnel smart-calendar-smart-calendar-tunnel

# Get public URL only
kubectl get tunnel smart-calendar-smart-calendar-tunnel -o jsonpath='{.status.url}'

# Save URL to variable
NGROK_URL=$(kubectl get tunnel smart-calendar-smart-calendar-tunnel -o jsonpath='{.status.url}')
echo "Public URL: $NGROK_URL"
```

## Upgrade Configuration

```bash
# Switch from backend to frontend
helm upgrade smart-calendar ./helm/smart-calendar \
  --set ngrok.target.serviceName=frontend \
  --set ngrok.target.servicePort=3000

# Change protocol to TCP
helm upgrade smart-calendar ./helm/smart-calendar \
  --set ngrok.protocol=tcp
```

## Test Endpoints

```bash
# Get URL
NGROK_URL=$(kubectl get tunnel smart-calendar-smart-calendar-tunnel -o jsonpath='{.status.url}')

# Test backend health
curl $NGROK_URL/health

# Test frontend
curl $NGROK_URL

# Test with verbose output
curl -v $NGROK_URL
```

## Troubleshooting

```bash
# Check tunnel status
kubectl get tunnel smart-calendar-smart-calendar-tunnel

# View tunnel events
kubectl describe tunnel smart-calendar-smart-calendar-tunnel

# Check operator logs
kubectl logs -n ngrok-operator -l app=ngrok-operator

# Verify target service exists
kubectl get svc | grep smart-calendar

# Check backend/frontend pods
kubectl get pods -l app.kubernetes.io/name=smart-calendar
```

## Uninstall

```bash
# Remove chart (includes tunnel)
helm uninstall smart-calendar

# Verify tunnel is gone
kubectl get tunnels
```

## Complete Example

```bash
# 1. Install with backend exposed
helm install smart-calendar ./helm/smart-calendar

# 2. Wait for tunnel to be ready (30-60 seconds)
kubectl wait --for=condition=Ready --timeout=120s \
  tunnel smart-calendar-smart-calendar-tunnel

# 3. Get public URL
NGROK_URL=$(kubectl get tunnel smart-calendar-smart-calendar-tunnel \
  -o jsonpath='{.status.url}')

# 4. Display URL
echo "🚀 Smart Calendar Backend is live at: $NGROK_URL"
echo "📍 Health check: $NGROK_URL/health"

# 5. Test the endpoint
curl $NGROK_URL/health
```
