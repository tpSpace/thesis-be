const { test, mock } = require('bun:test');

// Add missing Jest-like functions to Bun's mock
mock.fn = function() {
  const mockFn = mock(() => {});
  
  mockFn.mockResolvedValueOnce = function(value) {
    return mock(() => Promise.resolve(value));
  };
  
  mockFn.mockResolvedValue = function(value) {
    return mock(() => Promise.resolve(value));
  };
  
  mockFn.mockRejectedValueOnce = function(error) {
    return mock(() => Promise.reject(error));
  };
  
  return mockFn;
};

// Export globally
global.jest = {
  fn: mock.fn
};