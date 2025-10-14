# Smart Calendar Helm Chart

A Helm chart for deploying the Smart Calendar application - a two-tier web application with Next.js frontend and Node.js/Express backend.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- kubectl configured to communicate with your cluster
- Docker images built and pushed to a registry
- MongoDB Atlas connection string (or other MongoDB instance)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Ingress                          │
│              (smart-calendar.local)                 │
└──────────────┬────────────────┬────────────────────┘
               │                │
       /api/* │                │ /*
               │                │
       ┌───────▼────────┐  ┌───▼──────────────┐
       │    Backend     │  │    Frontend      │
       │  (Node.js)     │  │   (Next.js)      │
       │   Port: 5001   │  │   Port: 3000     │
       └───────┬────────┘  └──────────────────┘
               │
               │ MONGO_URI
               │
       ┌───────▼────────┐
       │  MongoDB Atlas │
       │   (External)   │
       └────────────────┘
```

## Installation

### 1. Prepare MongoDB Connection String

First, encode your MongoDB connection string in base64:

```bash
echo -n 'mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority' | base64
```

Copy the output and update it in `values.yaml` under `mongodb.uri`.

### 2. Update Docker Image References

Edit `values.yaml` and update the following fields with your actual Docker Hub username:

```yaml
backend:
  image:
    repository: YOUR-DOCKERHUB-USERNAME/smart-calendar-backend
    tag: latest

frontend:
  image:
    repository: YOUR-DOCKERHUB-USERNAME/smart-calendar-frontend
    tag: latest
```

### 3. Build and Push Docker Images

From your project root:

```bash
# Build and push backend
cd backend
docker build -t YOUR-DOCKERHUB-USERNAME/smart-calendar-backend:latest .
docker push YOUR-DOCKERHUB-USERNAME/smart-calendar-backend:latest

# Build and push frontend
cd ../web
docker build -t YOUR-DOCKERHUB-USERNAME/smart-calendar-frontend:latest .
docker push YOUR-DOCKERHUB-USERNAME/smart-calendar-frontend:latest
```

### 4. Install the Helm Chart

```bash
# Install with default values
helm install smart-calendar ./helm/smart-calendar

# Or install with custom values file
helm install smart-calendar ./helm/smart-calendar -f custom-values.yaml

# Or override specific values via command line
helm install smart-calendar ./helm/smart-calendar \
  --set backend.image.tag=v1.0.0 \
  --set frontend.image.tag=v1.0.0 \
  --set ingress.host=my-domain.com
```

### 5. Verify Installation

```bash
# Check all resources
kubectl get all -l app.kubernetes.io/name=smart-calendar

# Check pods
kubectl get pods

# Check services
kubectl get svc

# Check ingress
kubectl get ingress

# View logs
kubectl logs -l app.kubernetes.io/component=backend
kubectl logs -l app.kubernetes.io/component=frontend
```

### 6. Access the Application

If using local development with Minikube:

```bash
# Add to /etc/hosts
echo "$(minikube ip) smart-calendar.local" | sudo tee -a /etc/hosts

# Access via browser
open http://smart-calendar.local
```

For production, ensure your DNS points to the Ingress controller's external IP.

## Configuration

### Key Configuration Options

| Parameter                   | Description                              | Default                                           |
| --------------------------- | ---------------------------------------- | ------------------------------------------------- |
| `backend.replicaCount`      | Number of backend replicas               | `1`                                               |
| `backend.image.repository`  | Backend Docker image repository          | `your-dockerhub-username/smart-calendar-backend`  |
| `backend.image.tag`         | Backend image tag                        | `latest`                                          |
| `backend.containerPort`     | Backend container port                   | `5001`                                            |
| `backend.service.port`      | Backend service port                     | `5001`                                            |
| `frontend.replicaCount`     | Number of frontend replicas              | `1`                                               |
| `frontend.image.repository` | Frontend Docker image repository         | `your-dockerhub-username/smart-calendar-frontend` |
| `frontend.image.tag`        | Frontend image tag                       | `latest`                                          |
| `frontend.containerPort`    | Frontend container port                  | `3000`                                            |
| `frontend.service.port`     | Frontend service port                    | `3000`                                            |
| `mongodb.uri`               | Base64-encoded MongoDB connection string | `""`                                              |
| `ingress.enabled`           | Enable Ingress                           | `true`                                            |
| `ingress.className`         | Ingress class name                       | `nginx`                                           |
| `ingress.host`              | Application hostname                     | `smart-calendar.local`                            |

### Health Checks

The chart includes configurable liveness and readiness probes:

**Backend probes** check `/health` endpoint (ensure your Express app implements this).

**Frontend probes** check `/` endpoint.

You can customize probe settings in `values.yaml`:

```yaml
backend:
  probes:
    liveness:
      enabled: true
      path: /health
      initialDelaySeconds: 30
      periodSeconds: 10
```

## Upgrading

```bash
# Upgrade with new values
helm upgrade smart-calendar ./helm/smart-calendar

# Upgrade with specific values
helm upgrade smart-calendar ./helm/smart-calendar \
  --set backend.image.tag=v1.1.0

# Force recreation of pods
helm upgrade smart-calendar ./helm/smart-calendar --force
```

## Uninstalling

```bash
# Uninstall the release
helm uninstall smart-calendar

# Verify removal
kubectl get all -l app.kubernetes.io/name=smart-calendar
```

## Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Common issues:
# 1. Image pull errors - verify image exists and credentials
# 2. MongoDB connection - verify MONGO_URI secret is correctly base64-encoded
# 3. Health check failures - verify /health endpoint exists in backend
```

### Ingress not working

```bash
# Verify Ingress controller is installed
kubectl get pods -n ingress-nginx

# Check Ingress resource
kubectl describe ingress smart-calendar

# For Minikube, enable Ingress addon
minikube addons enable ingress
```

### MongoDB connection issues

```bash
# Verify secret exists and is correct
kubectl get secret smart-calendar-mongodb -o yaml

# Decode and verify the connection string
kubectl get secret smart-calendar-mongodb -o jsonpath='{.data.MONGO_URI}' | base64 -d

# Check backend logs for connection errors
kubectl logs -l app.kubernetes.io/component=backend
```

## Production Considerations

### Security

1. **Use external secret management** (e.g., HashiCorp Vault, AWS Secrets Manager, Sealed Secrets)
2. **Enable TLS** for Ingress:
   ```yaml
   ingress:
     tls:
       enabled: true
       secretName: smart-calendar-tls
   ```
3. **Use image digests** instead of tags for immutability
4. **Enable Pod Security Standards**

### High Availability

1. **Increase replica counts**:

   ```yaml
   backend:
     replicaCount: 3
   frontend:
     replicaCount: 3
   ```

2. **Configure Pod Disruption Budgets**
3. **Set up Horizontal Pod Autoscaling (HPA)**
4. **Use anti-affinity rules** to spread pods across nodes

### Resource Management

Adjust resource limits based on your workload:

```yaml
backend:
  resources:
    requests:
      cpu: 250m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi
```

### Monitoring

Integrate with Prometheus/Grafana:

```yaml
backend:
  podAnnotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "5001"
    prometheus.io/path: "/metrics"
```

## Contributing

For issues or contributions, please visit the [GitHub repository](https://github.com/Soul1754/Smart-Calendar).

## License

[Add your license here]
