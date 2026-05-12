console.log("Seed script started");

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const passwordHash = await bcrypt.hash("wwpb01", 10);

  await prisma.adminUser.upsert({
    where: { username: "mike" },
    update: { passwordHash },
    create: {
      username: "mike",
      passwordHash,
    },
  });

  console.log("Admin user created");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });