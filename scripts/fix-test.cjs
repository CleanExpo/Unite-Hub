const fs = require('fs');
const path = require('path');

const testFilePath = path.join(__dirname, '../tests/unit/extended-thinking-engine.test.ts');
let content = fs.readFileSync(testFilePath, 'utf8');

const mockCode = `// Mock the Anthropic SDK before importing the engine
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            { type: "thinking", thinking: "test thinking" },
            { type: "text", text: "test result" }
          ],
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 0
          }
        })
      }
    }))
  };
});

`;

// Check if mock already added
if (!content.includes('vi.mock("@anthropic-ai/sdk"')) {
  // Insert mock after vitest import
  content = content.replace(
    'import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";',
    'import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";\n\n' + mockCode
  );
}

// Fix the engine instantiation
content = content.replace(
  'engine = new ExtendedThinkingEngine(process.env.ANTHROPIC_API_KEY || "test-key");',
  'engine = new ExtendedThinkingEngine("test-key");'
);

// Fix afterEach
content = content.replace(
  /afterEach\(\(\) => \{\s*engine\.clearOperations\(\);\s*\}\);/,
  `afterEach(() => {
    if (engine && typeof engine.clearOperations === 'function') {
      engine.clearOperations();
    }
  });`
);

fs.writeFileSync(testFilePath, content);
console.log('Test file updated successfully!');
