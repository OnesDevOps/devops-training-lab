# Step 11 — MinIO Object Storage

> Install a single-node MinIO instance on `db-node-2` to act as an S3-compatible object storage server for the microservices.

---

## 01 — Overview

MinIO provides an AWS S3-compatible API. In an enterprise environment, applications rarely save files to local disk; they save them to object storage. We will deploy MinIO via Docker on `db-node-2`.

---

## 01 — Deploy MinIO on `db-node-2`

Because our databases run across multiple dedicated Multipass VMs, we will deploy MinIO directly onto `db-node-2` using Docker.

Run the following command from the **Developer Desktop** to launch MinIO via SSH:

```bash
# Replace 10.202.73.133 with the actual IP of db-node-2
ssh ubuntu@10.202.73.133 '
  docker run -d \
    --name minio \
    --restart unless-stopped \
    -p 9000:9000 \
    -p 9001:9001 \
    -e MINIO_ROOT_USER=admin \
    -e MINIO_ROOT_PASSWORD=changeme_in_production \
    -v minio_data:/data \
    minio/minio:latest \
    server /data --console-address ":9001"
'
```

---

## 03 — Verify MinIO

Check that the container is running:
```bash
docker ps | grep minio
```

You should see MinIO listening on ports `9000` (API) and `9001` (Web Console).

---

## 04 — Access the Console

From your Developer Desktop (or browser), open the MinIO web console:

`http://<db-node-2-ip>:9001`

- **Username**: `admin`
- **Password**: `password123`

---

## ✅ Success Criteria

- [ ] MinIO is running on `db-node-2`
- [ ] You can log into the MinIO Console via the browser
- [ ] Port `9000` is accessible from the Kubernetes worker nodes
