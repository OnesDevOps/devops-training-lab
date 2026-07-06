# Source Code — Application Boilerplate

> This directory contains the source code for all three applications in the lab.

## Applications

| Folder | Technology | Description |
|--------|-----------|-------------|
| `frontend/` | Angular + Nginx | Single Page Application |
| `customer-service/` | Java 21 + Spring Boot 3 | Customer domain backend |
| `lab-service/` | .NET 8 + ASP.NET Core | Lab domain backend |

Each application includes:
- Source code boilerplate
- `Dockerfile` (multi-stage build)
- `Jenkinsfile` (CI/CD pipeline definition)

> Application code is created during [Step 9 — Deploy Applications](../infra/09-deploy-applications/).
