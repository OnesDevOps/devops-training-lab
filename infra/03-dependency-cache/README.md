# Step 3 — Dependency Cache (Debian 12 Minimal VM)

> Deploy a Nexus Repository Manager instance on an Debian 12 Minimal VM to cache Maven, npm, and NuGet dependencies. Build tools on the Developer Desktop fetch dependencies through Nexus, which caches them locally for speed and reliability.

---

## Overview

| Setting | Value |
|---------|-------|
| VM Host | MacBook (UTM) |
| OS | Debian 12 Minimal |
| RAM | 1.5 GB |
| CPU | 1 core |
| Disk | 60 GB (cached artifacts) |
| Network | Bridged (reachable from Developer Desktop and Datacenter) |
| Software | Sonatype Nexus Repository Manager OSS |

---

## 01 — Create the Debian VM in UTM

1. UTM → **Create New VM → Virtualize → Linux** → Debian 12 netinst ISO
2. Assign: 1.5 GB RAM, 1 core, 60 GB disk
3. Install Debian (minimal, no desktop environment)
4. Install Docker:

```bash
sudo apt update && sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

Note the VM's IP:
```bash
ip addr show eth0 | grep "inet "
```
> **Replace `<cache-ip>` with this IP throughout.**

---

## 02 — Deploy Nexus Repository Manager

### 2.1 Create Data Directory

```bash
mkdir -p /opt/nexus-data
chown -R 200:200 /opt/nexus-data
```

### 2.2 Run Nexus Container

```bash
docker run -d \
  --name nexus \
  --restart unless-stopped \
  -p 8081:8081 \
  -v /opt/nexus-data:/nexus-data \
  -e INSTALL4J_ADD_VM_PARAMS="-Xms512m -Xmx768m" \
  sonatype/nexus3:latest
```

> **Memory Note:** Nexus is Java-based. We cap it at 768 MB heap to stay within the 1.5 GB VM budget.

### 2.3 Wait for Startup (~2-3 minutes)

```bash
docker logs -f nexus
# Wait for: "Started Sonatype Nexus OSS"
```

### 2.4 Get Admin Password

```bash
docker exec nexus cat /nexus-data/admin.password
echo ""
```

### 2.5 Initial Setup

1. Open `http://<cache-ip>:8081`
2. Sign in: `admin` / (password from above)
3. Set new admin password
4. **Disable anonymous access** (confidential environment)

---

## 03 — Create Maven Proxy Repository

Caches Java/Spring Boot dependencies from Maven Central.

1. **Settings (⚙️) → Repositories → Create Repository**
2. Select **maven2 (proxy)**
3. Configure:
   - **Name:** `maven-central`
   - **Remote Storage:** `https://repo1.maven.org/maven2/`
   - **Version Policy:** Release
   - **Blob Store:** default
4. **Create**

---

## 04 — Create npm Proxy Repository

Caches Angular dependencies from npmjs.org.

1. **Create Repository → npm (proxy)**
2. Configure:
   - **Name:** `npm-registry`
   - **Remote Storage:** `https://registry.npmjs.org/`
3. **Create**

---

## 05 — Create NuGet Proxy Repository

Caches .NET dependencies from NuGet.org.

1. **Create Repository → nuget (proxy)**
2. Configure:
   - **Name:** `nuget-gallery`
   - **Remote Storage:** `https://api.nuget.org/v3/index.json`
   - **Protocol Version:** NuGet V3
3. **Create**

---

## 06 — Configure Build Tools on Developer Desktop

### Maven (Java Spring Boot)

Create `~/.m2/settings.xml`:

```xml
<settings>
  <mirrors>
    <mirror>
      <id>nexus</id>
      <mirrorOf>central</mirrorOf>
      <url>http://<cache-ip>:8081/repository/maven-central/</url>
    </mirror>
  </mirrors>
</settings>
```

Test:
```bash
cd /path/to/customer-service
mvn dependency:resolve   # First run hits Maven Central via Nexus, subsequent runs are cached
```

### npm (Angular)

```bash
npm config set registry http://<cache-ip>:8081/repository/npm-registry/

# Test
npm install   # First run caches, subsequent runs are instant
```

### NuGet (.NET)

```bash
dotnet nuget add source http://<cache-ip>:8081/repository/nuget-gallery/v3/index.json \
  --name nexus

# Test
dotnet restore   # Dependencies fetched via Nexus
```

---

## 07 — Verify Caching Works

1. Build one of the applications (e.g., `mvn clean package`)
2. In Nexus UI → **Browse → maven-central** → you should see cached `.jar` files
3. Delete your local `~/.m2/repository` and rebuild — it should be much faster (pulling from Nexus cache, not the internet)

---

## ✅ Success Criteria

- [ ] Debian VM running with Nexus accessible at `http://<cache-ip>:8081`
- [ ] Maven proxy repository created and working
- [ ] npm proxy repository created and working
- [ ] NuGet proxy repository created and working
- [ ] Developer Desktop build tools configured to use Nexus
- [ ] Second build is noticeably faster (cached dependencies)

---

> **Next →** [04 — Kubernetes](../04-kubernetes/)
