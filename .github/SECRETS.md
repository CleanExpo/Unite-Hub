# GitHub Secrets Reference

**Important**: NodeJS-Starter-V1 works completely without any GitHub secrets. This document lists optional secrets you can add to enable specific features.

---

## 🎯 Quick Summary

| Secret | Status | Enables | When to Add |
|--------|--------|---------|-------------|
| *None required* | ✅ | Local development, CI/CD | **Never** - works without secrets |
| `SNYK_TOKEN` | 🟡 Optional | Advanced security scanning | When you want Snyk reports |
| `CODECOV_TOKEN` | 🟡 Optional | Coverage trend tracking | When you want historical coverage |
| `DIGITALOCEAN_ACCESS_TOKEN` | 🟡 Optional | Backend deployment | When deploying backend |
| `VERCEL_TOKEN` | 🟡 Optional | Frontend deployment | When deploying frontend (if not using GitHub integration) |

**Default behavior**: All workflows run successfully without any secrets.

---

## 🆓 No Secrets Required

### What Works Without Secrets

The template is designed to be **self-contained**:

✅ **Local Development**
- PostgreSQL + Redis in Docker
- Ollama for local AI
- JWT authentication
- Full development workflow

✅ **CI/CD (GitHub Actions)**
- All tests (unit, integration, E2E)
- Linting and type checking
- Coverage reports (stored as GitHub artifacts)
- Security scanning (NPM audit, Trivy)

✅ **Quality Checks**
- ESLint + Ruff linting
- TypeScript + mypy type checking
- Vitest + pytest testing
- Playwright E2E testing

**You can clone, develop, test, and iterate completely offline and without any external service accounts.**

---

## 🔑 Optional Secrets

### 1. Snyk (Advanced Security Scanning)

**Secret Name**: `SNYK_TOKEN`
**Status**: 🟡 **Optional**
**Enables**: Vulnerability scanning with Snyk

**What You Get:**
- Dependency vulnerability scanning
- License compliance checks
- Fix recommendations
- Security reports in Snyk dashboard

**What Works Without It:**
- ✅ NPM audit (no token required)
- ✅ Trivy scanning (no token required)
- ✅ Dependency Review on PRs (GitHub built-in)

**When to Add:**
- You want detailed security reports
- You need license compliance checking
- Your organization uses Snyk

**How to Get:**
1. Sign up at https://snyk.io (free tier: 200 tests/month)
2. Go to Account Settings → General → Auth Token
3. Copy the API token
4. Add to GitHub: Settings → Secrets → Actions → New secret
   - Name: `SNYK_TOKEN`
   - Value: `<paste token>`

**Usage:** `.github/workflows/security.yml` (runs if token exists, skips if not)

**Cost:** Free tier available (200 tests/month for private repos, unlimited for open source)

---

### 2. Codecov (Coverage Trend Tracking)

**Secret Name**: `CODECOV_TOKEN`
**Status**: 🟡 **Optional**
**Enables**: Historical coverage tracking and trends

**What You Get:**
- Coverage trend graphs
- PR coverage diffs
- Coverage badges
- Team collaboration features

**What Works Without It:**
- ✅ Coverage reports (stored as GitHub artifacts)
- ✅ Local HTML coverage reports (htmlcov/)
- ✅ Coverage XML reports (coverage.xml)

**When to Add:**
- You want to track coverage trends over time
- You want coverage badges on README
- Your team needs coverage collaboration tools

**How to Get:**
1. Sign up at https://codecov.io (free for open source)
2. Add your GitHub repository
3. Copy the upload token from Settings
4. Add to GitHub: Settings → Secrets → Actions → New secret
   - Name: `CODECOV_TOKEN`
   - Value: `<paste token>`

**How to Use:**
Uncomment in `.github/workflows/ci.yml`:
```yaml
# Backend coverage
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./apps/backend/coverage.xml
    flags: backend

# Frontend coverage
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./apps/web/coverage/lcov.info
    flags: frontend
```

**Cost:** Free for open source, paid for private repos

---

### 3. DigitalOcean (Backend Deployment)

**Secret Name**: `DIGITALOCEAN_ACCESS_TOKEN`
**Status**: 🟡 **Optional**
**Enables**: Automated backend deployment to DigitalOcean

**What You Get:**
- Automated deployment on push to main
- Managed PostgreSQL hosting
- Auto-scaling capabilities
- Production-ready backend hosting

**What Works Without It:**
- ✅ Local development (Docker)
- ✅ Self-hosting (Docker Compose)
- ✅ Manual deployments

**When to Add:**
- You want to deploy backend to DigitalOcean
- You need managed database hosting
- You want automated deployments

**How to Get:**
1. Login to DigitalOcean
2. Go to API → Tokens/Keys
3. Generate New Token with "Write" scope
4. Copy the token (shown only once)
5. Add to GitHub: Settings → Secrets → Actions → New secret
   - Name: `DIGITALOCEAN_ACCESS_TOKEN`
   - Value: `<paste token>`

**How to Use:**
Copy example workflow:
```bash
cp .github/workflows/examples/deploy-backend.yml.example .github/workflows/deploy-backend.yml
```

**Cost:** Starts at $5/month for basic app + $15/month for managed PostgreSQL

**Alternatives:** Railway, Fly.io, Render (see `docs/OPTIONAL_SERVICES.md`)

---

### 4. Vercel (Frontend Deployment)

**Secret Name**: `VERCEL_TOKEN`
**Status**: 🟡 **Optional**
**Enables**: Automated frontend deployment to Vercel (if not using GitHub integration)

**What You Get:**
- Automated deployment on push to main
- Preview deployments for PRs
- Edge CDN hosting
- Serverless functions

**What Works Without It:**
- ✅ Local development (localhost:3000)
- ✅ Static export (for any host)
- ✅ Vercel GitHub integration (no token needed!)

**When to Add:**
- You want programmatic deployments
- You're NOT using Vercel GitHub integration
- You need API-based deployment control

**Note:** Most users should use Vercel's GitHub integration instead, which handles deployment automatically without any tokens.

**How to Get (if needed):**
1. Login to Vercel
2. Go to Settings → Tokens
3. Create new token
4. Copy the token
5. Add to GitHub: Settings → Secrets → Actions → New secret
   - Name: `VERCEL_TOKEN`
   - Value: `<paste token>`

**How to Use:**
Copy example workflow:
```bash
cp .github/workflows/examples/deploy-frontend.yml.example .github/workflows/deploy-frontend.yml
```

**Cost:** Free tier (hobby projects), $20/month (pro)

**Alternatives:** Netlify, Cloudflare Pages, AWS Amplify (see `docs/OPTIONAL_SERVICES.md`)

---

## 📊 Secrets Decision Matrix

| I want to... | Do I need secrets? | What to add |
|--------------|-------------------|-------------|
| Develop locally | ❌ No | Nothing - works out of box |
| Run tests in CI | ❌ No | Nothing - all tests work |
| Get code coverage | ❌ No | Nothing - coverage reports in artifacts |
| Scan for vulnerabilities | ❌ No | Nothing - NPM audit + Trivy work |
| Track coverage trends | ✅ Yes | `CODECOV_TOKEN` |
| Use Snyk scanning | ✅ Yes | `SNYK_TOKEN` |
| Deploy to cloud | ✅ Yes | Deployment tokens (see above) |

---

## 🔧 How to Add Secrets to GitHub

### Method 1: GitHub Web Interface (Recommended)

1. **Navigate to Repository Settings**:
   ```
   https://github.com/<your-username>/<your-repo>/settings/secrets/actions
   ```

2. **Add Each Secret**:
   - Click "New repository secret"
   - Enter the secret name (exactly as shown above)
   - Paste the secret value
   - Click "Add secret"

3. **Verify Secrets**:
   - You should see all secrets listed (values are hidden)
   - Secrets are available immediately to workflows

### Method 2: GitHub CLI (Alternative)

```bash
# Optional: Snyk token
gh secret set SNYK_TOKEN -b "your-snyk-token-here"

# Optional: Codecov token
gh secret set CODECOV_TOKEN -b "your-codecov-token-here"

# Optional: Deployment secrets
gh secret set DIGITALOCEAN_ACCESS_TOKEN -b "your-do-token-here"
gh secret set VERCEL_TOKEN -b "your-vercel-token-here"
```

---

## 🔐 Security Best Practices

1. **Only Add What You Need**:
   - Start with zero secrets
   - Add secrets only when you need specific features
   - Remove unused secrets

2. **Never Commit Secrets**:
   - Secrets are stored in GitHub's encrypted vault
   - Never add secrets to code or configuration files
   - Use `.gitignore` for local `.env` files

3. **Rotate Tokens Regularly**:
   - Rotate tokens every 90 days
   - Immediately rotate if exposed
   - Use minimal permission scopes

4. **Use Separate Tokens**:
   - Different token for each environment (dev/staging/prod)
   - Different token for each service
   - Never share tokens across projects

5. **Monitor Usage**:
   - Review workflow logs for suspicious activity
   - Check token usage in service dashboards
   - Set up alerts for failed authentication

---

## 🧪 Testing Secrets Configuration

After adding optional secrets, test by:

1. **Trigger Workflow Manually**:
   - Go to Actions → Select workflow
   - Click "Run workflow"
   - Check if jobs complete successfully

2. **Check Workflow Logs**:
   - Verify secrets are being used (not exposed in logs)
   - Look for authentication success messages
   - Confirm no "missing secret" errors

3. **Example Test Commands**:
   ```bash
   # Trigger Security workflow (Snyk runs if token exists)
   gh workflow run security.yml

   # Trigger CI workflow
   gh workflow run ci.yml

   # Check workflow status
   gh run list --workflow=ci.yml --limit 1
   ```

---

## 🚨 Troubleshooting

### Issue: "Secret not found" error

**Solution**:
- Verify secret name matches exactly (case-sensitive)
- Check secret is added to repository (not organization)
- Ensure secret is in "Repository secrets" not "Environment secrets"

### Issue: "Invalid token" error

**Solution**:
- Verify token is copied correctly (no extra spaces)
- Check token hasn't expired
- Ensure token has correct permissions
- Generate new token if needed

### Issue: Workflows still failing after adding secrets

**Solution**:
- Re-run workflow (secrets available immediately but may need retry)
- Check workflow logs for specific error
- Verify service is accessible from GitHub Actions
- Check if additional configuration needed in workflow file

---

## 📚 Additional Resources

### Service Documentation

- **Snyk**: https://docs.snyk.io
- **Codecov**: https://docs.codecov.com
- **DigitalOcean**: https://docs.digitalocean.com
- **Vercel**: https://vercel.com/docs
- **GitHub Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets

### Deployment Alternatives

See `docs/OPTIONAL_SERVICES.md` for comprehensive deployment guides:
- Railway, Fly.io, Render (backend)
- Netlify, Cloudflare Pages, AWS Amplify (frontend)
- Supabase, Neon, PlanetScale (database)

---

## ✅ Optional Secrets Checklist

Only add these if you need the specific features:

### Enhanced Security (Optional)

- [ ] `SNYK_TOKEN` - Advanced vulnerability scanning (optional, NPM audit + Trivy work without it)

### Coverage Tracking (Optional)

- [ ] `CODECOV_TOKEN` - Historical coverage trends (optional, coverage reports work without it)

### Deployment (Optional - Only if Deploying to Cloud)

- [ ] `DIGITALOCEAN_ACCESS_TOKEN` - Backend deployment (optional, can self-host)
- [ ] `VERCEL_TOKEN` - Frontend deployment (optional, can use GitHub integration or other platforms)

**Remember**: The template works completely without any of these secrets.

---

## 🔄 Secrets Update Log

Track when you add/rotate optional secrets:

| Secret | Added Date | Last Rotated | Next Rotation |
|--------|-----------|--------------|---------------|
| SNYK_TOKEN | - | - | - |
| CODECOV_TOKEN | - | - | - |
| DIGITALOCEAN_ACCESS_TOKEN | - | - | - |
| VERCEL_TOKEN | - | - | - |

**Recommendation**: Rotate tokens every 90 days for security.

---

## 🎓 Learning Path

**New to the template?** Follow this path:

1. **Start Without Secrets**
   - Clone, setup, develop locally
   - Run all tests in CI
   - Get comfortable with the template

2. **Add Security Scanning (Optional)**
   - Add `SNYK_TOKEN` if you want Snyk reports
   - NPM audit + Trivy already work

3. **Add Coverage Tracking (Optional)**
   - Add `CODECOV_TOKEN` if you want historical trends
   - Coverage reports already work without it

4. **Deploy to Cloud (Optional)**
   - Add deployment tokens when you're ready to deploy
   - Self-hosting with Docker Compose is also an option

---

## 💡 FAQ

**Q: Do I need any secrets to use this template?**
A: No. The template works completely without any GitHub secrets.

**Q: Can I run tests in CI without secrets?**
A: Yes. All tests, linting, type checking, and security scanning work without secrets.

**Q: What's the difference between required and optional secrets?**
A: There are **zero required secrets**. All secrets listed here are optional and enable specific features.

**Q: Should I add all the secrets?**
A: No. Only add secrets for features you actually use. Start with zero secrets.

**Q: Can I deploy without secrets?**
A: Yes. You can self-host using Docker Compose without any secrets. Deployment secrets are only needed for cloud platforms.

**Q: Will my workflows fail if I don't add secrets?**
A: No. Workflows are designed to work without secrets. Optional features (like Snyk) only run if their secrets exist.

---

**Created**: 2026-01-06
**Updated**: 2026-01-06
**Template Philosophy**: Self-contained by default, cloud-ready when needed
