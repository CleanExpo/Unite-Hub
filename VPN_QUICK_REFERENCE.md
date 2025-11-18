# VPN Integration - Quick Reference Card

**Quick commands and examples for VPN-enabled web scraping**

---

## 🚀 Setup (One-Time)

```bash
# 1. Create config template
python src/lib/scraping/vpn-integration.py create-config vpn-config.json

# 2. Edit vpn-config.json with your VPN credentials

# 3. Test VPN connection
python src/lib/scraping/vpn-integration.py test vpn-config.json

# 4. Secure it
echo "vpn-config.json" >> .gitignore
```

---

## 📋 Quick Commands

### Test VPN
```bash
python src/lib/scraping/vpn-integration.py test vpn-config.json
```

### Scrape with VPN
```bash
# Basic
python src/lib/scraping/web-scraper-vpn.py https://example.com --config vpn-config.json

# With auto-rotation
python src/lib/scraping/web-scraper-vpn.py https://example.com --config vpn-config.json --rotate

# Competitor analysis
python src/lib/scraping/web-scraper-vpn.py https://competitor.com --config vpn-config.json --competitor
```

### Playwright with VPN
```bash
# Basic
python src/lib/scraping/playwright-vpn.py https://example.com --config vpn-config.json

# Show IP + Screenshot
python src/lib/scraping/playwright-vpn.py https://example.com --config vpn-config.json --show-ip --screenshot
```

---

## 💻 Python Quick Examples

### Check Current IP
```python
from src.lib.scraping.vpn_integration import VPNManager, VPNSession

vpn_manager = VPNManager('vpn-config.json')
session = VPNSession(vpn_manager)

ip = session.get_current_ip()
print(f"IP: {ip}")
```

### Scrape with VPN
```python
from src.lib.scraping.web_scraper_vpn import VPNWebScraper

scraper = VPNWebScraper(vpn_config_file='vpn-config.json')
result = scraper.scrape_page("https://example.com")
```

### Auto-Rotate on Errors
```python
scraper = VPNWebScraper(
    vpn_config_file='vpn-config.json',
    auto_rotate=True
)
result = scraper.scrape_page("https://example.com")
```

### Manual Rotation
```python
session = VPNSession(vpn_manager)

for url in urls:
    session.rotate_vpn()
    response = session.get(url)
```

---

## ⚙️ VPN Config Template

```json
{
  "vpns": [
    {
      "name": "NordVPN US",
      "protocol": "socks5",
      "host": "us1234.nordvpn.com",
      "port": 1080,
      "username": "your_email@example.com",
      "password": "your_password",
      "enabled": true
    }
  ],
  "settings": {
    "auto_rotate": true,
    "rotation_interval_seconds": 300
  }
}
```

---

## 🌍 Popular VPN Providers

| Provider | Protocol | Host Example | Port |
|----------|----------|--------------|------|
| **NordVPN** | socks5 | us1234.nordvpn.com | 1080 |
| **ExpressVPN** | https | us-server.expressvpn.com | 443 |
| **ProxyMesh** | http | us-ca.proxymesh.com | 31280 |
| **Your VPS** | socks5 | vpn.yourdomain.com | 1080 |

---

## 🔄 Rotation Strategies

### Time-Based
```python
rotation_interval = 300  # 5 minutes
if time.time() - last_rotation > rotation_interval:
    session.rotate_vpn()
```

### Request-Based
```python
if request_count % 100 == 0:
    session.rotate_vpn()
```

### Error-Based (Automatic)
```python
scraper = VPNWebScraper(auto_rotate=True)
```

---

## 🐛 Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| Connection failed | Check host/port, test with `telnet host port` |
| Auth failed | Verify username/password |
| Slow performance | Choose closer server, try HTTP protocol |
| IP not changing | Check VPN enabled, test connection first |

---

## 📚 Full Documentation

- **Complete Guide:** `docs/VPN_INTEGRATION_GUIDE.md`
- **Scraping Guide:** `docs/WEB_SCRAPING_GUIDE.md`
- **Installation:** `VPN_INTEGRATION_COMPLETE.md`

---

**Quick Help:** `python src/lib/scraping/vpn-integration.py --help`
