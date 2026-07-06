# Step 10 — CI/CD Pipeline (Jenkins & GitOps)

> Set up Jenkins on the Developer Desktop to automate the build → push → Git commit lifecycle. Argo CD will handle the final pull into the cluster.

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
- **Git** — source code management
- **Pipeline** — Jenkinsfile support (usually pre-installed)

Restart Jenkins after installation.
*(Note: We no longer need the Kubernetes CLI plugin since we are using GitOps!)*

---

## 03 — Configure Credentials

Go to **Manage Jenkins → Credentials → Global → Add Credentials**:

### Gitea Credentials
Since Jenkins needs to commit and push changes back to the Gitea manifests repository, you need to add your Gitea credentials.
- **Kind:** Username with password
- **ID:** `gitea-credentials`
- **Username:** `admin` (or your Gitea username)
- **Password:** (your Gitea password)

*(Note: We no longer need the Kubeconfig credential in Jenkins since Jenkins does not talk to Kubernetes directly!)*

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
        GITEA_URL = "http://192.168.8.80:3000/admin"
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
                    sh """
                        docker build -t ${IMAGE}:${TAG} .
                        docker push ${IMAGE}:${TAG}
                        docker tag ${IMAGE}:${TAG} ${IMAGE}:latest
                        docker push ${IMAGE}:latest
                    """
                }
            }
        }

        stage('Update GitOps Manifests') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'gitea-credentials', passwordVariable: 'GITEA_PASS', usernameVariable: 'GITEA_USER')]) {
                    sh """
                        # Clone the manifests repository
                        git clone http://${GITEA_USER}:${GITEA_PASS}@192.168.8.80:3000/admin/devops-lab-manifests.git
                        
                        cd devops-lab-manifests
                        
                        # Configure Git
                        git config user.email "jenkins@devopslab.local"
                        git config user.name "Jenkins CI"
                        
                        # Update the image tag in the deployment file
                        sed -i 's|image: ${IMAGE}:.*|image: ${IMAGE}:${TAG}|g' k8s/customer-service/deployment.yaml
                        
                        # Commit and push
                        git add k8s/customer-service/deployment.yaml
                        git commit -m "Update customer-service image to tag ${TAG}"
                        git push origin main
                    """
                }
            }
        }
    }

    post {
        success { echo '✅ Pipeline completed! Argo CD will now sync the cluster.' }
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
5. **Repository URL:** `http://192.168.8.80:3000/admin/devops-lab-apps.git`
6. **Credentials:** `gitea-credentials`
7. **Script Path:** `src/customer-service/Jenkinsfile`
8. **Save**

Repeat for `lab-service` and `frontend` with adjusted paths.

---

## 06 — Run the Pipeline

1. Click **Build Now** on the `customer-service` job
2. Watch the stages execute: Build → Test → Docker Build & Push → Update GitOps Manifests
3. Verify in Gitea that the `devops-lab-manifests` repository has a new commit from Jenkins.
4. Verify in Argo CD that it detected the commit and began syncing the new pods in the cluster!

---

## 07 — Configure Gitea Webhooks

For automatic builds on code push:

1. In your Gitea `devops-lab-apps` repo: **Settings → Webhooks → Add Webhook → Gitea**
2. **Target URL:** `http://<dev-desktop-ip>:8080/gitea-webhook/post`
3. **HTTP Method:** `POST`
4. **Trigger On:** Push Events
5. In your Jenkins job config: Enable **Poll SCM** or **Gitea webhook trigger**

---

## ✅ Success Criteria

- [ ] Jenkins running and connected to Gitea
- [ ] Pipeline runs successfully and pushes a new image to Docker Registry
- [ ] Jenkins automatically commits the new image tag to the Gitea manifests repository
- [ ] Argo CD automatically detects the Git change and deploys the new image to K3s

---

## 🎓 Lab Complete!

Congratulations! You have built a true, enterprise-grade GitOps architecture:

- [x] Provisioned a Developer Desktop with all DevOps tools
- [x] Configured a remote Datacenter with Multipass VMs
- [x] Deployed a private Docker Registry & Dependency Cache
- [x] Deployed an on-premises Gitea server for Source Control
- [x] Installed and managed a Kubernetes cluster (K3s) with HPA
- [x] Automated CI with Jenkins
- [x] Automated CD with Argo CD (GitOps)
