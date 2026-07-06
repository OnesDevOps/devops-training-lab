# Step 8 — MongoDB

> Deploy MongoDB on the Datacenter as a Docker container. Used by the .NET Lab Service for flexible document data.

---

## 01 — Deploy MongoDB on `db-node-1`

Because our databases run across multiple dedicated Multipass VMs, we will deploy MongoDB directly onto `db-node-1` using Docker.

Run the following command from the **Developer Desktop** to launch MongoDB via SSH:

```bash
# Replace 10.202.73.32 with the actual IP of db-node-1
ssh ubuntu@10.202.73.32 '
  docker run -d \
    --name mongodb \
    --restart unless-stopped \
    -p 27017:27017 \
    -e MONGO_INITDB_ROOT_USERNAME=lab_admin \
    -e MONGO_INITDB_ROOT_PASSWORD=changeme_in_production \
    -v mongodata:/data/db \
    mongo:7.0 \
    --wiredTigerCacheSizeGB 0.25
'
```

---

## 02 — Verify

```bash
ssh ubuntu@10.202.73.32 "docker exec mongodb mongosh -u lab_admin -p changeme_in_production --authenticationDatabase admin --eval 'db.version()'"
```

---

## 03 — Create Initial Collection (Optional)

```bash
ssh ubuntu@10.202.73.32 "docker exec -i mongodb mongosh -u lab_admin -p changeme_in_production --authenticationDatabase admin" << 'JS'
use labdb
db.labs.insertOne({
    name: "DevOps Training Lab",
    type: "Environment",
    status: "Active",
    created_at: new Date()
});
JS
```

---

## ✅ Success Criteria

- [ ] MongoDB container running
- [ ] Can connect with credentials
- [ ] Database `labdb` exists

> **Next →** [09 — Deploy Applications](../09-deploy-applications/)
