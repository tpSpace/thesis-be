const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // 1. Create roles first - check your actual t_role table structure
    const roles = [
      {
        name: "admin",
        description: "Administrator role with full access",
      },
      {
        name: "teacher",
        description: "Teacher role for educators",
      },
      {
        name: "student",
        description: "Student role for learners",
      },
    ];

    console.log("Creating roles...");
    const createdRoles = {};

    for (const role of roles) {
      const createdRole = await prisma.t_role.upsert({
        where: { name: role.name },
        update: { description: role.description },
        create: {
          name: role.name,
          description: role.description,
          // Add any other required fields from your schema
        },
      });
      createdRoles[role.name] = createdRole;
      console.log(`✅ Role created: ${role.name} (ID: ${createdRole.id})`);
    }

    // 2. Create users - ensure all required fields are included
    const users = [
      {
        username: "admin_user",
        password: "admin123",
        email: "admin@lcasystem.com",
        firstName: "Admin",
        lastName: "User",
        phone: "1234567890",
        role: "admin",
      },
      {
        username: "teacher_john",
        password: "teacher123",
        email: "john.teacher@lcasystem.com",
        firstName: "John",
        lastName: "Teacher",
        phone: "1234567891",
        role: "teacher",
      },
      {
        username: "student_jane",
        password: "student123",
        email: "jane.student@lcasystem.com",
        firstName: "Jane",
        lastName: "Student",
        phone: "1234567892",
        role: "student",
      },
    ];

    console.log("Creating users...");
    for (const userData of users) {
      // Check if user already exists
      const existingUser = await prisma.t_user.findFirst({
        where: {
          OR: [{ username: userData.username }, { email: userData.email }],
        },
      });

      if (existingUser) {
        console.log(
          `⚠️  User ${userData.username} already exists, skipping...`
        );
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user with all required fields based on your schema
      const newUser = await prisma.t_user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role_id: createdRoles[userData.role].id,
          // Add any other required fields from your t_user schema
          // For example, if you have createdAt, updatedAt (usually auto-generated)
          // If you have any NOT NULL fields without defaults, add them here
        },
        include: {
          t_role: true,
        },
      });

      console.log(
        `✅ User created: ${newUser.username} (${newUser.t_role.name})`
      );
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📋 Test Accounts Created:");
    console.log(
      "┌─────────────┬─────────────┬──────────────────────────┬─────────┐"
    );
    console.log(
      "│ Username    │ Password    │ Email                    │ Role    │"
    );
    console.log(
      "├─────────────┼─────────────┼──────────────────────────┼─────────┤"
    );
    console.log(
      "│ admin_user  │ admin123    │ admin@lcasystem.com      │ admin   │"
    );
    console.log(
      "│ teacher_john│ teacher123  │ john.teacher@lcasystem.com│ teacher │"
    );
    console.log(
      "│ student_jane│ student123  │ jane.student@lcasystem.com│ student │"
    );
    console.log(
      "└─────────────┴─────────────┴──────────────────────────┴─────────┘"
    );
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    console.error("Error details:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanDatabase() {
  try {
    console.log("🧹 Cleaning database...");

    // Delete in correct order due to foreign key constraints
    // Delete users first (they reference roles)
    await prisma.t_user.deleteMany({});
    console.log("✅ Users deleted");

    // Then delete roles
    await prisma.t_role.deleteMany({});
    console.log("✅ Roles deleted");

    console.log("🎉 Database cleaned successfully!");
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  seedDatabase,
  cleanDatabase,
};

// Run seeding if this file is executed directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === "clean") {
    cleanDatabase();
  } else {
    seedDatabase();
  }
}
