const { describe, test, expect, beforeEach } = require('bun:test');
const { mockPrismaClient, createTestContext } = require('./setup');
const { 
  getUserById, 
  allUser, 
  getCourseById, 
  allCourse,
  getAssignmentById,
  allAssignment 
} = require('../src/resolvers/Query');

describe('User Queries', () => {
  test('getUserById should return a user', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '123456789',
      role: { id: 3, name: 'Student' }
    };
    
    mockPrismaClient.user.findUnique.mockResolvedValueOnce(mockUser);
    
    const context = createTestContext();
    const result = await getUserById(null, { id: 1 }, context);
    
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.username).toBe('testuser');
    expect(result.role.name).toBe('Student');
  });
  
  test('allUser should return all users', async () => {
    const mockUsers = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        phone: '123456789',
        role: { id: 1, name: 'Admin' }
      },
      {
        id: 2,
        username: 'teacher',
        email: 'teacher@example.com',
        firstName: 'Teacher',
        lastName: 'User',
        phone: '987654321',
        role: { id: 2, name: 'Teacher' }
      }
    ];
    
    mockPrismaClient.user.findMany.mockResolvedValueOnce(mockUsers);
    
    const context = createTestContext();
    const result = await allUser(null, {}, context);
    
    expect(result).toHaveLength(2);
    expect(result[0].username).toBe('admin');
    expect(result[1].username).toBe('teacher');
  });
  
  test('allUser with roleId filter should filter users by role', async () => {
    const mockUsers = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        phone: '123456789',
        role: { id: 1, name: 'Admin' }
      },
      {
        id: 2,
        username: 'teacher',
        email: 'teacher@example.com',
        firstName: 'Teacher',
        lastName: 'User',
        phone: '987654321',
        role: { id: 2, name: 'Teacher' }
      }
    ];
    
    mockPrismaClient.user.findMany.mockResolvedValueOnce(mockUsers);
    
    const context = createTestContext();
    const result = await allUser(null, { filterInput: { roleId: 1 } }, context);
    
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('admin');
  });
});

describe('Course Queries', () => {
  test('getCourseById should return a course with details', async () => {
    const mockCourse = {
      id: 1,
      name: 'Test Course',
      startDate: new Date(),
      endDate: new Date(),
      description: 'Course description',
      instructor: {
        id: 2,
        username: 'teacher'
      }
    };
    
    const mockStudentCourses = [
      {
        student: {
          id: 3,
          username: 'student1'
        }
      },
      {
        student: {
          id: 4,
          username: 'student2'
        }
      }
    ];
    
    const mockGroups = [
      {
        id: 1,
        name: 'Group 1',
        studentGroup: [
          {
            student: {
              id: 3,
              username: 'student1'
            }
          }
        ]
      }
    ];
    
    mockPrismaClient.course.findUnique.mockResolvedValueOnce(mockCourse);
    mockPrismaClient.studentCourse.findMany.mockResolvedValueOnce(mockStudentCourses);
    mockPrismaClient.group.findMany.mockResolvedValueOnce(mockGroups);
    
    const context = createTestContext();
    const result = await getCourseById(null, { id: 1 }, context);
    
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.name).toBe('Test Course');
    expect(result.students).toHaveLength(2);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].students).toHaveLength(1);
  });
  
  test('allCourse should return all courses', async () => {
    const mockCourses = [
      {
        id: 1,
        name: 'Course 1',
        startDate: new Date(),
        endDate: new Date(),
        description: 'Course 1 description',
        instructor: {
          id: 2,
          username: 'teacher1',
          email: 'teacher1@example.com',
          firstName: 'Teacher',
          lastName: 'One',
          phone: '123456789'
        }
      },
      {
        id: 2,
        name: 'Course 2',
        startDate: new Date(),
        endDate: new Date(),
        description: 'Course 2 description',
        instructor: {
          id: 3,
          username: 'teacher2',
          email: 'teacher2@example.com',
          firstName: 'Teacher',
          lastName: 'Two',
          phone: '987654321'
        }
      }
    ];
    
    mockPrismaClient.course.findMany.mockResolvedValueOnce(mockCourses);
    
    const context = createTestContext();
    const result = await allCourse(null, {}, context);
    
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Course 1');
    expect(result[1].name).toBe('Course 2');
  });
});

describe('Assignment Queries', () => {
  test('getAssignmentById should return assignment details', async () => {
    const mockAssignment = {
      id: 1,
      name: 'Test Assignment',
      description: 'Assignment description',
      dueDate: new Date(),
      assignmentAttachment: [
        { id: 1, name: 'attachment1.pdf' }
      ],
      course: {
        id: 1,
        name: 'Test Course',
        startDate: new Date(),
        endDate: new Date(),
        description: 'Course description',
        instructor: {
          id: 2,
          username: 'teacher',
          email: 'teacher@example.com',
          firstName: 'Teacher',
          lastName: 'User',
          phone: '123456789'
        },
        group: [
          { id: 1, name: 'Group 1' }
        ]
      }
    };
    
    const mockStudentAssignments = [
      {
        id: 1,
        status: 'ASSIGNED',
        group: {
          id: 1,
          name: 'Group 1',
          studentGroup: [
            {
              student: {
                id: 3,
                username: 'student1'
              }
            }
          ]
        }
      }
    ];
    
    mockPrismaClient.assignment.findUnique.mockResolvedValueOnce(mockAssignment);
    mockPrismaClient.studentAssignment.findMany.mockResolvedValueOnce(mockStudentAssignments);
    
    const context = createTestContext();
    const result = await getAssignmentById(null, { id: 1 }, context);
    
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.name).toBe('Test Assignment');
    expect(result.course.name).toBe('Test Course');
    expect(result.studentAssignments).toHaveLength(1);
    expect(result.studentAssignments[0].assignedFor.name).toBe('Group 1');
  });
});