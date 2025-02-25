// filepath: prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const role1 = await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Admin",
      description: "Administrator role",
    },
  });

  const role2 = await prisma.role.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "Teacher",
      description: "Teacher role",
    },
  });

  const role3 = await prisma.role.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: "Student",
      description: "Student role",
    },
  });

  console.log({ role1, role2, role3 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
