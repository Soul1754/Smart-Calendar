# ngrok Tunnel Setup with Helm

## Prerequisites

Ensure the ngrok Kubernetes Operator is installed in your cluster:

```bash
# Install ngrok operator (if not already installed)
kubectl apply -f https://github.com/ngrok/ngrok-operator/releases/latest/download/ngrok-operator.yaml

# Verify operator is running
kubectl get pods -n ngrok-operator
```

## Configuration

The ngrok tunnel is configured in `values.yaml`:

```yaml
ngrok:
  enabled: true
  tunnelName: "smart-calendar-tunnel"
  target:
    serviceName: "smart-calendar-backend" # or "smart-calendar-frontend"
    servicePort: 5001 # or 3000 for frontend
  protocol: "http"
```

## Install Chart with ngrok Tunnel

### Option 1: Install with default values

```bash
helm install smart-calendar ./helm/smart-calendar
```

### Option 2: Install with custom values

```bash
helm install smart-calendar ./helm/smart-calendar \
  --set ngrok.enabled=true \
  --set ngrok.target.serviceName=backend \
  --set ngrok.target.servicePort=5001
```

### Option 3: Install with custom values file

```bash
# Create custom-values.yaml with your overrides
helm install smart-calendar ./helm/smart-calendar -f custom-values.yaml
```

## View the Public ngrok URL

After installation, get the tunnel status and public URL:

```bash
# List all tunnels
kubectl get tunnels

# Get detailed tunnel information
kubectl describe tunnel smart-calendar-smart-calendar-tunnel

# Get the public URL directly
kubectl get tunnel smart-calendar-smart-calendar-tunnel -o jsonpath='{.status.url}'
```

## Expose Backend vs Frontend

### To expose the backend API:

```yaml
ngrok:
  enabled: true
  target:
    serviceName: "backend"
    servicePort: 5001
```

### To expose the frontend:

```yaml
ngrok:
  enabled: true
  target:
    serviceName: "frontend"
    servicePort: 3000
```

## Upgrade Tunnel Configuration

```bash
# Update values and upgrade
helm upgrade smart-calendar ./helm/smart-calendar \
  --set ngrok.target.serviceName=frontend \
  --set ngrok.target.servicePort=3000

# Or upgrade with custom values file
helm upgrade smart-calendar ./helm/smart-calendar -f custom-values.yaml
```

## Disable ngrok Tunnel

```bash
# Disable tunnel without uninstalling the chart
helm upgrade smart-calendar ./helm/smart-calendar --set ngrok.enabled=false
```

## Uninstall

```bash
# Uninstall the entire chart (including tunnel)
helm uninstall smart-calendar

# Verify tunnel is removed
kubectl get tunnels
```

## Troubleshooting

### Tunnel not created

```bash
# Check if ngrok operator is running
kubectl get pods -n ngrok-operator

# Check tunnel events
kubectl describe tunnel smart-calendar-smart-calendar-tunnel

# Check operator logs
kubectl logs -n ngrok-operator -l app=ngrok-operator
```

### Tunnel status shows "Error"

```bash
# Check tunnel status
kubectl get tunnel smart-calendar-smart-calendar-tunnel -o yaml

# Common issues:
# 1. Target service doesn't exist
# 2. Target port is incorrect
# 3. ngrok account limits exceeded
```

### Service not accessible via ngrok URL

```bash
# Verify target service is running
kubectl get svc

# Check backend/frontend pods are healthy
kubectl get pods

# Test service locally first
kubectl port-forward svc/smart-calendar-backend 5001:5001
curl http://localhost:5001/health
```

## Advanced Configuration

### Multiple Tunnels

To expose both backend and frontend, install the chart twice with different release names:

```bash
# Expose backend
helm install smart-calendar-api ./helm/smart-calendar \
  --set frontend.enabled=false \
  --set ngrok.target.serviceName=backend \
  --set ngrok.target.servicePort=5001

# Expose frontend
helm install smart-calendar-web ./helm/smart-calendar \
  --set backend.enabled=false \
  --set ngrok.target.serviceName=frontend \
  --set ngrok.target.servicePort=3000
```

### Custom Tunnel Labels

```yaml
ngrok:
  enabled: true
  labels:
    environment: production
    team: platform
  annotations:
    description: "Smart Calendar API Tunnel"
```

## Example: Complete Installation Flow

```bash
# 1. Install ngrok operator (if needed)
kubectl apply -f https://github.com/ngrok/ngrok-operator/releases/latest/download/ngrok-operator.yaml

# 2. Wait for operator to be ready
kubectl wait --for=condition=available --timeout=120s deployment/ngrok-operator -n ngrok-operator

# 3. Install Smart Calendar with ngrok tunnel
helm install smart-calendar ./helm/smart-calendar

# 4. Wait for tunnel to be ready
kubectl wait --for=condition=Ready --timeout=60s tunnel smart-calendar-smart-calendar-tunnel

# 5. Get the public URL
NGROK_URL=$(kubectl get tunnel smart-calendar-smart-calendar-tunnel -o jsonpath='{.status.url}')
echo "Smart Calendar is accessible at: $NGROK_URL"

# 6. Test the endpoint
curl $NGROK_URL/health  # for backend
# or
curl $NGROK_URL  # for frontend
```
