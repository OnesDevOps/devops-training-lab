# Step 7 — PostgreSQL

> Deploy PostgreSQL on the Datacenter as a Docker container. Used by the Java Spring Boot Customer Service for structured data.

---

## 01 — Deploy with Terraform

Create `infra/07-postgresql/terraform/postgresql.tf`:

```hcl
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
  ]

  command = [
    "postgres",
    "-c", "shared_buffers=128MB",
    "-c", "max_connections=20",
  ]

  volumes {
    volume_name    = docker_volume.pgdata.name
    container_path = "/var/lib/postgresql/data"
  }

  memory = 300

  networks_advanced {
    name = docker_network.lab_net.name
  }

  restart = "unless-stopped"
}
```

### Apply

```bash
cd infra/07-postgresql/terraform
terraform init && terraform apply
```

---

## 02 — Verify

```bash
ssh datacenter "docker exec postgres psql -U lab_admin -d customerdb -c 'SELECT version();'"
```

---

## 03 — Create Initial Schema (Optional)

```bash
ssh datacenter "docker exec -i postgres psql -U lab_admin -d customerdb" << 'SQL'
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SQL
```

---

## ✅ Success Criteria

- [ ] PostgreSQL container running
- [ ] Can connect and run queries
- [ ] Database `customerdb` exists

> **Next →** [08 — MongoDB](../08-mongodb/)
