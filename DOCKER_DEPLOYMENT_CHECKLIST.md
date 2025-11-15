# Docker Deployment Checklist - Unite-Hub

Complete pre-flight checklist before deploying Unite-Hub with Docker.

## Pre-Deployment Checklist

### 1. System Requirements

- [ ] Docker Desktop installed (v20.10+)
- [ ] Docker Compose installed (v2.0+)
- [ ] Minimum 4GB RAM available
- [ ] Minimum 10GB disk space available
- [ ] Ports 3008, 6379 available (or custom ports configured)

### 2. Environment Configuration

- [ ] `.env.local` file created from `.env.example`
- [ ] `NEXTAUTH_SECRET` set (generate with `openssl rand -base64 32`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `ANTHROPIC_API_KEY` configured
- [ ] `GOOGLE_CLIENT_ID` configured
- [ ] `GOOGLE_CLIENT_SECRET` configured
- [ ] `GOOGLE_CALLBACK_URL` matches your domain/localhost
- [ ] All placeholder values replaced with actual credentials

### 3. Docker Files

- [ ] `Dockerfile` exists and reviewed
- [ ] `docker-compose.yml` exists and reviewed
- [ ] `.dockerignore` exists
- [ ] `next.config.mjs` has `output: 'standalone'`
- [ ] Health check endpoint exists: `src/app/api/health/route.ts`

### 4. Helper Scripts

- [ ] `docker/start.sh` exists and executable (Linux/Mac)
- [ ] `docker/stop.sh` exists and executable (Linux/Mac)
- [ ] `docker/rebuild.sh` exists and executable (Linux/Mac)
- [ ] `docker/logs.sh` exists and executable (Linux/Mac)
- [ ] `docker/test-setup.sh` exists and executable (Linux/Mac)
- [ ] `docker/start.bat` exists (Windows)
- [ ] `docker/stop.bat` exists (Windows)
- [ ] `docker/rebuild.bat` exists (Windows)
- [ ] `docker/logs.bat` exists (Windows)

### 5. Pre-Build Validation

```bash
# Run validation script
./docker/test-setup.sh

# Expected: All tests should pass
```

- [ ] Docker installation verified
- [ ] Docker Compose verified
- [ ] Docker daemon running
- [ ] Environment file validated
- [ ] Required variables configured
- [ ] Docker files present
- [ ] Helper scripts executable
- [ ] Ports available

### 6. Build Test

```bash
# Test build (optional but recommended)
docker-compose build app

# Expected: Build completes without errors
```

- [ ] Build completes successfully
- [ ] No npm install errors
- [ ] No TypeScript errors (or expected errors)
- [ ] Image size reasonable (~150MB)

### 7. First Run

```bash
# Start services
./docker/start.sh    # or docker\start.bat on Windows

# Expected: All services start and show "healthy"
```

- [ ] All containers start successfully
- [ ] `unite-hub-app` shows "Up (healthy)"
- [ ] `unite-hub-redis` shows "Up (healthy)"
- [ ] No error logs in `docker-compose logs`

### 8. Health Checks

```bash
# Test health endpoint
curl http://localhost:3008/api/health

# Expected: {"status":"healthy","timestamp":"...","uptime":...}
```

- [ ] Health endpoint returns 200 OK
- [ ] Health endpoint returns valid JSON
- [ ] `status` field is "healthy"
- [ ] `uptime` field is present and positive

### 9. Service Connectivity

```bash
# Test internal networking
docker-compose exec app ping -c 3 redis

# Expected: Ping successful
```

- [ ] App can reach Redis
- [ ] App can reach external services (Supabase, Claude API)
- [ ] No DNS resolution errors

### 10. Application Functionality

- [ ] Navigate to http://localhost:3008
- [ ] Login page loads correctly
- [ ] No console errors in browser
- [ ] OAuth login flow works
- [ ] Dashboard loads after login
- [ ] API endpoints respond correctly

### 11. Logs Review

```bash
# Check logs for errors
./docker/logs.sh app

# Expected: No ERROR or FATAL logs
```

- [ ] No critical errors in application logs
- [ ] No database connection errors
- [ ] No authentication errors
- [ ] No API key errors

### 12. Resource Usage

```bash
# Check resource consumption
docker stats

# Expected: Reasonable CPU/memory usage
```

- [ ] App container uses <1GB memory
- [ ] Redis container uses <256MB memory
- [ ] CPU usage under 50% at idle
- [ ] No memory leaks over 5 minutes

## Production Deployment Checklist

### Additional Production Steps

#### 1. Security

- [ ] Use production API keys (not test keys)
- [ ] Set strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Review Nginx security headers
- [ ] Enable SSL/TLS in Nginx config
- [ ] Remove development environment variables
- [ ] Disable debug logging
- [ ] Set `NODE_ENV=production`

#### 2. Performance

- [ ] Enable Nginx gzip compression
- [ ] Configure Redis maxmemory policy
- [ ] Set resource limits in docker-compose.yml
- [ ] Enable static file caching
- [ ] Test with production data volume

#### 3. Monitoring

- [ ] Set up health check monitoring
- [ ] Configure log aggregation
- [ ] Set up alerting (email/Slack)
- [ ] Monitor resource usage
- [ ] Track error rates

#### 4. Backup & Recovery

- [ ] Set up automated Redis backups
- [ ] Set up automated PostgreSQL backups (if using local-db)
- [ ] Test restore procedure
- [ ] Document recovery steps
- [ ] Store backups off-site

#### 5. High Availability

- [ ] Consider multi-instance deployment
- [ ] Set up load balancer
- [ ] Configure session persistence
- [ ] Test failover scenarios
- [ ] Plan for zero-downtime deployments

## Troubleshooting Quick Checks

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Common issues:
# - Missing environment variables
# - Port already in use
# - Insufficient permissions
```

### Can't Connect to Services

```bash
# Test connectivity
docker-compose exec app sh
ping redis
nc -zv your-project.supabase.co 5432

# Common issues:
# - Network configuration
# - Firewall blocking
# - Wrong credentials
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Check for issues:
# - High memory usage
# - High CPU usage
# - Disk I/O bottlenecks
```

## Post-Deployment Verification

- [ ] All critical user flows tested
- [ ] Email integration working
- [ ] AI agents functioning (email, content, orchestrator)
- [ ] Campaign creation working
- [ ] Contact management working
- [ ] Performance acceptable (<2s page load)
- [ ] No memory leaks over 24 hours
- [ ] Logs clean (no recurring errors)
- [ ] Health checks passing continuously

## Documentation Review

- [ ] Read [DOCKER_QUICK_START.md](DOCKER_QUICK_START.md)
- [ ] Read [DOCKER_SETUP.md](docs/DOCKER_SETUP.md)
- [ ] Read [DOCKER_TROUBLESHOOTING.md](docs/DOCKER_TROUBLESHOOTING.md)
- [ ] Bookmark helper script reference: [docker/README.md](docker/README.md)

## Emergency Contacts

- **Docker Issues**: Check DOCKER_TROUBLESHOOTING.md first
- **Application Issues**: Check application logs
- **Database Issues**: Check Supabase dashboard
- **API Issues**: Check service status pages

## Rollback Plan

If deployment fails:

```bash
# Stop containers
./docker/stop.sh

# Remove volumes (if needed)
./docker/stop.sh --clean

# Roll back to previous version
git checkout <previous-version>
./docker/rebuild.sh
```

---

## Sign-Off

Deployment Approved By: ___________________

Date: ___________________

Environment: [ ] Development [ ] Staging [ ] Production

Notes:
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

**Version**: 1.0.0
**Last Updated**: 2025-11-15
