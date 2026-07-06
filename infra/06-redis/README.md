# Step 6 — Redis

> Deploy Redis on the Datacenter as a Docker container. Used as a shared cache between the Java and .NET backend services.

---

## 01 — Deploy Redis on `db-node-1`

Because our databases run across multiple dedicated Multipass VMs, we will deploy Redis directly onto `db-node-1` using Docker.

Run the following command from the **Developer Desktop** to launch Redis via SSH:

```bash
# Replace 10.202.73.32 with the actual IP of db-node-1
ssh ubuntu@10.202.73.32 '
  docker run -d \
    --name redis \
    --restart unless-stopped \
    -p 6379:6379 \
    -v redis_data:/data \
    redis:7-alpine \
    redis-server --save 60 1 --loglevel warning
'
```

---

## 02 — Verify

```bash
ssh ubuntu@10.202.73.32 "docker exec -it redis redis-cli ping"
# Expected output: PONG
```

---

## ✅ Success Criteria

- [ ] Redis container running
- [ ] `redis-cli ping` returns PONG

> **Next →** [07 — PostgreSQL](../07-postgresql/)
