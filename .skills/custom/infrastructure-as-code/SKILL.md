# Infrastructure as Code

> Terraform and Pulumi patterns for cloud provisioning, state management, and environment parity for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `infrastructure-as-code`                                 |
| **Category**   | Observability & DevOps                                   |
| **Complexity** | High                                                     |
| **Complements**| `secret-management`, `docker-patterns`, `ci-cd-patterns` |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies infrastructure-as-code patterns for NodeJS-Starter-V1: Terraform modules for DigitalOcean/AWS provisioning, Pulumi TypeScript stacks for programmatic infrastructure, environment parity (dev/staging/prod), state management strategies, and CI/CD integration for automated deployments.

---

## When to Apply

### Positive Triggers

- Provisioning cloud infrastructure (databases, servers, networking)
- Ensuring environment parity between development and production
- Automating infrastructure deployment via CI/CD pipelines
- Managing cloud resources declaratively instead of via console clicks
- Setting up DigitalOcean App Platform or AWS resources

### Negative Triggers

- Docker container configuration (use `docker-patterns` skill)
- GitHub Actions workflow setup (use `ci-cd-patterns` skill)
- Secret management for environment variables (use `secret-management` skill)
- Application deployment to existing infrastructure (use deployment guides)

---

## Core Principles

### The Three Laws of IaC

1. **Declarative Over Imperative**: Define the desired state, not the steps to get there. The IaC tool calculates the diff and applies only what changed.
2. **Environments Are Identical**: Dev, staging, and prod use the same modules with different variables. Environment-specific hacks create deployment surprises.
3. **State Is Sacred**: Never manually modify infrastructure managed by IaC. All changes go through the code → plan → apply cycle. Manual changes cause state drift.

---

## Pattern 1: Terraform Module Structure

### Project Layout

```
infrastructure/
  modules/
    database/
      main.tf
      variables.tf
      outputs.tf
    app/
      main.tf
      variables.tf
      outputs.tf
    networking/
      main.tf
      variables.tf
      outputs.tf
  environments/
    dev/
      main.tf          # Uses modules with dev variables
      terraform.tfvars
    staging/
      main.tf
      terraform.tfvars
    prod/
      main.tf
      terraform.tfvars
  backend.tf           # Remote state configuration
```

---

## Pattern 2: DigitalOcean App Platform (Terraform)

### Provisioning the Full Stack

```hcl
# infrastructure/modules/app/main.tf

resource "digitalocean_app" "starter" {
  spec {
    name   = var.app_name
    region = "syd1"  # Sydney, Australia

    # Next.js Frontend
    service {
      name               = "web"
      source_dir         = "/apps/web"
      build_command       = "pnpm build"
      run_command         = "pnpm start"
      http_port           = 3000
      instance_count      = var.web_instances
      instance_size_slug  = var.web_instance_size

      env {
        key   = "NEXT_PUBLIC_API_URL"
        value = "${digitalocean_app.starter.live_url}/api"
      }
    }

    # FastAPI Backend
    service {
      name               = "backend"
      source_dir         = "/apps/backend"
      build_command       = "pip install -r requirements.txt"
      run_command         = "uvicorn src.api.main:app --host 0.0.0.0 --port 8000"
      http_port           = 8000
      instance_count      = var.backend_instances
      instance_size_slug  = var.backend_instance_size
    }

    # PostgreSQL Database
    database {
      name    = "db"
      engine  = "PG"
      version = "15"
    }

    # Redis
    database {
      name    = "cache"
      engine  = "REDIS"
      version = "7"
    }
  }
}
```

### Variables

```hcl
# infrastructure/modules/app/variables.tf

variable "app_name" {
  type        = string
  description = "Application name"
}

variable "web_instances" {
  type    = number
  default = 1
}

variable "web_instance_size" {
  type    = string
  default = "basic-xxs"
}

variable "backend_instances" {
  type    = number
  default = 1
}

variable "backend_instance_size" {
  type    = string
  default = "basic-xxs"
}
```

---

## Pattern 3: Environment Variables via Terraform

### Injecting Secrets Safely

```hcl
# Use terraform.tfvars for non-sensitive values
# Use environment variables or Terraform Cloud for secrets

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "anthropic_api_key" {
  type      = string
  sensitive = true
  default   = ""  # Optional — falls back to Ollama
}

resource "digitalocean_app" "starter" {
  spec {
    service {
      name = "backend"

      env {
        key   = "JWT_SECRET_KEY"
        value = var.jwt_secret
        type  = "SECRET"
      }

      env {
        key   = "ANTHROPIC_API_KEY"
        value = var.anthropic_api_key
        type  = "SECRET"
      }

      env {
        key   = "AI_PROVIDER"
        value = var.anthropic_api_key != "" ? "anthropic" : "ollama"
      }
    }
  }
}
```

**Complements**: `secret-management` skill — Terraform variables marked `sensitive = true` are never shown in plan output. Pair with the Pydantic settings validation pattern for runtime checks.

---

## Pattern 4: Remote State Management

### Terraform Cloud or S3 Backend

```hcl
# infrastructure/backend.tf

terraform {
  backend "s3" {
    bucket         = "nodejs-starter-tfstate"
    key            = "env/${terraform.workspace}/terraform.tfstate"
    region         = "ap-southeast-2"  # Sydney
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

**Rule**: Never store Terraform state locally in production. Use a remote backend with locking (DynamoDB for S3, built-in for Terraform Cloud) to prevent concurrent modifications.

---

## Pattern 5: Pulumi TypeScript Alternative

### Programmatic Infrastructure

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";

const config = new pulumi.Config();

const db = new digitalocean.DatabaseCluster("postgres", {
  engine: "pg",
  version: "15",
  size: "db-s-1vcpu-1gb",
  region: "syd1",
  nodeCount: 1,
});

const redis = new digitalocean.DatabaseCluster("redis", {
  engine: "redis",
  version: "7",
  size: "db-s-1vcpu-1gb",
  region: "syd1",
  nodeCount: 1,
});

export const dbUri = db.uri;
export const redisUri = redis.uri;
```

**Use case**: When the team prefers TypeScript over HCL. Pulumi uses the same language as the application, reducing context switching.

---

## Pattern 6: CI/CD Integration

### GitHub Actions Terraform Pipeline

```yaml
# .github/workflows/infrastructure.yml
name: Infrastructure
on:
  push:
    paths: ["infrastructure/**"]
    branches: [main]
  pull_request:
    paths: ["infrastructure/**"]

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
        working-directory: infrastructure/environments/${{ github.ref == 'refs/heads/main' && 'prod' || 'staging' }}
      - run: terraform plan -out=tfplan
        working-directory: infrastructure/environments/${{ github.ref == 'refs/heads/main' && 'prod' || 'staging' }}

  apply:
    needs: plan
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: terraform apply -auto-approve tfplan
```

**Complements**: `ci-cd-patterns` skill — infrastructure changes deploy through the same CI/CD pipeline as application code.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Manual console changes | State drift, unreproducible | All changes through IaC |
| Local state files | Lost, no locking, no collaboration | Remote backend with locking |
| Hardcoded values | Cannot reuse across environments | Variables and modules |
| No plan before apply | Unexpected destructive changes | Always `plan` then `apply` |
| Secrets in `.tfvars` | Committed to git | Use `sensitive` vars + Terraform Cloud |
| Single monolithic config | Hard to reason about, slow plans | Modular structure |

---

## Checklist

Before merging infrastructure-as-code changes:

- [ ] Terraform module structure with `modules/` and `environments/`
- [ ] DigitalOcean App Platform config for web + backend + database
- [ ] Variables with `sensitive = true` for secrets
- [ ] Remote state backend with locking
- [ ] Environment parity (dev/staging/prod use same modules)
- [ ] CI/CD pipeline for automated plan and apply

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Infrastructure as Code Implementation

**Tool**: [Terraform / Pulumi / both]
**Cloud**: [DigitalOcean / AWS / multi-cloud]
**State Backend**: [S3 / Terraform Cloud / local]
**Environments**: [dev, staging, prod]
**CI/CD**: [GitHub Actions / manual]
**Region**: [syd1 / ap-southeast-2]
```
