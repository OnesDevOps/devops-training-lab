# Step 7 — PostgreSQL

> Deploy PostgreSQL on the Datacenter as a Docker container. Used by the Java Spring Boot Customer Service for structured data.

---

## 01 — Deploy PostgreSQL on `db-node-1`

Because our databases run across multiple dedicated Multipass VMs, we will deploy PostgreSQL directly onto `db-node-1` using Docker.

Run the following command from the **Developer Desktop** to launch Postgres via SSH:

```bash
# Replace 10.202.73.32 with the actual IP of db-node-1
ssh ubuntu@10.202.73.32 '
  docker run -d \
    --name postgres \
    --restart unless-stopped \
    -p 5432:5432 \
    -e POSTGRES_DB=customerdb \
    -e POSTGRES_USER=lab_admin \
    -e POSTGRES_PASSWORD=changeme_in_production \
    -v pgdata:/var/lib/postgresql/data \
    postgres:16-alpine \
    postgres -c shared_buffers=128MB -c max_connections=20
'
```

---

## 02 — Verify

```bash
ssh ubuntu@10.202.73.32 "docker exec postgres psql -U lab_admin -d customerdb -c 'SELECT version();'"
```

---

## 03 — Create Initial Schema (Optional)

```bash
ssh ubuntu@10.202.73.32 "docker exec -i postgres psql -U lab_admin -d customerdb" << 'SQL'
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
