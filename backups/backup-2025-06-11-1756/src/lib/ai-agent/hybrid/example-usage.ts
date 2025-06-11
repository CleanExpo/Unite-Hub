import { hybridAI } from './hybrid-ai-system';

// Example: Basic usage with default provider
async function basicExample() {
  try {
    const response = await hybridAI.generateResponse(
      'What are the key benefits of using a hybrid AI system?'
    );
    
    console.log('Response:', response.content);
    console.log('Provider:', response.provider);
    console.log('Model:', response.model);
    console.log('Tokens used:', response.usage?.total_tokens);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example: Using specific provider (OpenRouter with DeepSeek)
async function deepSeekExample() {
  try {
    const response = await hybridAI.generateWithDeepSeek(
      'Explain quantum computing in simple terms',
      {
        temperature: 0.5,
        maxTokens: 500,
      }
    );
    
    console.log('DeepSeek Response:', response.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example: Using Claude via OpenRouter
async function claudeExample() {
  try {
    const response = await hybridAI.generateWithClaude(
      'Write a haiku about artificial intelligence',
      {
        temperature: 0.8,
        maxTokens: 100,
      }
    );
    
    console.log('Claude Response:', response.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example: Check configuration
function checkConfiguration() {
  console.log('AI System Configured:', hybridAI.isConfigured());
  console.log('Available Providers:', hybridAI.getAvailableProviders());
}

// Example: Custom provider and model selection
async function customProviderExample() {
  try {
    const response = await hybridAI.generateResponse(
      'What is the future of AI?',
      {
        provider: 'openrouter',
        model: 'google/gemini-pro', // Use a different model via OpenRouter
        temperature: 0.7,
        maxTokens: 800,
      }
    );
    
    console.log('Custom Model Response:', response.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples
if (require.main === module) {
  checkConfiguration();
  
  // Uncomment to run examples (requires API keys in .env)
  // basicExample();
  // deepSeekExample();
  // claudeExample();
  // customProviderExample();
}

export {
  basicExample,
  deepSeekExample,
  claudeExample,
  customProviderExample,
  checkConfiguration,
};
