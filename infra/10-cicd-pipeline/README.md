# Step 10 — CI/CD Pipeline (Jenkins)

> Set up Jenkins on the Developer Desktop to automate the full build → push → deploy lifecycle. This is the capstone exercise.

---

## 01 — Verify Jenkins is Running

Jenkins was installed in Step 0 (Developer Workstation).

```bash
systemctl status jenkins
# Access at http://localhost:8080
```

---

## 02 — Install Required Jenkins Plugins

Go to **Manage Jenkins → Plugins → Available**. Install:

- **Docker Pipeline** — build Docker images in Jenkinsfiles
- **Kubernetes CLI** — run kubectl from pipelines
- **Git** — source code management
- **Pipeline** — Jenkinsfile support (usually pre-installed)

Restart Jenkins after installation.

---

## 03 — Configure Credentials

Go to **Manage Jenkins → Credentials → Global → Add Credentials**:

### Harbor Registry Credentials
- **Kind:** Username with password
- **ID:** `harbor-registry`
- **Username:** `admin`
- **Password:** (your Harbor password)

### Datacenter SSH Key
- **Kind:** SSH Username with private key
- **ID:** `datacenter-ssh`
- **Username:** (your datacenter user)
- **Private key:** Enter directly → paste contents of `~/.ssh/devops_lab_key`

### Kubeconfig
- **Kind:** Secret file
- **ID:** `kubeconfig`
- **File:** Upload `~/.kube/config`

---

## 04 — Create Jenkinsfile for Customer Service

Create `src/customer-service/Jenkinsfile`:

```groovy
pipeline {
    agent any

    environment {
        REGISTRY = '<registry-ip>'
        IMAGE = "${REGISTRY}/devops-lab/customer-service"
        TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Build') {
            steps {
                dir('src/customer-service') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Test') {
            steps {
                dir('src/customer-service') {
                    sh 'mvn test'
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                dir('src/customer-service') {
                    withCredentials([usernamePassword(
                        credentialsId: 'harbor-registry',
                        usernameVariable: 'USER',
                        passwordVariable: 'PASS'
                    )]) {
                        sh """
                            docker login ${REGISTRY} -u ${USER} -p ${PASS}
                            docker build -t ${IMAGE}:${TAG} .
                            docker push ${IMAGE}:${TAG}
                            docker tag ${IMAGE}:${TAG} ${IMAGE}:latest
                            docker push ${IMAGE}:latest
                        """
                    }
                }
            }
        }

        stage('Deploy to K3s') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    sh """
                        kubectl set image deployment/customer-service \
                            customer-service=${IMAGE}:${TAG} \
                            -n devops-lab \
                            --kubeconfig=${KUBECONFIG}
                        kubectl rollout status deployment/customer-service \
                            -n devops-lab \
                            --timeout=120s \
                            --kubeconfig=${KUBECONFIG}
                    """
                }
            }
        }
    }

    post {
        success { echo '✅ Pipeline completed successfully!' }
        failure { echo '❌ Pipeline failed.' }
    }
}
```

---

## 05 — Create the Jenkins Job

1. **New Item → Pipeline**
2. **Name:** `customer-service`
3. **Pipeline Definition:** Pipeline script from SCM
4. **SCM:** Git
5. **Repository URL:** `https://github.com/OnesDevOps/devops-training-lab.git`
6. **Script Path:** `src/customer-service/Jenkinsfile`
7. **Save**

Repeat for `lab-service` and `frontend` with adjusted paths.

---

## 06 — Run the Pipeline

1. Click **Build Now** on the `customer-service` job
2. Watch the stages execute: Build → Test → Docker Build & Push → Deploy
3. Verify:

```bash
kubectl get pods -n devops-lab
kubectl describe deployment customer-service -n devops-lab | grep Image
```

---

## 07 — Configure Git Webhooks (Optional)

For automatic builds on push:

1. In your GitHub repo: **Settings → Webhooks → Add webhook**
2. **Payload URL:** `http://<dev-desktop-ip>:8080/github-webhook/`
3. **Content type:** `application/json`
4. **Events:** Just the push event
5. In Jenkins job config: Enable **GitHub hook trigger for GITScm polling**

---

## ✅ Success Criteria

- [ ] Jenkins running with all required plugins
- [ ] Credentials configured (Harbor, SSH, Kubeconfig)
- [ ] Jenkinsfile created for each application
- [ ] Pipeline runs successfully: build → push → deploy
- [ ] New image versions visible in Harbor after each build
- [ ] K3s deployment updated automatically

---

## 🎓 Lab Complete!

Congratulations! You have:

- [x] Provisioned a Developer Desktop with all DevOps tools
- [x] Configured a remote Datacenter with Docker
- [x] Deployed a private Container Registry (Harbor)
- [x] Set up a Dependency Cache (Nexus)
- [x] Installed and managed a Kubernetes cluster (K3s)
- [x] Deployed stateful data services (Kafka, Redis, PostgreSQL, MongoDB)
- [x] Built, containerized, and deployed 3 microservices
- [x] Automated everything with Jenkins CI/CD pipelines
- [x] Understood networking between K8s pods and native Docker containers

> **You now have a fully operational enterprise-grade microservices lab.** 🚀
