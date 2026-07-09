# 05 — Lab Exercises

> This document contains structured, hands-on exercises for new DevOps engineers. Each exercise builds on the previous one, progressively assembling the complete DevOps Training Lab from scratch.
>
> **Source Code (GitHub):** All application repositories are hosted at [https://github.com/OnesDevOps](https://github.com/OnesDevOps).
> **GitOps Config (Gitea):** Kubernetes manifests are hosted locally at `http://192.168.8.80:3000`.

---

## Prerequisites

Before starting, ensure you have:

- [ ] **MacBook** with macOS, Homebrew installed
- [ ] **Ubuntu Server** (16GB RAM, i7) accessible via SSH from the MacBook
- [ ] SSH key-based authentication configured between MacBook → Ubuntu
- [ ] Basic familiarity with terminal commands, Docker, and YAML

---

## Lab 1: Setting Up the Developer Workstation (MacBook)

### Objective
Install and configure all control-plane tools on your MacBook.

### Tasks

#### 1.1 Install Core Tools

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install tools
brew install ansible terraform kubectl git
brew install --cask jenkins   # or use Docker: docker run -p 8080:8080 jenkins/jenkins:lts
```

#### 1.2 Verify Installations

```bash
ansible --version
terraform --version
kubectl version --client
git --version
java -version   # Jenkins needs JDK
```

#### 1.3 Configure SSH Access to Ubuntu

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "devops-lab"

# Copy key to Ubuntu host
ssh-copy-id user@<ubuntu-ip>

# Test connection
ssh user@<ubuntu-ip> "hostname && uname -a"
```

#### 1.4 Create Ansible Inventory

Create the file `inventory/hosts.yml`:

```yaml
all:
  hosts:
    datacenter:
      ansible_host: <ubuntu-ip>
      ansible_user: <your-user>
      ansible_ssh_private_key_file: ~/.ssh/id_ed25519
```

Test it:
```bash
ansible -i inventory/hosts.yml datacenter -m ping
```

### ✅ Success Criteria
- All tools installed and showing correct versions
- `ansible ping` returns `SUCCESS` for the Ubuntu host

---

## Lab 2: Provisioning the Remote Data Center (Ubuntu)

### Objective
Use Ansible to prepare the Ubuntu host: install Docker, configure the system, and deploy K3s.

### Tasks

#### 2.1 Create Ansible Playbook — Install Docker

Create `playbooks/01-install-docker.yml`:

```yaml
---
- name: Install Docker on Ubuntu Data Center
  hosts: datacenter
  become: true
  tasks:
    - name: Install prerequisite packages
      apt:
        name:
          - apt-transport-https
          - ca-certificates
          - curl
          - gnupg
          - lsb-release
        state: present
        update_cache: true

    - name: Add Docker GPG key
      ansible.builtin.apt_key:
        url: https://download.docker.com/linux/ubuntu/gpg
        state: present

    - name: Add Docker repository
      ansible.builtin.apt_repository:
        repo: "deb [arch=amd64] https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable"
        state: present

    - name: Install Docker
      apt:
        name:
          - docker-ce
          - docker-ce-cli
          - containerd.io
          - docker-compose-plugin
        state: present

    - name: Add user to docker group
      user:
        name: "{{ ansible_user }}"
        groups: docker
        append: true

    - name: Start and enable Docker
      systemd:
        name: docker
        state: started
        enabled: true
```

Run it:
```bash
ansible-playbook -i inventory/hosts.yml playbooks/01-install-docker.yml
```

#### 2.2 Create Ansible Playbook — Install K3s

Create `playbooks/02-install-k3s.yml`:

```yaml
---
- name: Install K3s on Ubuntu Data Center
  hosts: datacenter
  become: true
  tasks:
    - name: Install K3s
      shell: |
        curl -sfL https://get.k3s.io | sh -s - \
          --write-kubeconfig-mode 644 \
          --disable=servicelb \
          --kube-apiserver-arg="--service-node-port-range=80-32767"
      args:
        creates: /usr/local/bin/k3s

    - name: Wait for K3s to be ready
      command: k3s kubectl get nodes
      register: result
      until: result.rc == 0
      retries: 10
      delay: 5

    - name: Fetch kubeconfig to local machine
      fetch:
        src: /etc/rancher/k3s/k3s.yaml
        dest: ~/.kube/k3s-config
        flat: true

    - name: Display node status
      command: k3s kubectl get nodes -o wide
      register: nodes
    
    - name: Show nodes
      debug:
        var: nodes.stdout_lines
```

Run it:
```bash
ansible-playbook -i inventory/hosts.yml playbooks/02-install-k3s.yml
```

#### 2.3 Configure Local kubectl

```bash
# Edit the downloaded kubeconfig to replace 127.0.0.1 with Ubuntu's IP
sed -i '' "s/127.0.0.1/<ubuntu-ip>/g" ~/.kube/k3s-config

# Set KUBECONFIG
export KUBECONFIG=~/.kube/k3s-config

# Verify
kubectl get nodes
kubectl get pods --all-namespaces
```

### ✅ Success Criteria
- Docker is installed and running on Ubuntu
- K3s is running and `kubectl get nodes` shows the node as `Ready`
- You can run `kubectl` commands from your MacBook against the remote K3s

---

## Lab 3: Deploying Native Data Services with Terraform

### Objective
Use Terraform to provision Kafka, Redis, PostgreSQL, and MongoDB as Docker containers on the Ubuntu host.

### Tasks

#### 3.1 Configure Terraform Docker Provider

Create `terraform/main.tf`:

```hcl
terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {
  host = "ssh://user@<ubuntu-ip>"
}

# --- Network ---
resource "docker_network" "lab_net" {
  name = "devops-lab-net"
}

# --- Kafka (KRaft Mode) ---
resource "docker_image" "kafka" {
  name = "apache/kafka:latest"
}

resource "docker_volume" "kafka_data" {
  name = "kafka-data"
}

resource "docker_container" "kafka" {
  name  = "kafka"
  image = docker_image.kafka.image_id

  ports {
    internal = 9092
    external = 9092
  }

  env = [
    "KAFKA_NODE_ID=1",
    "KAFKA_PROCESS_ROLES=broker,controller",
    "KAFKA_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093",
    "KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://<ubuntu-ip>:9092",
    "KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER",
    "KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT",
    "KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093",
    "KAFKA_LOG_DIRS=/var/lib/kafka/data",
    "KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1",
    "KAFKA_HEAP_OPTS=-Xmx512m -Xms512m",
  ]

  volumes {
    volume_name    = docker_volume.kafka_data.name
    container_path = "/var/lib/kafka/data"
  }

  memory = 1024  # MB

  networks_advanced {
    name = docker_network.lab_net.name
  }

  restart = "unless-stopped"
}

# --- Redis ---
resource "docker_image" "redis" {
  name = "redis:7-alpine"
}

resource "docker_volume" "redis_data" {
  name = "redis-data"
}

resource "docker_container" "redis" {
  name  = "redis"
  image = docker_image.redis.image_id

  ports {
    internal = 6379
    external = 6379
  }

  command = [
    "redis-server",
    "--maxmemory", "256mb",
    "--maxmemory-policy", "allkeys-lru",
    "--save", "60", "1000",
  ]

  volumes {
    volume_name    = docker_volume.redis_data.name
    container_path = "/data"
  }

  memory = 300  # MB

  networks_advanced {
    name = docker_network.lab_net.name
  }

  restart = "unless-stopped"
}

# --- PostgreSQL ---
resource "docker_image" "postgres" {
  name = "postgres:16-alpine"
}

resource "docker_volume" "pgdata" {
  name = "pgdata"
}

resource "docker_container" "postgres" {
  name  = "postgres"
  image = docker_image.postgres.image_id

  ports {
    internal = 5432
    external = 5432
  }

  env = [
    "POSTGRES_DB=customerdb",
    "POSTGRES_USER=lab_admin",
    "POSTGRES_PASSWORD=changeme_in_production",
    "POSTGRES_SHARED_BUFFERS=128MB",
    "POSTGRES_MAX_CONNECTIONS=20",
  ]

  volumes {
    volume_name    = docker_volume.pgdata.name
    container_path = "/var/lib/postgresql/data"
  }

  memory = 300  # MB

  networks_advanced {
    name = docker_network.lab_net.name
  }

  restart = "unless-stopped"
}

# --- MongoDB ---
resource "docker_image" "mongodb" {
  name = "mongo:7"
}

resource "docker_volume" "mongodata" {
  name = "mongodata"
}

resource "docker_container" "mongodb" {
  name  = "mongodb"
  image = docker_image.mongodb.image_id

  ports {
    internal = 27017
    external = 27017
  }

  env = [
    "MONGO_INITDB_DATABASE=labdb",
    "MONGO_INITDB_ROOT_USERNAME=lab_admin",
    "MONGO_INITDB_ROOT_PASSWORD=changeme_in_production",
  ]

  command = ["mongod", "--wiredTigerCacheSizeGB", "0.25"]

  volumes {
    volume_name    = docker_volume.mongodata.name
    container_path = "/data/db"
  }

  memory = 400  # MB

  networks_advanced {
    name = docker_network.lab_net.name
  }

  restart = "unless-stopped"
}

# --- Outputs ---
output "service_endpoints" {
  value = {
    kafka    = "<ubuntu-ip>:9092"
    redis    = "<ubuntu-ip>:6379"
    postgres = "<ubuntu-ip>:5432"
    mongodb  = "<ubuntu-ip>:27017"
  }
}
```

#### 3.2 Apply Terraform

```bash
cd terraform/
terraform init
terraform plan
terraform apply
```

#### 3.3 Verify All Services

```bash
# SSH into Ubuntu and check
ssh user@<ubuntu-ip>

docker ps
docker stats --no-stream

# Test Kafka
docker exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

# Test Redis
docker exec redis redis-cli ping
# Expected: PONG

# Test PostgreSQL
docker exec postgres psql -U lab_admin -d customerdb -c "SELECT 1;"

# Test MongoDB
docker exec mongodb mongosh --username lab_admin --password changeme_in_production --eval "db.adminCommand('ping')"
```

### ✅ Success Criteria
- All four containers are running (`docker ps` shows 4 healthy containers)
- Each service responds to its health check command
- `terraform state list` shows all managed resources

---

## Lab 4: Containerizing the Applications

### Objective
Create Docker images for Angular, Java Spring Boot, and .NET ASP.NET Core applications.

> **Note:** In this lab, you'll create minimal "hello world" versions of each application. The focus is on Docker, not application logic.

### Tasks

#### 4.1 Angular Frontend — Multi-Stage Dockerfile

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 4.2 Java Spring Boot — Dockerfile

```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx384m", "-Xms256m", "-jar", "app.jar"]
```

#### 4.3 .NET ASP.NET Core — Dockerfile

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
COPY --from=build /app .
ENV DOTNET_GCHeapHardLimit=0x1E000000
EXPOSE 5000
ENTRYPOINT ["dotnet", "LabService.dll"]
```

### ✅ Success Criteria
- Each application builds into a Docker image successfully
- Images are reasonably sized (Angular < 50MB, Java < 300MB, .NET < 200MB)

---

## Lab 5: Deploying to Kubernetes

### Objective
Create Kubernetes manifests and deploy all three applications to the K3s cluster.

### Tasks

#### 5.1 Create Kubernetes Manifests

For each application, create:
- `Deployment` (with resource limits and health checks)
- `Service` (ClusterIP)
- `HorizontalPodAutoscaler` (min 1, max 2)
- `Ingress` (Traefik routing rules)

#### 5.2 Deploy

```bash
kubectl apply -f k8s/
kubectl get pods -w   # Watch pods come up
kubectl get svc
kubectl get ingress
```

#### 5.3 Verify

```bash
# Check all pods are running
kubectl get pods

# Check HPA status
kubectl get hpa

# Test endpoints via Ingress
curl http://<ubuntu-ip>/
curl http://<ubuntu-ip>/api/customers/health
curl http://<ubuntu-ip>/api/labs/health
```

### ✅ Success Criteria
- All pods are in `Running` state
- HPA shows current/target metrics
- All endpoints respond correctly via the Ingress

---

## Lab 6: Building the CI/CD Pipeline (Jenkins)

### Objective
Create Jenkins pipelines that automatically build, test, push, and deploy each application.

### Tasks

#### 6.1 Configure Jenkins
- Install Docker Pipeline and Kubernetes CLI plugins
- Add credentials for Docker registry and K3s kubeconfig
- Create a Multibranch Pipeline job for each application

#### 6.2 Create Jenkinsfile (Example: Customer Service)

```groovy
pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'docker.io/your-username'
        IMAGE_NAME = 'customer-service'
        K8S_NAMESPACE = 'default'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test') {
            steps {
                sh './mvnw clean package -DskipTests=false'
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    def image = docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}")
                    docker.withRegistry('', 'docker-hub-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }

        stage('Deploy to K3s') {
            steps {
                withKubeConfig([credentialsId: 'k3s-kubeconfig']) {
                    sh """
                        kubectl set image deployment/customer-service \
                            customer-service=${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} \
                            -n ${K8S_NAMESPACE}
                        kubectl rollout status deployment/customer-service -n ${K8S_NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful: ${IMAGE_NAME}:${BUILD_NUMBER}"
        }
        failure {
            echo "❌ Pipeline failed!"
        }
    }
}
```

### ✅ Success Criteria
- Jenkins pipeline triggers on code push
- Docker image is built and pushed to registry
- K3s deployment is updated with the new image
- Rolling update completes without downtime

---

## Lab 7: Testing & Chaos Engineering (Bonus)

### Objective
Test the resilience of the infrastructure.

### Exercises

1. **Kill a pod and watch HPA recover:**
   ```bash
   kubectl delete pod <customer-service-pod>
   kubectl get pods -w  # Watch Kubernetes recreate it
   ```

2. **Simulate high load and trigger HPA scale-up:**
   ```bash
   # From your MacBook, use a load testing tool
   hey -n 10000 -c 50 http://<ubuntu-ip>/api/customers/health
   kubectl get hpa -w  # Watch replicas scale from 1 → 2
   ```

3. **Stop a native service and observe application behavior:**
   ```bash
   docker stop redis
   # Watch how the Java/DotNet apps handle the Redis outage
   # Then bring it back:
   docker start redis
   ```

4. **Terraform destroy and recreate:**
   ```bash
   terraform destroy -auto-approve
   terraform apply -auto-approve
   # Verify all services come back healthy
   ```

### ✅ Success Criteria
- You understand how Kubernetes self-heals
- You've observed HPA scaling in action
- You know what happens when a native dependency goes down
- You can destroy and recreate infrastructure idempotently

---

## 🎓 Completion Checklist

When a trainee can check all of these boxes, they have completed the DevOps Training Lab:

- [ ] Provisioned a remote server using Ansible
- [ ] Deployed K3s and can manage it remotely with `kubectl`
- [ ] Provisioned stateful services using Terraform
- [ ] Built multi-stage Docker images for 3 different tech stacks
- [ ] Deployed applications to Kubernetes with resource limits and HPA
- [ ] Created CI/CD pipelines in Jenkins
- [ ] Understood networking between K8s pods and native Docker containers
- [ ] Performed basic chaos engineering and observed system resilience
- [ ] Can explain the architecture diagram and the role of every component

---

> **Congratulations!** You now have a working enterprise-grade microservices lab. 🚀
