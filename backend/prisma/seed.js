import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@ncc.gov.in" },
    update: {},
    create: {
      email: "admin@ncc.gov.in",
      password,
      role: "SUPER_ADMIN",
      isAdmin: true,
    },
  });

  const unitUser = await prisma.user.create({
    data: { email: "rajesh.kumar@ncc.gov.in", password, role: "UNIT_OFFICER", isUnit: true },
  });

  const unit = await prisma.unit.create({
    data: {
      unitCode: "UNIT-001",
      name: "4 Delhi BN NCC",
      spocName: "Maj. Rajesh Kumar",
      spocPhone: "+91-98450-12345",
      spocEmail: "rajesh.kumar@ncc.gov.in",
      userId: unitUser.id,
    },
  });

  const schoolUser = await prisma.user.create({
    data: { email: "principal.molarband@delhischool.edu", password, role: "SCHOOL_HEAD", isSchool: true },
  });

  const school = await prisma.school.create({
    data: {
      code: "NCC-SC-00101",
      name: "GBSSS Molarband",
      address: "Molarband, Badarpur, New Delhi - 110044",
      headName: "Dr. Ramesh Sharma",
      headDesignation: "Principal",
      headEmail: "principal.molarband@delhischool.edu",
      headPhone: "+91-98111-22334",
      userId: schoolUser.id,
      unitAllocations: { create: [{ unitId: unit.id, studentCount: 120 }] },
    },
  });

  const biscuitSku = await prisma.sku.create({
    data: {
      skuCode: "SKU-2024-001",
      name: "Glucose Biscuit Pack (100g)",
      category: "Food",
      costPrice: 15.0,
      unitOfMeasure: "Pack",
      description: "Standard energy biscuit pack",
    },
  });

  const juiceSku = await prisma.sku.create({
    data: {
      skuCode: "SKU-2024-002",
      name: "Fruit Juice Box (200ml)",
      category: "Hydration",
      costPrice: 18.0,
      unitOfMeasure: "Box",
      description: "Packaged fruit juice",
    },
  });

  await prisma.packet.create({
    data: {
      packetCode: "PKT-001",
      name: "Standard Refreshment Packet",
      category: "Standard Refreshment",
      sellingPrice: 60.0,
      totalCostPrice: 33.0,
      margin: 45.0,
      packetSkus: {
        create: [
          { skuId: biscuitSku.id, quantity: 1 },
          { skuId: juiceSku.id, quantity: 1 },
        ],
      },
    },
  });

  console.log("Seed complete:", { adminUser: adminUser.email, unit: unit.name, school: school.name });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
