`# Quick Start Guide - Helm Deployment

## Prerequisites Checklist

- [ ] Kubernetes cluster running (Minikube, Kind, GKE, EKS, AKS)
- [ ] `kubectl` configured and connected to cluster
- [ ] `helm` 3.x installed
- [ ] Docker images built and pushed to registry
- [ ] MongoDB Atlas connection string ready

## Step-by-Step Installation

### 1. Verify Cluster Access

```bash
kubectl cluster-info
kubectl get nodes
```

### 2. Prepare MongoDB Secret

Encode your MongoDB connection string:

```bash
# Replace with your actual MongoDB Atlas connection string
export MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"

# Encode to base64
echo -n "$MONGO_URI" | base64
```

Copy the base64 output.

### 3. Update values.yaml

Edit `helm/smart-calendar/values.yaml`:

```yaml
# Update Docker image repositories (lines 14-15, 76-77)
backend:
  image:
    repository: YOUR-DOCKERHUB-USERNAME/smart-calendar-backend
    tag: latest

frontend:
  image:
    repository: YOUR-DOCKERHUB-USERNAME/smart-calendar-frontend
    tag: latest

# Update MongoDB URI (line 144)
mongodb:
  uri: "YOUR-BASE64-ENCODED-MONGO-URI"

# Update host if not using local (line 156)
ingress:
  host: "smart-calendar.local" # or your actual domain
```

### 4. Build and Push Docker Images

```bash
# Navigate to project root
cd /path/to/Smart-Calendar

# Build and push backend
docker build -t YOUR-USERNAME/smart-calendar-backend:latest ./backend
docker push YOUR-USERNAME/smart-calendar-backend:latest

# Build and push frontend
docker build -t YOUR-USERNAME/smart-calendar-frontend:latest ./web
docker push YOUR-USERNAME/smart-calendar-frontend:latest
```

### 5. Install Ingress Controller (if not already installed)

For Minikube:

```bash
minikube addons enable ingress
```

For bare clusters:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --create-namespace \
  --namespace ingress-nginx
```

### 6. Install Smart Calendar

```bash
# From project root
helm install smart-calendar ./helm/smart-calendar

# Or with custom namespace
helm install smart-calendar ./helm/smart-calendar --create-namespace --namespace smart-calendar
```

### 7. Verify Installation

```bash
# Check all resources
kubectl get all -l app.kubernetes.io/name=smart-calendar

# Watch pods come up
kubectl get pods -w

# Check ingress
kubectl get ingress

# View backend logs
kubectl logs -l app.kubernetes.io/component=backend -f

# View frontend logs
kubectl logs -l app.kubernetes.io/component=frontend -f
```

### 8. Configure Local Access (for Minikube/Kind)

```bash
# Get Ingress IP
kubectl get ingress smart-calendar

# Add to /etc/hosts
echo "$(kubectl get ingress smart-calendar -o jsonpath='{.status.loadBalancer.ingress[0].ip}') smart-calendar.local" | sudo tee -a /etc/hosts

# For Minikube specifically:
echo "$(minikube ip) smart-calendar.local" | sudo tee -a /etc/hosts
```

### 9. Access Application

Open browser: http://smart-calendar.local

- Frontend: http://smart-calendar.local
- Backend API: http://smart-calendar.local/api

## Common Commands

```bash
# View release info
helm list

# Get deployment status
helm status smart-calendar

# View rendered templates
helm get manifest smart-calendar

# Upgrade after changes
helm upgrade smart-calendar ./helm/smart-calendar

# Rollback
helm rollback smart-calendar

# Uninstall
helm uninstall smart-calendar
```

## Troubleshooting

### Pods stuck in ImagePullBackOff

```bash
# Check if images exist in registry
docker images | grep smart-calendar

# Verify image pull secrets (if using private registry)
kubectl get secrets

# Check pod events
kubectl describe pod <pod-name>
```

### Backend can't connect to MongoDB

```bash
# Verify secret exists
kubectl get secret smart-calendar-mongodb

# Decode and verify connection string
kubectl get secret smart-calendar-mongodb -o jsonpath='{.data.MONGO_URI}' | base64 -d

# Check backend logs for specific error
kubectl logs -l app.kubernetes.io/component=backend --tail=100
```

### Ingress not working

```bash
# Verify Ingress controller is running
kubectl get pods -n ingress-nginx

# Check Ingress resource
kubectl describe ingress smart-calendar

# Verify /etc/hosts entry
cat /etc/hosts | grep smart-calendar
```

### Health probes failing

```bash
# Check if /health endpoint exists (backend)
kubectl port-forward svc/smart-calendar-backend 5001:5001
curl http://localhost:5001/health

# Adjust probe settings in values.yaml if needed
backend:
  probes:
    liveness:
      initialDelaySeconds: 60  # Increase if app takes long to start
```

## Production Deployment

For production, consider:

1. **Use specific image tags** (not `latest`)
2. **Enable TLS**:
   ```yaml
   ingress:
     tls:
       enabled: true
       secretName: smart-calendar-tls
   ```
3. **Use external secret management** (Sealed Secrets, Vault, etc.)
4. **Increase replicas**:
   ```yaml
   backend:
     replicaCount: 3
   frontend:
     replicaCount: 3
   ```
5. **Set up monitoring** (Prometheus, Grafana)
6. **Configure resource limits** appropriately
7. **Implement autoscaling** (HPA)

## Next Steps

- Set up CI/CD pipeline for automated deployments
- Configure monitoring and alerting
- Implement backup strategy for MongoDB
- Set up log aggregation (ELK, Loki)
- Configure network policies for security
- Implement rate limiting and WAF

## Support

For issues, see the main README or open an issue on GitHub.
