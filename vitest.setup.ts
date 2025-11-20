import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Note: cleanup is handled automatically by @testing-library/react with jsdom
// See: https://testing-library.com/docs/react-testing-library/api/#cleanup
