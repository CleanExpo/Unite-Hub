# VPN Integration Guide for Web Scraping

Complete guide to using VPN/proxy with Unite-Hub's web scraping system for enhanced security, privacy, and avoiding IP-based rate limiting.

## Table of Contents

1. [Why Use VPN for Scraping?](#why-use-vpn-for-scraping)
2. [Supported VPN Types](#supported-vpn-types)
3. [Setup & Configuration](#setup--configuration)
4. [Usage Examples](#usage-examples)
5. [VPN Providers](#vpn-providers)
6. [IP Rotation](#ip-rotation)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Why Use VPN for Scraping?

### Benefits

✅ **Security & Privacy**
- Hide your real IP address
- Encrypt traffic between you and target sites
- Avoid IP-based tracking

✅ **Avoid Rate Limiting**
- Bypass IP-based rate limits
- Rotate IPs to appear as different users
- Prevent IP bans

✅ **Geographic Access**
- Access geo-restricted content
- Test how sites appear in different regions
- Scrape region-specific data

✅ **Load Distribution**
- Distribute requests across multiple IPs
- Reduce risk of blocking
- Improve reliability

---

## Supported VPN Types

Unite-Hub supports multiple proxy protocols:

| Protocol | Port | Security | Speed | Use Case |
|----------|------|----------|-------|----------|
| **HTTP** | 80, 8080 | Low | Fast | Basic scraping |
| **HTTPS** | 443, 8443 | Medium | Fast | Secure scraping |
| **SOCKS4** | 1080 | Medium | Medium | Advanced scraping |
| **SOCKS5** | 1080 | High | Medium | Full anonymity |

**Recommended:** SOCKS5 for best balance of security and performance

---

## Setup & Configuration

### Step 1: Install Dependencies

All VPN dependencies are already installed via `requirements.txt`:

```bash
pip install -r requirements.txt
```

Includes:
- `python-socks` - SOCKS proxy support
- `requests[socks]` - HTTP/HTTPS proxy support

### Step 2: Create VPN Configuration File

Generate a template configuration:

```bash
python src/lib/scraping/vpn-integration.py create-config vpn-config.json
```

This creates `vpn-config.json` with template:

```json
{
  "vpns": [
    {
      "name": "Primary VPN (HTTP)",
      "protocol": "http",
      "host": "proxy.example.com",
      "port": 8080,
      "username": "your_username",
      "password": "your_password",
      "enabled": true
    },
    {
      "name": "Backup VPN (SOCKS5)",
      "protocol": "socks5",
      "host": "socks.example.com",
      "port": 1080,
      "username": "your_username",
      "password": "your_password",
      "enabled": true
    }
  ],
  "settings": {
    "auto_rotate": true,
    "rotation_interval_seconds": 300,
    "test_on_startup": true
  }
}
```

### Step 3: Configure Your VPN

Edit `vpn-config.json` with your VPN provider's details:

**Example for NordVPN:**

```json
{
  "name": "NordVPN US",
  "protocol": "socks5",
  "host": "us1234.nordvpn.com",
  "port": 1080,
  "username": "your_nordvpn_email@example.com",
  "password": "your_nordvpn_password",
  "enabled": true
}
```

**Example for ExpressVPN:**

```json
{
  "name": "ExpressVPN US",
  "protocol": "https",
  "host": "us-server.expressvpn.com",
  "port": 443,
  "username": "your_expressvpn_username",
  "password": "your_expressvpn_password",
  "enabled": true
}
```

**Example for Your Own VPN Server:**

```json
{
  "name": "My VPN Server",
  "protocol": "socks5",
  "host": "vpn.mydomain.com",
  "port": 1080,
  "username": "admin",
  "password": "secure_password",
  "enabled": true
}
```

### Step 4: Test VPN Connection

Test all configured VPNs:

```bash
python src/lib/scraping/vpn-integration.py test vpn-config.json
```

Output:
```
🔍 Testing VPNs from: vpn-config.json

📊 Test Results:

✅ Primary VPN (HTTP)
   IP: 185.123.456.789
   Latency: 45.23ms
   Protocol: http

✅ Backup VPN (SOCKS5)
   IP: 192.168.100.50
   Latency: 67.89ms
   Protocol: socks5
```

---

## Usage Examples

### Example 1: Basic Scraping with VPN

```bash
python src/lib/scraping/web-scraper-vpn.py https://example.com --config vpn-config.json
```

Output:
```
✅ VPN enabled: Primary VPN (HTTP)
📍 Scraping from IP: 185.123.456.789

{
  "url": "https://example.com",
  "metadata": { ... },
  ...
}
```

### Example 2: Competitor Analysis with VPN

```bash
python src/lib/scraping/web-scraper-vpn.py https://competitor.com \
  --config vpn-config.json \
  --competitor \
  --rotate
```

Features:
- Uses VPN for anonymity
- Auto-rotates VPN on errors
- Full competitor intelligence

### Example 3: Playwright with VPN (JavaScript Rendering)

```bash
python src/lib/scraping/playwright-vpn.py https://spa-website.com \
  --config vpn-config.json \
  --show-ip \
  --screenshot
```

Features:
- JavaScript rendering with VPN
- Shows IP address being used
- Takes full-page screenshot

### Example 4: Python Script with VPN

```python
from src.lib.scraping.vpn_integration import VPNManager, VPNSession

# Initialize VPN
vpn_manager = VPNManager('vpn-config.json')

# Create VPN session
session = VPNSession(vpn_manager, auto_rotate=True)

# Make request through VPN
response = session.get('https://example.com')
print(response.text)

# Check current IP
current_ip = session.get_current_ip()
print(f"Scraping from IP: {current_ip}")

# Rotate to next VPN
session.rotate_vpn()
```

### Example 5: Multiple URLs with IP Rotation

```python
import asyncio
from src.lib.scraping.playwright_vpn import VPNPlaywrightScraper

urls = [
    'https://competitor1.com',
    'https://competitor2.com',
    'https://competitor3.com',
]

async def scrape_with_rotation():
    async with VPNPlaywrightScraper(vpn_config_file='vpn-config.json') as scraper:
        results = await scraper.scrape_multiple(
            urls,
            rotate_vpn_between=True  # New IP for each site
        )
        return results

results = asyncio.run(scrape_with_rotation())
```

---

## VPN Providers

### Recommended Providers

#### 1. **NordVPN** (Recommended)

**Setup:**
```json
{
  "name": "NordVPN",
  "protocol": "socks5",
  "host": "us1234.nordvpn.com",
  "port": 1080,
  "username": "your_email@example.com",
  "password": "your_password",
  "enabled": true
}
```

**Features:**
- 5000+ servers worldwide
- SOCKS5 proxy support
- No logs policy
- ~$3.50/month

**Get server list:**
- Login to NordVPN dashboard
- Go to Settings → Advanced → Proxy
- Use any server hostname

#### 2. **ExpressVPN**

**Setup:**
```json
{
  "name": "ExpressVPN",
  "protocol": "https",
  "host": "us-server.expressvpn.com",
  "port": 443,
  "username": "your_username",
  "password": "your_password",
  "enabled": true
}
```

**Features:**
- 3000+ servers in 94 countries
- Fast speeds
- 24/7 support
- ~$6.67/month

#### 3. **ProxyMesh** (Dedicated for Scraping)

**Setup:**
```json
{
  "name": "ProxyMesh",
  "protocol": "http",
  "host": "us-ca.proxymesh.com",
  "port": 31280,
  "username": "your_username",
  "password": "your_password",
  "enabled": true
}
```

**Features:**
- Built for web scraping
- Rotating IPs automatically
- Multiple geolocations
- ~$10/month

#### 4. **Your Own VPN Server** (Most Control)

**Setup OpenVPN Server:**

```bash
# Install OpenVPN on your VPS
apt install openvpn

# Configure SOCKS5 proxy
apt install dante-server

# Edit /etc/danted.conf
# Then use in config:
```

```json
{
  "name": "My VPS",
  "protocol": "socks5",
  "host": "vpn.mydomain.com",
  "port": 1080,
  "username": "admin",
  "password": "secure_password",
  "enabled": true
}
```

**Benefits:**
- Full control
- No monthly fees (just VPS cost)
- Customize configuration
- ~$5/month (VPS cost)

---

## IP Rotation

### Automatic Rotation

Enable auto-rotation in `vpn-config.json`:

```json
{
  "settings": {
    "auto_rotate": true,
    "rotation_interval_seconds": 300
  }
}
```

### Manual Rotation

#### Python Script:

```python
from src.lib.scraping.vpn_integration import VPNManager, VPNSession

vpn_manager = VPNManager('vpn-config.json')
session = VPNSession(vpn_manager)

# Scrape with first VPN
response1 = session.get('https://example.com')
ip1 = session.get_current_ip()

# Rotate to next VPN
session.rotate_vpn()

# Scrape with second VPN
response2 = session.get('https://example.com')
ip2 = session.get_current_ip()

print(f"IP 1: {ip1}")
print(f"IP 2: {ip2}")
```

#### CLI:

```bash
# Scrape with rotation enabled
python src/lib/scraping/web-scraper-vpn.py https://example.com \
  --config vpn-config.json \
  --rotate
```

### Rotation Strategies

**1. Time-Based Rotation**
- Rotate every N seconds
- Good for continuous scraping
- Configure in `vpn-config.json`

**2. Request-Based Rotation**
- Rotate every N requests
- Good for batch processing
- Implement in your script

**3. Error-Based Rotation**
- Rotate on HTTP errors (429, 403)
- Auto-retry with new IP
- Enable with `auto_rotate=True`

**4. Site-Based Rotation**
- Different IP per website
- Good for competitor analysis
- Use `scrape_multiple(rotate_vpn_between=True)`

---

## Troubleshooting

### Issue: VPN Connection Failed

**Symptoms:**
```
❌ Failed: Connection refused
```

**Solutions:**
1. Check VPN server is running
2. Verify host and port are correct
3. Test with `ping host` and `telnet host port`
4. Check firewall settings

### Issue: Authentication Failed

**Symptoms:**
```
❌ Failed: 407 Proxy Authentication Required
```

**Solutions:**
1. Verify username/password are correct
2. Check if VPN requires email as username
3. Some VPNs use tokens instead of passwords
4. Contact VPN provider for credentials

### Issue: Slow Performance

**Symptoms:**
- High latency (>1000ms)
- Timeouts

**Solutions:**
1. Choose server closer to you geographically
2. Switch to faster protocol (HTTP faster than SOCKS5)
3. Reduce concurrent requests
4. Use different VPN provider

### Issue: IP Still Detected

**Symptoms:**
- Your real IP showing up
- VPN not being used

**Solutions:**
1. Verify VPN is enabled in config (`"enabled": true`)
2. Check VPN manager initialized correctly
3. Test VPN connection first
4. Check for DNS leaks

### DNS Leak Test

```python
from src.lib.scraping.vpn_integration import VPNManager, VPNSession

vpn_manager = VPNManager('vpn-config.json')
session = VPNSession(vpn_manager)

# Check IP
ip = session.get_current_ip()
print(f"IP: {ip}")

# Should NOT be your real IP
```

---

## Best Practices

### 1. Use Multiple VPNs

Configure 3-5 VPN servers for rotation:

```json
{
  "vpns": [
    { "name": "VPN 1 - US East", ... },
    { "name": "VPN 2 - US West", ... },
    { "name": "VPN 3 - EU", ... },
    { "name": "VPN 4 - Asia", ... }
  ]
}
```

### 2. Rotate Regularly

Don't use same IP for > 100 requests:

```python
request_count = 0

for url in urls:
    if request_count % 100 == 0:
        session.rotate_vpn()

    response = session.get(url)
    request_count += 1
```

### 3. Use Appropriate Protocol

- **HTTP:** Fast, basic scraping
- **HTTPS:** Secure scraping
- **SOCKS5:** Full anonymity, JavaScript rendering

### 4. Monitor IP Changes

```python
previous_ip = session.get_current_ip()

for url in urls:
    current_ip = session.get_current_ip()

    if current_ip == previous_ip:
        logger.warning("IP didn't change after rotation!")

    previous_ip = current_ip
```

### 5. Respect Rate Limits

Even with VPN, be respectful:

```python
import time

# Delay between requests
time.sleep(2)

# Rotate VPN every 10 minutes
rotation_interval = 600  # seconds
```

### 6. Keep Credentials Secure

**DON'T commit vpn-config.json to git:**

```bash
# Add to .gitignore
echo "vpn-config.json" >> .gitignore
```

**Use environment variables:**

```python
import os

vpn_config = {
    "username": os.getenv('VPN_USERNAME'),
    "password": os.getenv('VPN_PASSWORD'),
}
```

---

## Security Considerations

### ✅ DO

- Use reputable VPN providers
- Enable kill switch if available
- Check for DNS leaks regularly
- Rotate IPs frequently
- Use SOCKS5 for maximum privacy
- Keep VPN software updated

### ❌ DON'T

- Use free VPN services (often log data)
- Share VPN credentials in code
- Scrape illegal content
- Bypass authentication with VPN
- Use VPN for malicious purposes
- Trust VPN 100% (can still be tracked)

---

## Environment Variables

Add to `.env.local`:

```env
# VPN Configuration
VPN_CONFIG_FILE=vpn-config.json
VPN_AUTO_ROTATE=true
VPN_ROTATION_INTERVAL=300

# VPN Credentials (optional - can also use config file)
VPN_1_HOST=proxy.example.com
VPN_1_PORT=8080
VPN_1_USERNAME=user
VPN_1_PASSWORD=pass
```

---

## API Integration

Use VPN in API routes:

```typescript
// src/app/api/scraping/analyze/route.ts

// Modify script execution to include VPN config
const scriptArgs = [
  url,
  '--config', 'vpn-config.json',
  '--rotate'
];

const result = await runPythonScript(scriptPath, scriptArgs);
```

---

## Performance Comparison

| Method | Speed | Security | Anonymity | Cost |
|--------|-------|----------|-----------|------|
| Direct | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ | Free |
| HTTP Proxy | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | $5-10/mo |
| HTTPS Proxy | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | $10-20/mo |
| SOCKS5 VPN | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $5-15/mo |

**Recommendation:** SOCKS5 VPN for best balance

---

## Support

For VPN-related issues:

1. Test VPN connection first: `python src/lib/scraping/vpn-integration.py test`
2. Check provider documentation
3. Verify credentials are correct
4. Try different protocol (HTTP vs SOCKS5)
5. Contact VPN provider support

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0
