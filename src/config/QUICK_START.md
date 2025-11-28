# Founder Intelligence OS - Configuration Quick Start

## 30-Second Setup

```typescript
// 1. Import in your app entry point
import { validateAllConfigs, logConfigValidationResults } from '@/config';

// 2. Validate at startup
const validation = validateAllConfigs();
if (!validation.valid) {
  console.error('Configuration errors!');
  process.exit(1);
}

// 3. Log validation results
logConfigValidationResults();
```

## Most Common Imports

```typescript
// Get all configs in one object
import { MASTER_CONFIG } from '@/config';

// Access specific configs
import { AI_PHILL_CONFIG, SEO_LEAK_ENGINE_CONFIG } from '@/config';

// Use helper functions
import { getEnabledPlatforms, detectOpportunityType } from '@/config';
```

## Quick Examples

### Enable/Disable Modules
```bash
# .env.local
FOUNDER_OS_ENABLED=true
AI_PHILL_ENABLED=true
SEO_LEAK_ENGINE_ENABLED=true
SOCIAL_ENGAGEMENT_ENABLED=false  # Disable social monitoring
```

### Change AI Model
```bash
# Use Sonnet instead of Opus
AI_PHILL_MODEL=claude-sonnet-4-5-20250929
```

### Adjust Performance
```bash
# More aggressive for high-traffic
FOUNDER_OS_MAX_CONCURRENT_JOBS=50
EMAIL_SYNC_INTERVAL_MINUTES=5
MAX_PARALLEL_INSTANCES=20

# More conservative for low-traffic
FOUNDER_OS_MAX_CONCURRENT_JOBS=5
EMAIL_SYNC_INTERVAL_MINUTES=60
MAX_PARALLEL_INSTANCES=2
```

### Configure Specific Module

#### Social Engagement
```bash
# Disable specific platforms
SOCIAL_TWITTER_ENABLED=false
SOCIAL_TIKTOK_ENABLED=false

# Adjust sentiment threshold
NEGATIVE_SENTIMENT_ALERT_THRESHOLD=0.5
```

#### Email Ingestion
```bash
# Adjust sync frequency
EMAIL_SYNC_INTERVAL_MINUTES=30

# Set opportunity confidence
OPPORTUNITY_CONFIDENCE_THRESHOLD=0.7
```

#### Ads Automation
```bash
# Set optimization strategy
PRIMARY_OPTIMIZATION_STRATEGY=cost_per_acquisition

# Set max daily spend
MAX_DAILY_SPEND_ACROSS_PLATFORMS=5000
```

## Config Validation

```typescript
import { validateAllConfigs } from '@/config';

const results = validateAllConfigs();

// Check if all valid
if (results.valid) {
  console.log('✅ All configs valid');
} else {
  // Print errors
  Object.entries(results.results).forEach(([name, result]) => {
    if (!result.valid) {
      console.error(`❌ ${name}:`);
      result.errors.forEach(e => console.error(`  - ${e}`));
    }
  });
}
```

## Configuration Summary

```typescript
import { getConfigurationSummary } from '@/config';

const summary = getConfigurationSummary();

console.log('Enabled modules:', summary.modulesEnabled);
// ['Founder OS', 'AI Phill', 'SEO Leak Engine', ...]

console.log('Disabled modules:', summary.modulesDisabled);
// []

console.log('Critical settings:', summary.criticalSettings);
// { governance: 'HUMAN_GOVERNED', aiPhillModel: '...', ... }
```

## Module Quick Reference

| Module | Default | Key Config |
|--------|---------|-----------|
| Founder OS | Enabled | `FOUNDER_OS_GOVERNANCE_MODE` |
| AI Phill | Enabled | `AI_PHILL_MODEL` |
| SEO Leak | Enabled | `SEO_LEAK_RECOMMENDATION_INTENSITY` |
| Boost Bump | Enabled | `BOOST_BUMP_DEFAULT_GEO_TARGET` |
| Social | Enabled | Platform flags |
| Ads | Enabled | `AUTO_OPTIMIZATION_ENABLED` |
| Search | Enabled | `PRIMARY_SEARCH_ENGINE` |
| Browser | Enabled | `EXECUTION_MODE` |
| Email | Enabled | `EMAIL_SYNC_INTERVAL_MINUTES` |
| Connected Apps | Enabled | OAuth client IDs |

## Helper Functions Quick List

### AI Phill
```typescript
import { isAiPhillIntentAllowed } from '@/config';

if (isAiPhillIntentAllowed('trigger_workflows')) {
  // Can trigger workflows
}
```

### SEO Leak Engine
```typescript
import { getSeoFactorWeights } from '@/config';

const weights = getSeoFactorWeights();
// { q_star: 18, p_star: 16, t_star: 14, ... }
```

### Boost Bump
```typescript
import { getBoostBumpOptimizationWeights } from '@/config';

const weights = getBoostBumpOptimizationWeights();
```

### Social Engagement
```typescript
import { getEnabledPlatforms, getPlatformConfig } from '@/config';

const platforms = getEnabledPlatforms();
// ['facebook', 'instagram', 'linkedin', ...]

const config = getPlatformConfig('facebook');
// { name: 'Facebook', enabled: true, ... }
```

### Ads Automation
```typescript
import { getEnabledAdsPlatforms, getAdsPlatformCount } from '@/config';

const platforms = getEnabledAdsPlatforms();
const { total, enabled } = getAdsPlatformCount();
// { total: 8, enabled: 7 }
```

### Search Suite
```typescript
import { getEnabledSearchEngines, isSearchEngineEnabled } from '@/config';

const engines = getEnabledSearchEngines();
// ['google', 'bing', 'brave', 'duckduckgo']

if (isSearchEngineEnabled('google')) {
  // Track Google rankings
}
```

### Browser Automation
```typescript
import { getSupportedBrowsers, getDefaultPatterns } from '@/config';

const browsers = getSupportedBrowsers();
// ['chromium', 'firefox', 'webkit']

const patterns = getDefaultPatterns();
// 5 pre-built automation patterns
```

### Email Ingestion
```typescript
import { detectOpportunityType, getOpportunityPriority } from '@/config';

const type = detectOpportunityType('Very interested in your services!');
// 'inquiry'

const priority = getOpportunityPriority(type);
// 'high'
```

### Connected Apps
```typescript
import { getEnabledOAuthProviders, getOAuthProviderConfig } from '@/config';

const providers = getEnabledOAuthProviders();
// ['gmail', 'outlook', 'google_calendar', ...]

const config = getOAuthProviderConfig('gmail');
// { name: 'Gmail', enabled: true, ... }
```

## Common Patterns

### Check if Feature is Enabled
```typescript
import { MASTER_CONFIG } from '@/config';

if (MASTER_CONFIG.socialEngagement.SOCIAL_ENGAGEMENT_ENABLED) {
  // Use social features
}
```

### Get Dynamic Config Value
```typescript
import { getFounderOSConfig } from '@/config';

const maxBusinesses = getFounderOSConfig('FOUNDER_OS_MAX_BUSINESSES');
```

### Validate Before Using
```typescript
import { validateAiPhillConfig } from '@/config';

const { valid, errors } = validateAiPhillConfig();
if (!valid) {
  console.error('AI Phill config invalid:', errors);
}
```

### Use in API Routes
```typescript
// src/app/api/some-endpoint/route.ts
import { AI_PHILL_CONFIG } from '@/config';

export async function POST(req: Request) {
  if (!AI_PHILL_CONFIG.AI_PHILL_ENABLED) {
    return new Response('AI Phill disabled', { status: 503 });
  }

  // Use AI Phill
}
```

### Use in React Components
```typescript
// src/components/SomeComponent.tsx
import { MASTER_CONFIG, getEnabledPlatforms } from '@/config';

export function SomeComponent() {
  const platforms = getEnabledPlatforms();

  return (
    <div>
      {platforms.map(p => (
        <div key={p}>{p}</div>
      ))}
    </div>
  );
}
```

## Environment Variables Template

```bash
# .env.local

# ===== FOUNDER OS =====
FOUNDER_OS_ENABLED=true
FOUNDER_OS_GOVERNANCE_MODE=HUMAN_GOVERNED
FOUNDER_OS_MAX_BUSINESSES=50
FOUNDER_OS_SIGNAL_AGGREGATION_INTERVAL_HOURS=6

# ===== AI PHILL =====
AI_PHILL_ENABLED=true
AI_PHILL_MODEL=claude-opus-4-5-20251101
AI_PHILL_THINKING_BUDGET_TOKENS=10000
AI_PHILL_RECOMMENDATION_CONFIDENCE_THRESHOLD=0.75

# ===== SEO LEAK ENGINE =====
SEO_LEAK_ENGINE_ENABLED=true
SEO_LEAK_RECOMMENDATION_INTENSITY=standard

# ===== SOCIAL ENGAGEMENT =====
SOCIAL_ENGAGEMENT_ENABLED=true
SOCIAL_FACEBOOK_ENABLED=true
SOCIAL_INSTAGRAM_ENABLED=true
SENTIMENT_ANALYSIS_ENABLED=true

# ===== ADS AUTOMATION =====
ADS_AUTOMATION_ENABLED=true
AUTO_OPTIMIZATION_ENABLED=false
PRIMARY_OPTIMIZATION_STRATEGY=return_on_ad_spend
MAX_DAILY_SPEND_ACROSS_PLATFORMS=10000

# ===== EMAIL INGESTION =====
EMAIL_INGESTION_ENABLED=true
EMAIL_SYNC_INTERVAL_MINUTES=15
OPPORTUNITY_DETECTION_ENABLED=true

# ===== CONNECTED APPS =====
CONNECTED_APPS_ENABLED=true
OAUTH_GMAIL_CLIENT_ID=your-id
OAUTH_GMAIL_CLIENT_SECRET=your-secret
ENCRYPTION_ENABLED=true
```

## Troubleshooting

### "Cannot find name 'FOUNDER_OS_CONFIG'"
```typescript
// ❌ Wrong
import { FOUNDER_OS_CONFIG } from './founderOS.config';

// ✅ Correct
import { FOUNDER_OS_CONFIG } from '@/config';
```

### Configuration validation failing
```typescript
import { validateAllConfigs, logConfigValidationResults } from '@/config';

// See detailed errors
logConfigValidationResults();

// Or get structured results
const { results } = validateAllConfigs();
Object.entries(results).forEach(([name, result]) => {
  if (!result.valid) {
    console.error(`${name}:`, result.errors);
  }
});
```

### Module not appearing in enabled list
```typescript
// Check if environment variable is set correctly
import { MASTER_CONFIG } from '@/config';

console.log('Social enabled:', MASTER_CONFIG.socialEngagement.SOCIAL_ENGAGEMENT_ENABLED);

// Should be true, unless SOCIAL_ENGAGEMENT_ENABLED=false in env
```

## File Locations

- **Config files**: `/src/config/*.config.ts`
- **Central export**: `/src/config/index.ts`
- **Full documentation**: `/src/config/README.md`
- **Summary**: `/CONFIG_SYSTEM_SUMMARY.md`

## Next Steps

1. Copy `QUICK_START.md` template to `.env.local`
2. Run validation: `validateAllConfigs()`
3. Check results: `logConfigValidationResults()`
4. Use configs in your code!

---

For detailed documentation, see `/src/config/README.md`
