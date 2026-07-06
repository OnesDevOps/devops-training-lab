# Step 8 — MongoDB

> Deploy MongoDB on the Datacenter as a Docker container. Used by the .NET Lab Service for flexible document data.

---

## 01 — Deploy with Terraform

Create `infra/08-mongodb/terraform/mongodb.tf`:

```hcl
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

  memory = 400

  networks_advanced {
    name = docker_network.lab_net.name
  }

  restart = "unless-stopped"
}
```

### Apply

```bash
cd infra/08-mongodb/terraform
terraform init && terraform apply
```

---

## 02 — Verify

```bash
ssh datacenter "docker exec mongodb mongosh \
  --username lab_admin --password changeme_in_production \
  --eval 'db.adminCommand({ping: 1})'"
```

---

## 03 — Create Initial Collection (Optional)

```bash
ssh datacenter "docker exec mongodb mongosh \
  --username lab_admin --password changeme_in_production \
  labdb --eval '
    db.createCollection(\"lab_results\");
    db.lab_results.insertOne({test: \"connectivity\", status: \"ok\", ts: new Date()});
    db.lab_results.find();
  '"
```

---

## ✅ Success Criteria

- [ ] MongoDB container running
- [ ] Can connect with credentials
- [ ] Database `labdb` exists

> **Next →** [09 — Deploy Applications](../09-deploy-applications/)
