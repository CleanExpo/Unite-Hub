# AI Provider Guide

Complete guide to using Ollama (local) and Claude (cloud) AI providers.

---

## 🎯 Quick Comparison

| Feature | Ollama (Local) | Claude (Cloud) |
|---------|---------------|----------------|
| **Cost** | FREE | $3-75 per 1M tokens |
| **Setup** | Download models | API key required |
| **Privacy** | 100% local | Data sent to Anthropic |
| **Speed** | Depends on hardware | Very fast (hosted) |
| **Offline** | ✅ Works offline | ❌ Requires internet |
| **Quality** | Good (llama3.1:8b) | Excellent (Claude 4.5) |
| **Context** | 8K-128K tokens | 200K tokens |
| **Tool Use** | ❌ Not supported | ✅ Fully supported |

**Default**: Ollama (self-contained, no API keys)
**Upgrade**: Claude (better quality, costs money)

---

## 🦙 Ollama (Local AI)

### Overview

Ollama runs AI models locally on your machine. No internet required, no API keys, completely free.

**Pros:**
- ✅ Free forever
- ✅ Works offline
- ✅ 100% privacy (data never leaves your machine)
- ✅ No rate limits
- ✅ Fast for small models

**Cons:**
- ❌ Requires disk space (4-70GB per model)
- ❌ Slower on low-end hardware
- ❌ Limited to open-source models
- ❌ No tool use support yet

### Installation

#### macOS/Linux

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Verify installation
ollama --version
```

#### Windows

1. Download from [ollama.com](https://ollama.com/)
2. Run installer
3. Verify: `ollama --version`

### Model Selection

#### Recommended Models

| Model | Size | RAM Needed | Speed | Quality | Use Case |
|-------|------|------------|-------|---------|----------|
| **llama3.1:8b** | 4.7GB | 8GB | Fast | Good | Default, general use |
| llama3.1:70b | 40GB | 64GB | Slow | Excellent | Complex reasoning |
| phi3:mini | 2.3GB | 4GB | Very fast | Fair | Testing, quick tasks |
| mistral:7b | 4.1GB | 8GB | Fast | Good | Alternative to llama |
| codellama:13b | 7.4GB | 16GB | Medium | Good | Code generation |

#### Embedding Models

| Model | Size | Dimensions | Use Case |
|-------|------|------------|----------|
| **nomic-embed-text** | 274MB | 768 | Default, general embeddings |
| mxbai-embed-large | 670MB | 1024 | Higher quality |
| all-minilm | 45MB | 384 | Fast, lightweight |

### Configuration

Edit `.env`:

```env
# AI Provider
AI_PROVIDER=ollama

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

### Usage

#### Pull Models

```bash
# Pull generation model
ollama pull llama3.1:8b

# Pull embedding model
ollama pull nomic-embed-text

# List downloaded models
ollama list

# Remove model
ollama rm llama3.1:70b
```

#### Run Ollama Service

```bash
# Start Ollama server
ollama serve

# Run in background (macOS/Linux)
ollama serve &

# Windows: Ollama runs as service automatically
```

#### Test Models

```bash
# Test generation
ollama run llama3.1:8b "Write a haiku about coding"

# Test via API
curl http://localhost:11434/api/generate \
  -d '{
    "model": "llama3.1:8b",
    "prompt": "Why is the sky blue?",
    "stream": false
  }'

# Test embeddings
curl http://localhost:11434/api/embeddings \
  -d '{
    "model": "nomic-embed-text",
    "prompt": "Hello world"
  }'
```

### Performance Tuning

#### Optimize for Speed

```env
# Use smaller model
OLLAMA_MODEL=phi3:mini

# Reduce context window (if model supports it)
# Edit in code or use API parameters
```

#### Optimize for Quality

```env
# Use larger model (if you have RAM)
OLLAMA_MODEL=llama3.1:70b

# Increase temperature for creativity
# temperature=0.8 (in API calls)

# Increase context window
# num_ctx=32000 (in API calls)
```

#### GPU Acceleration

Ollama automatically uses GPU if available:
- **NVIDIA**: CUDA support built-in
- **AMD**: ROCm support (Linux)
- **Apple**: Metal support (M1/M2/M3)

```bash
# Check GPU usage
nvidia-smi  # NVIDIA
rocm-smi    # AMD
```

---

## 🤖 Claude (Cloud AI)

### Overview

Claude by Anthropic is a powerful cloud-based AI. Better quality than local models, but costs money.

**Pros:**
- ✅ Excellent quality (best in class)
- ✅ Very fast (hosted infrastructure)
- ✅ Large context window (200K tokens)
- ✅ Tool use support
- ✅ No local resources needed

**Cons:**
- ❌ Costs money ($3-75 per 1M tokens)
- ❌ Requires internet connection
- ❌ Data sent to Anthropic
- ❌ Rate limits apply
- ❌ Requires API key

### Setup

#### 1. Get API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create account (requires email + phone)
3. Go to API Keys section
4. Create new key
5. Copy key (starts with `sk-ant-`)

#### 2. Configure Environment

Edit `.env`:

```env
# Switch to Claude
AI_PROVIDER=anthropic

# Add API key
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

#### 3. Restart Backend

```bash
# Restart to load new config
pnpm dev
```

### Model Selection

| Model | ID | Cost (Input/Output) | Use Case |
|-------|-----|---------------------|----------|
| **Claude Sonnet 4.5** | claude-sonnet-4-5-20250929 | $3/$15 per 1M tokens | Recommended, balanced |
| Claude Opus 4.5 | claude-opus-4-5-20251101 | $15/$75 per 1M tokens | Complex reasoning |
| Claude Haiku 4.5 | claude-haiku-4-5-20251001 | $0.25/$1.25 per 1M tokens | Fast, simple tasks |

### Configuration

The template automatically uses the right model based on task complexity:

```python
# In code (apps/backend/src/models/selector.py)
selector = ModelSelector()

# Simple task → Haiku (cheap, fast)
client = selector.select_for_task("simple")

# Moderate task → Sonnet (balanced)
client = selector.select_for_task("moderate")

# Complex task → Opus (expensive, best)
client = selector.select_for_task("complex")
```

### Cost Estimation

#### Example Usage Costs

**Typical Request:**
- Prompt: 1,000 tokens
- Response: 500 tokens

**Costs per request:**
- Haiku: $0.00025 + $0.00063 = **$0.00088**
- Sonnet: $0.003 + $0.0075 = **$0.0105**
- Opus: $0.015 + $0.0375 = **$0.0525**

**Monthly costs** (1,000 requests/month):
- Haiku: **$0.88/month**
- Sonnet: **$10.50/month**
- Opus: **$52.50/month**

#### Cost Control

```env
# Set spending limits in Anthropic console
# https://console.anthropic.com/settings/limits

# Use cheaper models by default
# Edit selector.py to prefer Haiku
```

### Embeddings

**Important**: Claude does NOT provide embeddings.

**Options:**
1. Keep using Ollama for embeddings (recommended)
2. Use OpenAI embeddings (requires separate API key)

```env
# Use Claude for generation, Ollama for embeddings
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxx

# Embeddings still use Ollama (automatic)
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

---

## 🔄 Switching Between Providers

### Runtime Switching

```python
# In your code
from src.models.selector import ModelSelector

selector = ModelSelector()

# Use Ollama explicitly
ollama_client = selector.get_client("ollama")

# Use Claude explicitly
claude_client = selector.get_client("anthropic", "sonnet")

# Auto-select based on settings
client = selector.get_client()  # Uses AI_PROVIDER from .env
```

### Environment-Based

```bash
# Development: Use Ollama (free)
AI_PROVIDER=ollama
pnpm dev

# Production: Use Claude (better quality)
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxx
pnpm dev
```

### Per-Request

```python
# The provider layer supports this
async def my_function(use_cloud: bool = False):
    provider = "anthropic" if use_cloud else "ollama"
    client = selector.get_client(provider)

    response = await client.complete("Your prompt here")
    return response
```

---

## 🧪 Testing & Comparison

### Quality Comparison

```bash
# Test with Ollama
AI_PROVIDER=ollama pnpm dev
# Run your test prompts

# Test with Claude
AI_PROVIDER=anthropic pnpm dev
# Run same prompts, compare results
```

### Performance Benchmarks

**Ollama (llama3.1:8b on M2 Mac)**
- Simple query (50 tokens): ~2 seconds
- Complex query (500 tokens): ~15 seconds
- Embeddings: ~100ms

**Claude (Sonnet 4.5)**
- Simple query: ~500ms
- Complex query: ~2 seconds
- Embeddings: N/A (use Ollama)

---

## 🎯 Recommendations

### For Development

**Use Ollama:**
- ✅ Free
- ✅ Fast iteration
- ✅ No rate limits
- ✅ Works offline

### For Production (MVP)

**Start with Ollama:**
- ✅ $0 operating cost
- ✅ Full privacy
- ✅ Good enough for most tasks

**Upgrade to Claude when:**
- Need better quality responses
- Tool use is required
- Have budget for API costs
- Need 200K context window

### For Production (Scale)

**Use Claude:**
- ✅ Consistent quality
- ✅ Hosted infrastructure
- ✅ Better tool use
- ✅ No server management

**Hybrid Approach:**
- Use Ollama for simple tasks (free)
- Use Claude for complex tasks (quality)
- Switch based on task type

---

## 🔧 Troubleshooting

### Ollama Issues

**Model download fails:**
```bash
# Check disk space
df -h

# Clear cache
rm -rf ~/.ollama/models/*

# Re-download
ollama pull llama3.1:8b
```

**Slow generation:**
```bash
# Use smaller model
ollama pull phi3:mini

# Check CPU/RAM usage
top
htop

# Close other applications
```

### Claude Issues

**API key invalid:**
```bash
# Check key format (starts with sk-ant-)
echo $ANTHROPIC_API_KEY

# Regenerate key in console
# https://console.anthropic.com/settings/keys
```

**Rate limit errors:**
```bash
# Wait and retry (rate limits reset)
# Or upgrade plan in console

# Add retry logic in code
# (already implemented in provider)
```

**High costs:**
```bash
# Check usage dashboard
# https://console.anthropic.com/usage

# Set spending limits
# https://console.anthropic.com/settings/limits

# Switch to cheaper model
# Use Haiku instead of Opus
```

---

## 📚 Additional Resources

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Ollama Model Library](https://ollama.com/library)
- [Claude Documentation](https://docs.anthropic.com/)
- [Claude Pricing](https://anthropic.com/pricing)
- [Claude API Reference](https://docs.anthropic.com/claude/reference/)

---

**Questions?** Check the main README or create an issue on GitHub.
