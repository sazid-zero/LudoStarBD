import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Neon PostgreSQL database...");

  const adminPasswordHash = bcrypt.hashSync("admin123", 10);
  const userPasswordHash = bcrypt.hashSync("user123456", 10);

  // 1. Seed Admin
  const admin = await prisma.user.upsert({
    where: { phone: "01700000000" },
    update: {},
    create: {
      id: "admin-user-01",
      phone: "01700000000",
      passwordHash: adminPasswordHash,
      firstName: "এডমিন",
      lastName: "ম্যানেজার",
      role: "ADMIN",
      mainBalance: 50000,
      winBalance: 25000,
      referCode: "ADMIN77",
      isBanned: false,
    },
  });

  // 2. Seed Demo User
  const demoUser = await prisma.user.upsert({
    where: { phone: "01711111111" },
    update: {},
    create: {
      id: "user-01",
      phone: "01711111111",
      passwordHash: userPasswordHash,
      firstName: "রাকিব",
      lastName: "হাসান",
      role: "USER",
      mainBalance: 350,
      winBalance: 420,
      referCode: "RAKIB10",
      isBanned: false,
    },
  });

  // 3. Seed Toasin Admin
  await prisma.user.upsert({
    where: { phone: "01321063123" },
    update: {},
    create: {
      id: "admin-toasin-01",
      phone: "01321063123",
      passwordHash: bcrypt.hashSync("421500", 10),
      firstName: "Toasin",
      lastName: "Admin",
      role: "ADMIN",
      mainBalance: 50000,
      winBalance: 25000,
      referCode: "TOASIN",
      isBanned: false,
    },
  });

  // 4. Seed Top Players
  await prisma.user.upsert({
    where: { phone: "01822222222" },
    update: {},
    create: {
      id: "user-02",
      phone: "01822222222",
      passwordHash: userPasswordHash,
      firstName: "তানভীর",
      lastName: "আহমেদ",
      role: "USER",
      mainBalance: 1200,
      winBalance: 4850,
      referCode: "TANVIR55",
      isBanned: false,
    },
  });

  // 5. Seed Notice
  await prisma.notice.create({
    data: {
      id: "notice-01",
      text: "📣 স্বাগতম LudoEarn-এ! বিকাশ, নগদ ও রকেটে দ্রুততম ক্যাশইন ও ক্যাশআউট। খেলা শেষে উইন স্ক্রিনশট অবশ্যই ৫ মিনিটের মধ্যে আপলোড করুন। প্রতারকদের একাউন্ট স্থায়ীভাবে ব্যান করা হবে।",
      isActive: true,
    },
  }).catch(() => {
    // Notice might already exist
  });

  console.log("Neon PostgreSQL Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
