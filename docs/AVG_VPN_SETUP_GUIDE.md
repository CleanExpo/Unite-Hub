# AVG Secure VPN Setup Guide for Web Scraping

Complete guide to integrating your AVG Secure VPN with Unite-Hub's web scraping system.

## 📋 Table of Contents

1. [AVG Secure VPN Overview](#avg-secure-vpn-overview)
2. [Setup Methods](#setup-methods)
3. [Method 1: System-Wide VPN (Easiest)](#method-1-system-wide-vpn-easiest)
4. [Method 2: SOCKS5 Proxy (Advanced)](#method-2-socks5-proxy-advanced)
5. [Verification](#verification)
6. [Usage Examples](#usage-examples)
7. [Troubleshooting](#troubleshooting)

---

## AVG Secure VPN Overview

**AVG Secure VPN** (powered by Avast SecureLine VPN) provides:
- ✅ 50+ server locations worldwide
- ✅ AES-256 encryption
- ✅ No-logs policy
- ✅ Support for multiple devices

**Important:** AVG Secure VPN is primarily a system-wide VPN client, not a proxy service. We'll show you two ways to use it with scraping.

---

## Setup Methods

### Quick Comparison

| Method | Difficulty | Speed | Control | Best For |
|--------|------------|-------|---------|----------|
| **System-Wide** | ⭐ Easy | ⭐⭐⭐⭐⭐ | ⭐⭐ | Quick start |
| **SOCKS5 Proxy** | ⭐⭐⭐ Advanced | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Production use |

**Recommendation:** Start with System-Wide, then upgrade to SOCKS5 for advanced features.

---

## Method 1: System-Wide VPN (Easiest)

This method routes ALL traffic through AVG VPN automatically.

### Step 1: Connect AVG Secure VPN

**Windows:**
1. Open AVG Secure VPN
2. Click **"Connect"**
3. Wait for "Connected" status
4. Choose server location (e.g., United States, United Kingdom)

**Recommended Locations for Scraping:**
- 🇺🇸 **United States** - Best for US-based sites
- 🇬🇧 **United Kingdom** - Good for European sites
- 🇩🇪 **Germany** - Alternative European option
- 🇸🇬 **Singapore** - Good for Asia-Pacific

### Step 2: Verify Connection

**Check your IP changed:**

```bash
# Windows Command Prompt
curl https://api.ipify.org

# PowerShell
Invoke-RestMethod https://api.ipify.org
```

**Before VPN:**
```
123.45.67.89  # Your real IP
```

**After VPN:**
```
185.123.456.789  # AVG VPN IP
```

### Step 3: Use Scraping System

**No configuration file needed!** Just run scraping commands normally:

```bash
# All traffic automatically goes through AVG VPN
python src/lib/scraping/web-scraper.py https://competitor.com

# Competitor analysis
npm run scrape https://competitor.com -- --competitor
```

**Verification:**

```python
import requests

# Check IP being used
response = requests.get('https://api.ipify.org?format=json')
print(f"Scraping from IP: {response.json()['ip']}")
# Should show AVG VPN IP, not your real IP
```

### Step 4: Change Location (Manual Rotation)

**To rotate to different IP:**

1. Open AVG Secure VPN
2. Click **"Disconnect"**
3. Click **location selector** (e.g., "United States")
4. Choose different location (e.g., "United Kingdom")
5. Click **"Connect"**

**Your IP will now be different!**

### Pros & Cons

✅ **Pros:**
- No configuration needed
- Works with all scraping tools immediately
- Easy to use
- Supports all protocols automatically

❌ **Cons:**
- Routes ALL system traffic (browser, apps, etc.)
- Manual IP rotation only
- No programmatic control
- Can't use multiple IPs simultaneously

---

## Method 2: SOCKS5 Proxy (Advanced)

This method uses AVG VPN's SOCKS5 proxy for programmatic control.

### Important Note

**AVG Secure VPN doesn't directly expose SOCKS5 proxy endpoints.** To use proxy features, you have two options:

#### Option A: Use AVG with Proxy Software

Install additional proxy software that routes through AVG VPN:

**1. Install Proxifier (Windows)**

```
Download: https://www.proxifier.com/
Price: $39.95 (or trial)
```

**Configuration:**
1. Connect AVG Secure VPN
2. Open Proxifier
3. Profile → Proxy Servers → Add
4. Configure local SOCKS5 proxy
5. Point to AVG VPN tunnel

#### Option B: Use Alternative VPN with Native SOCKS5

For better programmatic control, consider VPNs with native SOCKS5:

**Recommended Alternatives:**

1. **NordVPN** (~$3.50/month)
   - Native SOCKS5 support
   - Easy configuration
   - 5000+ servers

2. **Private Internet Access** (~$2.50/month)
   - SOCKS5 proxy included
   - Good for scraping
   - No logs

**NordVPN Setup Example:**

```json
{
  "vpns": [
    {
      "name": "NordVPN US",
      "protocol": "socks5",
      "host": "us1234.nordvpn.com",
      "port": 1080,
      "username": "your_email@example.com",
      "password": "your_nordvpn_password",
      "enabled": true
    }
  ]
}
```

---

## Verification

### Test 1: Check Current IP

**Python:**
```python
import requests

response = requests.get('https://api.ipify.org?format=json')
ip = response.json()['ip']

print(f"Current IP: {ip}")
print(f"Is VPN active: {ip != 'YOUR_REAL_IP'}")
```

**Expected Output:**
```
Current IP: 185.123.456.789
Is VPN active: True
```

### Test 2: Test Scraping

```bash
python src/lib/scraping/web-scraper.py https://httpbin.org/ip
```

**Expected Output:**
```json
{
  "origin": "185.123.456.789"  // AVG VPN IP
}
```

### Test 3: Test Geographic Location

```bash
curl https://ipapi.co/json/
```

**Expected Output:**
```json
{
  "ip": "185.123.456.789",
  "city": "New York",
  "country": "US",
  "org": "AVG Technologies"  // Or similar
}
```

---

## Usage Examples

### Example 1: Basic Scraping with AVG VPN

**Step 1: Connect AVG VPN**
```
Open AVG Secure VPN → Connect → United States
```

**Step 2: Scrape**
```bash
python src/lib/scraping/web-scraper.py https://competitor.com
```

**Result:**
```
✅ Scraping from IP: 185.123.456.789 (US)
```

### Example 2: Competitor Analysis with Location Change

**Step 1: Connect to US Server**
```
AVG VPN → United States → Connect
```

**Step 2: Analyze US Competitor**
```bash
npm run scrape https://us-competitor.com -- --competitor --save
```

**Step 3: Switch to UK Server**
```
AVG VPN → Disconnect → United Kingdom → Connect
```

**Step 4: Analyze UK Competitor**
```bash
npm run scrape https://uk-competitor.com -- --competitor --save
```

### Example 3: Multiple Competitors, Different Locations

**Python Script:**

```python
import subprocess
import time

competitors = [
    ("https://us-competitor.com", "United States"),
    ("https://uk-competitor.com", "United Kingdom"),
    ("https://de-competitor.com", "Germany"),
]

for url, location in competitors:
    print(f"\n📍 Switching to {location}...")
    print(f"⚠️ Please manually switch AVG VPN to {location} and press Enter")
    input("Press Enter when connected...")

    # Verify IP changed
    import requests
    ip = requests.get('https://api.ipify.org?format=json').json()['ip']
    print(f"✅ Connected with IP: {ip}")

    # Scrape
    print(f"🔍 Scraping {url}...")
    subprocess.run([
        'python', 'src/lib/scraping/web-scraper.py',
        url
    ])

    time.sleep(5)
```

### Example 4: Check IP Before Each Scrape

```python
import requests
from src.lib.scraping.web_scraper import WebScraper

def get_current_ip():
    response = requests.get('https://api.ipify.org?format=json')
    return response.json()['ip']

# Verify VPN is active
current_ip = get_current_ip()
print(f"📍 Current IP: {current_ip}")

if current_ip == "YOUR_REAL_IP_HERE":
    print("⚠️ WARNING: VPN not active! Connect AVG VPN first.")
    exit(1)

# Safe to scrape
scraper = WebScraper()
result = scraper.scrape_page("https://competitor.com")
```

---

## Location Selection Guide

### Best Locations for Different Use Cases

**US-Based Scraping:**
- 🇺🇸 **United States - New York**
- 🇺🇸 **United States - Los Angeles**
- Good for: .com sites, US competitors

**European Scraping:**
- 🇬🇧 **United Kingdom - London**
- 🇩🇪 **Germany - Frankfurt**
- 🇫🇷 **France - Paris**
- Good for: .co.uk, .de, .eu sites

**Asia-Pacific Scraping:**
- 🇸🇬 **Singapore**
- 🇯🇵 **Japan - Tokyo**
- 🇦🇺 **Australia - Sydney**
- Good for: .sg, .jp, .com.au sites

**Speed Optimization:**
- Choose server geographically close to:
  1. Your location (for speed)
  2. Target website (for best access)

---

## Troubleshooting

### Issue: IP Not Changing

**Symptoms:**
- Still showing your real IP
- VPN connected but scraping uses real IP

**Solutions:**

1. **Verify VPN Connection:**
   ```
   AVG VPN → Check "Connected" status
   ```

2. **Check IP in Browser:**
   ```
   Visit: https://whatismyipaddress.com/
   Should show AVG VPN IP
   ```

3. **Restart VPN:**
   ```
   AVG VPN → Disconnect → Wait 5s → Connect
   ```

4. **Check DNS Leaks:**
   ```
   Visit: https://dnsleaktest.com/
   Should show AVG VPN servers
   ```

### Issue: Slow Scraping Performance

**Symptoms:**
- Requests taking > 10 seconds
- Frequent timeouts

**Solutions:**

1. **Choose Closer Server:**
   ```
   If in US → Use US server
   If in EU → Use UK/Germany server
   ```

2. **Switch to Different Location:**
   ```
   Some servers faster than others
   Try: US East vs US West
   ```

3. **Increase Timeout:**
   ```python
   scraper = WebScraper(timeout=60)  # 60 seconds
   ```

### Issue: VPN Disconnects During Scraping

**Symptoms:**
- Scraping stops mid-process
- Connection lost errors

**Solutions:**

1. **Enable Auto-Reconnect:**
   ```
   AVG VPN → Settings → Auto-reconnect: ON
   ```

2. **Add Retry Logic:**
   ```python
   from tenacity import retry, stop_after_attempt

   @retry(stop=stop_after_attempt(3))
   def scrape_with_retry(url):
       return scraper.scrape_page(url)
   ```

3. **Check Network Stability:**
   ```
   Test your base internet connection
   Consider wired connection over WiFi
   ```

### Issue: Geo-Blocked Content

**Symptoms:**
- 403 Forbidden errors
- "Not available in your region"

**Solutions:**

1. **Switch to Target Country:**
   ```
   If scraping UK site → Use UK server
   If scraping US site → Use US server
   ```

2. **Try Different Server in Same Country:**
   ```
   US East vs US West
   May have different IP ranges
   ```

---

## Best Practices with AVG VPN

### 1. Pre-Flight Checklist

Before scraping:
- ✅ AVG VPN connected
- ✅ IP verified (not your real IP)
- ✅ Location appropriate for target site
- ✅ DNS leak test passed

### 2. Rotation Strategy

**Manual Rotation Schedule:**
```
Every 100 requests:
1. Disconnect AVG VPN
2. Switch location
3. Reconnect
4. Verify new IP
5. Resume scraping
```

**Python Helper:**
```python
def prompt_vpn_rotation():
    input("\n🔄 Time to rotate VPN! Switch AVG location and press Enter...")
    new_ip = get_current_ip()
    print(f"✅ New IP: {new_ip}")
    return new_ip

request_count = 0

for url in urls:
    if request_count % 100 == 0 and request_count > 0:
        prompt_vpn_rotation()

    result = scraper.scrape_page(url)
    request_count += 1
```

### 3. Location Selection

**Match target geography:**
```python
targets = {
    "https://us-competitor.com": "United States",
    "https://uk-competitor.com": "United Kingdom",
    "https://de-competitor.com": "Germany",
}

for url, location in targets.items():
    print(f"⚠️ Please connect to: {location}")
    input("Press Enter when connected...")
    scrape(url)
```

### 4. Monitor Connection

```python
import time
import requests

def check_vpn_active():
    try:
        ip = requests.get('https://api.ipify.org', timeout=5).text
        return ip != "YOUR_REAL_IP"
    except:
        return False

# During scraping
while scraping:
    if not check_vpn_active():
        print("⚠️ VPN disconnected! Pausing...")
        input("Reconnect VPN and press Enter...")

    scrape_next_url()
    time.sleep(2)
```

---

## Upgrading to Programmatic VPN

If you need more control (automatic rotation, multiple IPs, etc.), consider upgrading:

### Option 1: Add NordVPN (Keep AVG for Personal Use)

**Cost:** $3.50/month
**Benefits:** Native SOCKS5, automatic rotation, programmatic control

**Setup:**
```json
{
  "vpns": [
    {
      "name": "NordVPN US East",
      "protocol": "socks5",
      "host": "us1234.nordvpn.com",
      "port": 1080,
      "username": "your_email@example.com",
      "password": "your_password",
      "enabled": true
    }
  ]
}
```

### Option 2: Use Proxy Service (Keep AVG)

**ProxyMesh:** ~$10/month, built for scraping

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

---

## Summary

### What Works with AVG VPN

✅ **System-Wide Protection**
- All scraping automatically goes through VPN
- Easy to use
- No configuration needed

✅ **Manual IP Rotation**
- Switch server locations as needed
- Different geographic IPs
- Good for small-scale scraping

✅ **Security & Privacy**
- Hides your real IP
- Encrypts traffic
- Professional VPN provider

### What Doesn't Work

❌ **Programmatic Rotation**
- No automatic IP rotation
- Manual location switching only

❌ **Multiple Simultaneous IPs**
- One IP at a time
- Can't run parallel scrapers with different IPs

❌ **SOCKS5 Proxy API**
- No native proxy endpoint
- System-wide VPN only

### Recommendations

**For Simple Scraping:**
- ✅ Use AVG VPN system-wide (Method 1)
- Works great for basic needs

**For Advanced Scraping:**
- Consider adding NordVPN or ProxyMesh
- Programmatic control
- Automatic rotation

**Hybrid Approach:**
- Keep AVG for personal browsing
- Add $3.50/month VPN for scraping automation

---

## Quick Reference

### Connect AVG VPN
```
1. Open AVG Secure VPN
2. Click "Connect"
3. Wait for "Connected"
```

### Verify Connection
```bash
curl https://api.ipify.org
# Should show VPN IP
```

### Scrape with AVG VPN
```bash
# Just run normally - AVG routes everything
python src/lib/scraping/web-scraper.py https://competitor.com
```

### Change Location
```
1. Disconnect
2. Select new location
3. Connect
4. Verify IP changed
```

---

**Need Help?**
- AVG Support: https://support.avg.com/
- This guide: `docs/AVG_VPN_SETUP_GUIDE.md`
- General VPN guide: `docs/VPN_INTEGRATION_GUIDE.md`

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0 - AVG Secure VPN Edition
