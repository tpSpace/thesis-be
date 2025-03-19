const { describe, test, expect, beforeEach, mock } = require('bun:test');
const bcrypt = require('bcryptjs');
const { mockPrismaClient, createTestContext } = require('./setup');
const { 
  signUp, 
  logIn, 
  upsertUser, 
  upsertCourse,
  registerCourse 
} = require('../src/resolvers/Mutation');

// Mock external dependencies
mock.module('bcryptjs', () => ({
  hash: async () => 'hashed_password',
  compare: async (password, hash) => {
    // For debugging, you can see what's being passed
    console.log(`Comparing ${password} with ${hash}`);
    return true; // Always return true for the test
  },
}));

mock.module('uuid', () => ({
  v4: () => 'mock-uuid',
}));

describe('Authentication Mutations', () => {
  test('signUp should create a new user and return token', async () => {
    const userInput = {
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
      phone: '123456789',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const mockUser = {
      id: 1,
      username: userInput.username,
      password: userInput.password,
      email: userInput.email,
      firstName: userInput.firstName,
      lastName: userInput.lastName,
      phone: userInput.phone,
      role: { id: 3, name: 'Student' }
    };

    mockPrismaClient.user.findUnique.mockResolvedValueOnce(null); // Username check
    mockPrismaClient.user.findUnique.mockResolvedValueOnce(null); // Email check
    mockPrismaClient.user.create.mockResolvedValueOnce(mockUser);
    mockPrismaClient.user.update.mockResolvedValueOnce(mockUser);
    
    const context = createTestContext();
    const result = await signUp(null, { userInput }, context);
    
    expect(result).toBeDefined();
    expect(result.user.username).toBe(userInput.username);
    expect(result.token).toBeDefined();
    expect(context.res.cookie).toHaveBeenCalled();
  });
  
  test('logIn should authenticate user and return token', async () => {
    const userInput = {
      username: 'testuser',
      password: 'password123',
    };
    
    const mockUser = {
      id: 1,
      username: userInput.username,
      password: '$2a$10$.Qmef/mp7NM3Xu3mB4Kl0u.E/q/bYljnt5mX8on2PGi73jIhOjZ0K', // Change to match the expected hashed value
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '123456789',
      role: { id: 3, name: 'Student' }
    };
    console.log(bcrypt.hashSync('password123', 10));
    mockPrismaClient.user.findUnique.mockResolvedValueOnce(mockUser);
    mockPrismaClient.user.update.mockResolvedValueOnce(mockUser);
    
    const context = createTestContext();
    const result = await logIn(null, { userInput }, context);
    // Remove or comment out console.log to avoid noise in test output
    // console.log('result', result); 
    
    expect(result).toBeDefined();
    expect(result.user.username).toBe(userInput.username);
    expect(result.token).toBeDefined();
    expect(context.res.cookie).toHaveBeenCalled();
  });
});

describe('User Mutations', () => {
  test('upsertUser should create a new user when id is 0', async () => {
    const userInput = {
      id: 0,
      username: 'newuser',
      password: 'newpassword',
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      phone: '987654321',
      about: 'About me',
      roleId: 3
    };
    
    process.env.ROLE_ADMIN_CODE = '1';
    const adminContext = createTestContext(1, 1); // Admin user
    
    mockPrismaClient.user.findUnique.mockResolvedValue(null); // No duplicate username/email
    mockPrismaClient.user.upsert.mockResolvedValueOnce({
      ...userInput,
      id: 5 // New ID assigned
    });
    
    const result = await upsertUser(null, { userInput }, adminContext);
    
    expect(result).toBeDefined();
    expect(result.username).toBe(userInput.username);
    expect(result.id).toBe(5);
  });
});

describe('Course Mutations', () => {
  test('upsertCourse should create a new course when id is 0', async () => {
    const courseInput = {
      id: 0,
      name: 'New Course',
      description: 'Course description',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      instructedBy: 2
    };
    
    process.env.ROLE_ADMIN_CODE = '1';
    process.env.ROLE_TEACHER_CODE = '2';
    const adminContext = createTestContext(1, 1); // Admin user
    
    mockPrismaClient.user.findUnique.mockResolvedValueOnce({
      id: 2,
      role: { id: 2 } // Teacher role
    });
    
    mockPrismaClient.course.findUnique.mockResolvedValueOnce(null); // No duplicate course name
    mockPrismaClient.course.upsert.mockResolvedValueOnce({
      ...courseInput,
      id: 3 // New ID assigned
    });
    
    const result = await upsertCourse(null, { courseInput }, adminContext);
    
    expect(result).toBeDefined();
    expect(result.name).toBe(courseInput.name);
    expect(result.id).toBe(3);
  });

  test('registerCourse should add students to a course', async () => {
    const studentId = [10, 11, 12];
    const courseId = 5;
    
    mockPrismaClient.user.findMany.mockResolvedValueOnce(
      studentId.map(id => ({ id }))
    );
    
    mockPrismaClient.course.findUnique.mockResolvedValueOnce({
      id: courseId,
      name: 'Test Course'
    });
    
    mockPrismaClient.studentCourse.createMany.mockResolvedValueOnce({ count: 3 });
    
    const context = createTestContext(1, 1); // Admin user
    const result = await registerCourse(null, { studentId, courseId }, context);
    
    expect(result).toBe(true);
    expect(mockPrismaClient.studentCourse.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        { studentId: 10, courseId: 5 },
        { studentId: 11, courseId: 5 },
        { studentId: 12, courseId: 5 }
      ])
    });
  });
});