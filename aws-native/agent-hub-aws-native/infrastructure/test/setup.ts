// Test setup file for infrastructure tests
import { jest } from '@jest/globals';

// Set test timeout for integration tests
jest.setTimeout(120000);

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  if (process.env.JEST_VERBOSE !== 'true') {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Global test configuration
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
process.env.TEST_ENVIRONMENT = process.env.TEST_ENVIRONMENT || 'dev';

// Mock AWS SDK calls for unit tests
if (process.env.NODE_ENV === 'test') {
  // Add any global mocks here if needed
}

// Helper function for async test utilities
global.waitFor = async (condition: () => boolean | Promise<boolean>, timeout = 30000, interval = 1000): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Add custom matchers if needed
expect.extend({
  toBeValidArn(received: string) {
    const arnPattern = /^arn:aws:[a-zA-Z0-9-]+:[a-zA-Z0-9-]*:\d{12}:.+$/;
    const pass = arnPattern.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ARN`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ARN`,
        pass: false,
      };
    }
  },
});

// Extend Jest matchers type
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidArn(): R;
    }
  }
  
  var waitFor: (condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number) => Promise<void>;
}