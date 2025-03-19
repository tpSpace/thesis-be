const { mock } = require('bun:test');
const jwt = require('jsonwebtoken');
const { APP_SECRET } = require('../src/utils/jwt');

// Create mock function that supports chaining like jest.fn()
function createMockFn() {
  const mockFunction = mock(() => {});
  
  // Add chainable mock methods
  mockFunction.mockResolvedValueOnce = (value) => {
    mock.mockImplementationOnce(mockFunction, () => Promise.resolve(value));
    return mockFunction;
  };
  
  mockFunction.mockResolvedValue = (value) => {
    mock.mockImplementation(mockFunction, () => Promise.resolve(value));
    return mockFunction;
  };
  
  mockFunction.mockRejectedValueOnce = (error) => {
    mock.mockImplementationOnce(mockFunction, () => Promise.reject(error));
    return mockFunction;
  };
  
  mockFunction.mockReset = () => {
    mock.restore(mockFunction);
    return mockFunction;
  };
  
  return mockFunction;
}

// Mock PrismaClient with all needed methods
const mockPrismaClient = {
  user: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    upsert: createMockFn(),
  },
  role: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
  },
  course: {
    findUnique: createMockFn(),
    findMany: createMockFn(),
    upsert: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
  },
  studentCourse: {
    findMany: createMockFn(),
    createMany: createMockFn(),
    delete: createMockFn(),
    findFirst: createMockFn(),
  },
  group: {
    findUnique: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
  },
  studentGroup: {
    findUnique: createMockFn(),
    findMany: createMockFn(),
    createMany: createMockFn(),
  },
  assignment: {
    findUnique: createMockFn(),
    findMany: createMockFn(),
    upsert: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
  },
  studentAssignment: {
    findMany: createMockFn(),
    createMany: createMockFn(),
    update: createMockFn(),
    findUnique: createMockFn(),
  },
  assignmentAttachment: {
    createMany: createMockFn(),
    deleteMany: createMockFn(),
  },
  assignmentQuestion: {
    update: createMockFn(),
    create: createMockFn(),
    findMany: createMockFn(),
  },
  questionComment: {
    create: createMockFn(),
    findMany: createMockFn(),
  },
  analyzer: {
    findUnique: createMockFn(),
    findMany: createMockFn(),
    upsert: createMockFn(),
  },
  localizationReport: {
    findMany: createMockFn(),
    create: createMockFn(),
  },
  executedTest: {
    findMany: createMockFn(),
    create: createMockFn(),
  },
};

// Create test context
function createTestContext(userId = null, roleId = null) {
  const req = {
    headers: {
      authorization: userId ? `Bearer ${jwt.sign({ id: userId, roleId }, APP_SECRET)}` : null,
    },
    cookies: {
      refresh_jwt_token: userId ? 'mock-refresh-token' : null,
    },
  };
  
  const res = {
    cookie: createMockFn(),
  };
  
  return {
    req,
    res,
    prisma: mockPrismaClient,
    userId,
    roleId,
  };
}

// Reset all mocks before each test
function resetMocks() {
  Object.keys(mockPrismaClient).forEach(key => {
    if (mockPrismaClient[key]) {
      Object.keys(mockPrismaClient[key]).forEach(method => {
        if (mockPrismaClient[key][method] && mockPrismaClient[key][method].mockReset) {
          mockPrismaClient[key][method].mockReset();
        }
      });
    }
  });
}

// Export for global usage
global.jest = {
  fn: createMockFn
};

module.exports = {
  mockPrismaClient,
  createTestContext,
  resetMocks
};