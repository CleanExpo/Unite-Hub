# Docker & CLI Setup for DigitalOcean Integration

**Status**: Docker installed, daemon needs to be started
**Purpose**: Enable Docker containerization + DigitalOcean CLI for Synthex deployment
**Time to Complete**: 10-15 minutes

---

## 📋 Current Status

✅ **Docker installed**: Version 29.0.1
⚠️ **Docker daemon**: Not running (needs to be started)
⏳ **DigitalOcean CLI**: Not installed yet

---

## 🚀 Step 1: Start Docker Daemon

### Windows (Docker Desktop)

**Option A: Using GUI**
1. Open **Docker Desktop** application
2. Wait for Docker icon in taskbar to show green checkmark
3. Verify: Open PowerShell and run `docker ps`
4. Expected: Should show container list (even if empty)

**Option B: Using PowerShell (Admin)**
```powershell
# Start Docker Desktop service
net start docker

# Or if using WSL2 (Windows Subsystem for Linux)
wsl.exe -d Docker-Desktop -e sh -c "service docker start"
```

**Option C: Using WSL2 (Recommended)**
```bash
# If using WSL2 backend
wsl.exe -d docker-desktop -e sysctl -w vm.max_map_count=262144
docker run hello-world  # Test it works
```

### Verify Docker is Running
```bash
# Should work without errors:
docker ps

# Expected output:
# CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
# (empty list is fine)
```

---

## 🔧 Step 2: Install DigitalOcean CLI (doctl)

### Windows (PowerShell)

**Option A: Using Chocolatey (Recommended)**
```powershell
# If you have Chocolatey installed:
choco install doctl
```

**Option B: Using scoop**
```powershell
# If you have scoop installed:
scoop install doctl
```

**Option C: Direct Download**
1. Go to: https://github.com/digitalocean/doctl/releases
2. Download: `doctl-windows-amd64.msi` (for Windows)
3. Run the installer
4. Follow on-screen instructions

**Option D: Using npm (Alternative)**
```bash
npm install -g @digitalocean/doctl
```

### Verify Installation
```bash
doctl version
# Expected: doctl version X.XX.X

doctl auth init
# Follow prompts to add your API token
```

---

## 🔑 Step 3: Authenticate doctl

### Connect doctl to Your DigitalOcean Account

```bash
# Start authentication (interactive)
doctl auth init

# You'll be prompted:
# Please enter your DigitalOcean access token:
# Paste your API token (from previous step)

# Verify it worked:
doctl account get
# Should show your account info
```

### Set Default Context (Optional)
```bash
# List all contexts
doctl auth list

# Set as default (if you have multiple)
doctl auth switch --context your-context-name
```

---

## 🐳 Step 4: Docker Configuration for Synthex

### Create Dockerfile for Synthex

If deploying via Docker locally or to DigitalOcean, create `Dockerfile`:

```dockerfile
# Dockerfile - in project root
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3008

# Start server
CMD ["npm", "run", "start"]
```

### Create docker-compose.yml (Optional)

For local development with Supabase mock:

```yaml
version: '3.8'

services:
  synthex:
    build: .
    ports:
      - "3008:3008"
    environment:
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      NEXTAUTH_URL: http://localhost:3008
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
    volumes:
      - .:/app
      - /app/node_modules
    restart: unless-stopped
```

---

## 🚀 Step 5: Deployment Options with Docker + CLI

### Option A: Deploy to DigitalOcean via CLI

```bash
# 1. Create app specification
cat > app.yaml << 'EOF'
name: synthex-social
services:
  - name: api
    github:
      repo: YOUR_USERNAME/Unite-Hub
      branch: main
    build_command: npm run build
    run_command: npm run start
    envs:
      - key: NEXT_PUBLIC_SUPABASE_URL
        value: ${SUPABASE_URL}
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        value: ${SUPABASE_ANON_KEY}
      # ... add other env vars
    http_port: 3008
EOF

# 2. Create the app
doctl apps create --spec app.yaml

# 3. Check status
doctl apps list
doctl apps get your-app-id --no-header

# 4. View logs
doctl apps logs your-app-id
```

### Option B: Use Docker Locally, Then Push to DigitalOcean

```bash
# 1. Build Docker image locally
docker build -t synthex-social:latest .

# 2. Test locally
docker run -p 3008:3008 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e ANTHROPIC_API_KEY=your-key \
  synthex-social:latest

# 3. Test at: http://localhost:3008

# 4. When ready, push to DigitalOcean Container Registry
# (see next section)
```

### Option C: Use DigitalOcean Container Registry

```bash
# 1. Create container registry
doctl registry create synthex --region nyc3

# 2. Get registry URL
doctl registry get synthex

# 3. Build and push image
docker build -t registry.digitalocean.com/synthex/synthex-social:latest .
docker push registry.digitalocean.com/synthex/synthex-social:latest

# 4. Deploy from registry
doctl apps create --spec app.yaml
# (Update app.yaml to use registry image)
```

---

## 📊 Available doctl Commands

### Apps Management
```bash
doctl apps list                    # List all apps
doctl apps get APP_ID             # Get app details
doctl apps create --spec app.yaml # Create new app
doctl apps update APP_ID --spec app.yaml  # Update app
doctl apps delete APP_ID          # Delete app
doctl apps logs APP_ID            # View deployment logs
doctl apps deployments list APP_ID # List deployments
doctl apps spec get APP_ID        # Get app configuration
```

### Droplets (VPS)
```bash
doctl compute droplet list        # List all droplets
doctl compute droplet create --region nyc3 --image ubuntu-22-04-x64 my-droplet
doctl compute droplet delete DROPLET_ID
doctl compute droplet-action reboot DROPLET_ID
```

### Databases
```bash
doctl databases list              # List databases
doctl databases create --engine pg synthex-db
doctl databases user add db-id username
```

### Domains & DNS
```bash
doctl compute domain list         # List domains
doctl compute domain records list DOMAIN
doctl compute domain records create DOMAIN --type CNAME --name www --data example.com
```

### Container Registry
```bash
doctl registry list               # List registries
doctl registry create NAME        # Create registry
doctl registry delete NAME        # Delete registry
```

---

## 🔐 Security Best Practices

### Store Configuration Safely
```bash
# ❌ DON'T hardcode credentials in files
doctl auth init  # Store token securely

# ✅ DO use environment variables
export DIGITALOCEAN_ACCESS_TOKEN=your_token
doctl account get
```

### Docker Secrets
```bash
# For production, use Docker secrets instead of env vars
docker secret create db_password /path/to/secret

# Then reference in docker-compose:
# secrets:
#   db_password:
#     external: true
```

---

## 🧪 Test Everything

### Step 1: Verify Docker
```bash
docker --version
docker ps          # Should work
docker run hello-world  # Quick test
```

### Step 2: Verify doctl
```bash
doctl version      # Should show version
doctl auth list    # Should show authenticated context
doctl account get  # Should show your account info
```

### Step 3: Test Docker Build
```bash
cd d:\Unite-Hub

# Build image
docker build -t synthex-test:latest .

# Should complete without errors
docker images | grep synthex-test
```

### Step 4: Test Docker Run (Optional)
```bash
# Run image locally (if all env vars available)
docker run -p 3008:3008 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e ANTHROPIC_API_KEY=your-key \
  synthex-test:latest

# Test at: http://localhost:3008
```

---

## 📝 Dockerfile & docker-compose Files

### Create Dockerfile
```bash
cat > d:\Unite-Hub\Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3008
CMD ["npm", "run", "start"]
EOF
```

### Create docker-compose.yml
```bash
cat > d:\Unite-Hub\docker-compose.yml << 'EOF'
version: '3.8'
services:
  synthex:
    build: .
    ports:
      - "3008:3008"
    environment:
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      NEXTAUTH_URL: http://localhost:3008
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
    restart: unless-stopped
EOF
```

---

## 🛠️ Troubleshooting

### Docker daemon not running
```bash
# Windows: Start Docker Desktop app
# Or in PowerShell (admin):
net start docker

# WSL2:
wsl.exe --shutdown  # Restart WSL
```

### doctl auth errors
```bash
# Re-authenticate
doctl auth init

# List contexts
doctl auth list

# Use specific context
doctl auth switch --context your-context
```

### Docker image build fails
```bash
# Clear Docker cache
docker system prune -a

# Rebuild
docker build -t synthex:latest . --no-cache
```

### Port 3008 already in use
```bash
# Kill process using port
# Windows PowerShell:
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3008).OwningProcess

# Or use different port:
docker run -p 3009:3008 synthex:latest
```

---

## 📚 Resources

**Docker Docs**:
- Docker CLI: https://docs.docker.com/engine/reference/commandline/
- docker-compose: https://docs.docker.com/compose/

**DigitalOcean**:
- doctl docs: https://docs.digitalocean.com/reference/doctl/
- Docker on DO: https://docs.digitalocean.com/products/container-registry/
- App Platform: https://docs.digitalocean.com/products/app-platform/

**Guides**:
- Docker getting started: https://docker.com/get-started/
- DO CLI setup: https://docs.digitalocean.com/reference/doctl/how-to/install/

---

## ✅ Checklist

- [ ] Docker daemon started
- [ ] `docker ps` works without errors
- [ ] doctl installed (`doctl version` works)
- [ ] doctl authenticated (`doctl account get` works)
- [ ] Dockerfile created in project root
- [ ] docker-compose.yml created (optional)
- [ ] Docker image builds: `docker build -t synthex:latest .`
- [ ] Ready to deploy!

---

## 🚀 Next Steps

### To Deploy with Docker + DigitalOcean CLI:

1. **Start Docker daemon** (this section)
2. **Install and authenticate doctl** (this section)
3. **Create Dockerfile** (included above)
4. **Build image locally**: `docker build -t synthex:latest .`
5. **Deploy to DigitalOcean**:
   ```bash
   doctl apps create --spec app.yaml
   ```

### Or use the MCP integration:
- Ask Claude: "Deploy synthex using Docker and DigitalOcean CLI"
- Claude will automate the entire process

---

**Status**: ✅ Docker installed, ready to configure

**Next**: Start Docker Desktop and run `doctl auth init` with your API token!

