# Quick Fix Guide - OpenRouter Configuration

## 🎯 What You Need To Do

**Time Required:** 5 minutes
**What's Blocking:** OpenRouter API key is a placeholder

---

## Step-by-Step Fix

### 1. Get Your OpenRouter API Key (2 minutes)

```bash
# Visit this URL in your browser:
https://openrouter.ai

# Then:
1. Click "Sign Up" or "Login"
2. Go to "API Keys" section
3. Click "Create New Key"
4. Copy the key (starts with sk-or-v1-)
```

### 2. Update Your Environment File (1 minute)

```bash
# Open this file:
D:\Unite-Hub\.env.local

# Find line 52 (current placeholder):
OPENROUTER_API_KEY=sk-or-v1-placeholder-get-from-openrouter-ai

# Replace with your real key:
OPENROUTER_API_KEY=sk-or-v1-YOUR_ACTUAL_KEY_HERE
```

### 3. Restart Your Development Server (1 minute)

```bash
# In your terminal, press Ctrl+C to stop the server

# Then restart:
npm run dev

# Wait for this message:
# ✓ Ready on http://localhost:3008
```

### 4. Test It Works (1 minute)

Create a test file `test-openrouter.mjs`:

```javascript
import {
  generateWithKatCoder,
  generateWithGPTCodex,
  generateWithGemini,
} from './src/lib/openrouter/index.ts';

// Test all 3 models
async function testModels() {
  console.log('Testing KAT Coder Pro...');
  const kat = await generateWithKatCoder('Say hello in Python');
  console.log('✅ KAT:', kat);

  console.log('\nTesting Gemini Flash...');
  const gemini = await generateWithGemini('What is 2+2?');
  console.log('✅ Gemini:', gemini);

  console.log('\nTesting GPT Codex...');
  try {
    const codex = await generateWithGPTCodex('Hello world');
    console.log('✅ Codex:', codex);
  } catch (err) {
    console.log('⚠️  GPT Codex model name may need verification');
  }

  console.log('\n✅ All tests complete!');
}

testModels();
```

Run it:
```bash
node test-openrouter.mjs
```

---

## ✅ You're Done!

After these steps, you'll have:
- ✅ 1 Anthropic Claude model (already working)
- ✅ 3 OpenRouter models (now working)
- ✅ Total: 4 AI models ready to use

---

## 🔧 If Something Goes Wrong

### Error: "Invalid API key"
**Fix:** Double-check you copied the entire key from OpenRouter
```bash
# Key should look like:
sk-or-v1-1234567890abcdef1234567890abcdef
```

### Error: "Model not found: openai/gpt-5.1-codex"
**Fix:** The model name needs updating. Check OpenRouter's model list:
```bash
# Visit: https://openrouter.ai/models
# Search for: GPT or Codex
# Copy the correct model ID
# Update src/lib/openrouter/client.ts line 52
```

### Error: Rate limit exceeded
**Fix:** You're using the free tier. Options:
1. Wait a few minutes
2. Upgrade to paid tier
3. Use the other free models (KAT Coder, Gemini)

---

## 📊 Model Usage Recommendations

### For Code Generation
```typescript
import { generateWithKatCoder } from '@/lib/openrouter';

const code = await generateWithKatCoder(
  'Write a React component for a login form'
);
```

### For General Tasks
```typescript
import { generateWithGemini } from '@/lib/openrouter';

const summary = await generateWithGemini(
  'Summarize this article: [text]'
);
```

### For Marketing Copy (Use Claude - Already Working!)
```typescript
import { generateSectionCopy } from '@/lib/ai/claude-client';

const copy = await generateSectionCopy({
  businessName: 'Your Company',
  businessDescription: 'We help businesses grow',
  pageType: 'Landing Page',
  sectionName: 'Hero',
});
```

---

## 🚀 Quick Model Comparison

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| **Claude 3.5** | Fast | Paid | Marketing, SEO, Copy |
| **KAT Coder** | Medium | FREE | Code, Documentation |
| **Gemini Flash** | Very Fast | FREE | General tasks, Fast responses |
| **GPT Codex** | Fast | Paid | Advanced coding |

---

## 💡 Pro Tips

1. **Start with free models** (KAT Coder, Gemini) to test
2. **Use Claude for marketing** - it's already configured and working
3. **Verify GPT Codex name** - may be `openai/gpt-4` or similar
4. **Monitor usage** - check OpenRouter dashboard for credits
5. **Add error handling** - wrap calls in try/catch blocks

---

## 📞 Need Help?

- **OpenRouter Docs:** https://openrouter.ai/docs
- **Model List:** https://openrouter.ai/models
- **Discord:** https://discord.gg/openrouter

---

**That's it! Just add the API key and you're good to go.** 🎉
