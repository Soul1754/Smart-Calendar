## values.yaml (ngrok section only)

```yaml
# ngrok Tunnel configuration (requires ngrok Kubernetes Operator)
ngrok:
  # Enable/disable ngrok tunnel creation
  enabled: true
  
  # Tunnel name (will be prefixed with release name)
  tunnelName: "smart-calendar-tunnel"
  
  # Target service configuration
  target:
    # Service name to expose (backend or frontend)
    serviceName: "backend"
    # Service port to expose
    servicePort: 5001
  
  # Protocol (http or tcp)
  protocol: "http"
  
  # Additional tunnel labels
  labels: {}
  
  # Additional tunnel annotations
  annotations: {}
```

---

## templates/ngrok-tunnel.yaml

```yaml
{{- if .Values.ngrok.enabled }}
apiVersion: ngrok.com/v1alpha1
kind: Tunnel
metadata:
  name: {{ include "smart-calendar.fullname" . }}-{{ .Values.ngrok.tunnelName }}
  labels:
    {{- include "smart-calendar.labels" . | nindent 4 }}
    app.kubernetes.io/component: ngrok-tunnel
    {{- with .Values.ngrok.labels }}
    {{- toYaml . | nindent 4 }}
    {{- end }}
  {{- with .Values.ngrok.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  protocol: {{ .Values.ngrok.protocol }}
  target:
    service:
      name: {{ include "smart-calendar.fullname" . }}-{{ .Values.ngrok.target.serviceName }}
      port: {{ .Values.ngrok.target.servicePort }}
{{- end }}
```

---

## Helm Commands

### Install Chart
```bash
helm install smart-calendar ./helm/smart-calendar
```

### View Public ngrok URL
```bash
# List all tunnels
kubectl get tunnels

# Get the public URL
kubectl get tunnel smart-calendar-smart-calendar-tunnel -o jsonpath='{.status.url}'
```

---

## Plain YAML (without Helm templating)

If you want to apply this directly without Helm:

### ngrok-tunnel.yaml (standalone)
```yaml
apiVersion: ngrok.com/v1alpha1
kind: Tunnel
metadata:
  name: smart-calendar-tunnel
  labels:
    app: smart-calendar
    component: ngrok-tunnel
spec:
  protocol: http
  target:
    service:
      name: smart-calendar-backend  # or smart-calendar-frontend
      port: 5001  # or 3000 for frontend
```

### Apply directly
```bash
kubectl apply -f ngrok-tunnel.yaml
kubectl get tunnels
kubectl get tunnel smart-calendar-tunnel -o jsonpath='{.status.url}'
```
