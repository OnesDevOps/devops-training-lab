# Step 9 — Deploy Applications to K3s

> Build Docker images for all three applications, push them to the private Docker Registry, and deploy them to the K3s cluster on the Datacenter.

---

## 01 — Build Docker Images

From the Developer Desktop, build each app:

### Angular Frontend

```bash
cd src/frontend
docker build -t <registry-ip>/devops-lab/frontend:1.0.0 .
```

### Java Spring Boot — Customer Service

```bash
cd src/customer-service
docker build -t <registry-ip>/devops-lab/customer-service:1.0.0 .
```

### .NET — Lab Service

```bash
cd src/lab-service
docker build -t <registry-ip>/devops-lab/lab-service:1.0.0 .
```

---

## 02 — Push to Docker Registry

```bash
docker login <registry-ip>

docker push <registry-ip>/devops-lab/frontend:1.0.0
docker push <registry-ip>/devops-lab/customer-service:1.0.0
docker push <registry-ip>/devops-lab/lab-service:1.0.0
```

Verify by querying the registry API:
```bash
curl -s http://<registry-ip>/v2/_catalog
```
You should see all 3 repositories listed in the JSON response.

---

## 03 — Deploy to K3s

### Create Namespace

```bash
kubectl create namespace devops-lab
```

### Deploy Frontend

Apply `infra/09-deploy-applications/k8s/frontend/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: devops-lab
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: <registry-ip>/devops-lab/frontend:1.0.0
          ports:
            - containerPort: 80
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "256Mi"
              cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: devops-lab
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: devops-lab
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 1
  maxReplicas: 2
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Deploy Customer Service

Apply `infra/09-deploy-applications/k8s/customer-service/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: customer-service
  namespace: devops-lab
spec:
  replicas: 1
  selector:
    matchLabels:
      app: customer-service
  template:
    metadata:
      labels:
        app: customer-service
    spec:
      containers:
        - name: customer-service
          image: <registry-ip>/devops-lab/customer-service:1.0.0
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_DATASOURCE_URL
              value: "jdbc:postgresql://<datacenter-ip>:5432/customerdb"
            - name: SPRING_DATASOURCE_USERNAME
              value: "lab_admin"
            - name: SPRING_DATASOURCE_PASSWORD
              value: "changeme_in_production"
            - name: SPRING_KAFKA_BOOTSTRAP_SERVERS
              value: "<datacenter-ip>:9092"
            - name: SPRING_REDIS_HOST
              value: "<datacenter-ip>"
            - name: JAVA_OPTS
              value: "-Xmx384m -Xms256m"
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: customer-service
  namespace: devops-lab
spec:
  selector:
    app: customer-service
  ports:
    - port: 8080
      targetPort: 8080
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: customer-service-hpa
  namespace: devops-lab
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: customer-service
  minReplicas: 1
  maxReplicas: 2
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Deploy Lab Service

Apply `infra/09-deploy-applications/k8s/lab-service/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lab-service
  namespace: devops-lab
spec:
  replicas: 1
  selector:
    matchLabels:
      app: lab-service
  template:
    metadata:
      labels:
        app: lab-service
    spec:
      containers:
        - name: lab-service
          image: <registry-ip>/devops-lab/lab-service:1.0.0
          ports:
            - containerPort: 5000
          env:
            - name: ConnectionStrings__MongoDB
              value: "mongodb://lab_admin:changeme_in_production@<datacenter-ip>:27017/labdb?authSource=admin"
            - name: Kafka__BootstrapServers
              value: "<datacenter-ip>:9092"
            - name: Redis__Configuration
              value: "<datacenter-ip>:6379"
            - name: DOTNET_GCHeapHardLimit
              value: "0x18000000"
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: lab-service
  namespace: devops-lab
spec:
  selector:
    app: lab-service
  ports:
    - port: 5000
      targetPort: 5000
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: lab-service-hpa
  namespace: devops-lab
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: lab-service
  minReplicas: 1
  maxReplicas: 2
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Deploy Ingress

Apply `infra/09-deploy-applications/k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: devops-lab-ingress
  namespace: devops-lab
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  rules:
    - http:
        paths:
          - path: /api/customers
            pathType: Prefix
            backend:
              service:
                name: customer-service
                port:
                  number: 8080
          - path: /api/labs
            pathType: Prefix
            backend:
              service:
                name: lab-service
                port:
                  number: 5000
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

### Apply All

```bash
kubectl apply -f infra/09-deploy-applications/k8s/frontend/
kubectl apply -f infra/09-deploy-applications/k8s/customer-service/
kubectl apply -f infra/09-deploy-applications/k8s/lab-service/
kubectl apply -f infra/09-deploy-applications/k8s/ingress.yaml
```

---

## 04 — Verify

```bash
kubectl get pods -n devops-lab
kubectl get svc -n devops-lab
kubectl get ingress -n devops-lab

# Test endpoints
curl http://<datacenter-ip>/
curl http://<datacenter-ip>/api/customers
curl http://<datacenter-ip>/api/labs
```

---

## 05 — Configure Horizontal Pod Autoscaler (HPA)

To ensure high availability and demonstrate autoscaling, we will deploy an HPA policy for each microservice so they scale between 1 and 2 pods based on CPU usage.

Apply the following manifest:

```yaml
# infra/09-deploy-applications/k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: devops-lab
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 1
  maxReplicas: 2
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: customer-service-hpa
  namespace: devops-lab
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: customer-service
  minReplicas: 1
  maxReplicas: 2
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: lab-service-hpa
  namespace: devops-lab
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: lab-service
  minReplicas: 1
  maxReplicas: 2
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
```

```bash
kubectl apply -f infra/09-deploy-applications/k8s/hpa.yaml
kubectl get hpa -n devops-lab
```

---

## ✅ Success Criteria

- [ ] All 3 images built and pushed to Docker Registry
- [ ] All 3 deployments running in `devops-lab` namespace
- [ ] Ingress routing `/`, `/api/customers`, `/api/labs` correctly
- [ ] HPA configured and running for all 3 deployments
- [ ] Applications connecting to their data stores
- [ ] Angular UI loads in browser
- [ ] UI connects to Java API (Customers load)
- [ ] UI connects to .NET API (Labs load)

---

> **Next →** [10 — CI/CD Pipeline](../10-cicd-pipeline/)
