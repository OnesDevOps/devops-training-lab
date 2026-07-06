# Step 6 — Redis

> Deploy Redis on the Datacenter as a Docker container. Used as a shared cache between the Java and .NET backend services.

---

## 01 — Deploy with Terraform

Create `infra/06-redis/terraform/redis.tf`:

```hcl
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

  memory = 300

  networks_advanced {
    name = docker_network.lab_net.name
  }

  restart = "unless-stopped"
}
```

### Apply

```bash
cd infra/06-redis/terraform
terraform init && terraform apply
```

---

## 02 — Verify

```bash
ssh datacenter "docker exec redis redis-cli ping"
# Expected: PONG

ssh datacenter "docker exec redis redis-cli info memory | head -5"
```

---

## ✅ Success Criteria

- [ ] Redis container running
- [ ] `redis-cli ping` returns PONG

> **Next →** [07 — PostgreSQL](../07-postgresql/)
