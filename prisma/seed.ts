import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Seeding database...");

  // ---- Demo users ----
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@shop.test" },
    update: {},
    create: {
      email: "admin@shop.test",
      passwordHash,
      firstName: "Site",
      lastName: "Admin",
      role: "ADMIN",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "demo@shop.test" },
    update: {},
    create: {
      email: "demo@shop.test",
      passwordHash,
      firstName: "Demo",
      lastName: "Customer",
      phone: "+1 555 010 1234",
      cart: { create: {} },
      wishlist: { create: {} },
      addresses: {
        create: {
          type: "SHIPPING" as const,
          fullName: "Demo Customer",
          phone: "+1 555 010 1234",
          line1: "123 Market Street",
          city: "San Francisco",
          state: "CA",
          postalCode: "94103",
          country: "US",
          isDefault: true,
        },
      },
    },
  });

  // ---- Categories ----
  const categoryData = [
    { name: "Sneakers", description: "Everyday and performance sneakers" },
    { name: "Bags", description: "Backpacks, totes and travel bags" },
    { name: "Apparel", description: "Clothing for all seasons" },
    { name: "Accessories", description: "Finishing touches" },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoryData) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: {},
      create: { name: c.name, slug: slugify(c.name), description: c.description },
    });
    categories[c.name] = cat.id;
  }

  // ---- Products ----
  const products = [
    {
      name: "Aero Runner Sneaker",
      brand: "Nimbus",
      price: 79.0,
      compareAtPrice: 99.0,
      stock: 50,
      category: "Sneakers",
      featured: true,
      image: "https://picsum.photos/seed/sneaker1/600/600",
    },
    {
      name: "Trailblaze Hiking Shoe",
      brand: "Summit",
      price: 119.0,
      stock: 35,
      category: "Sneakers",
      image: "https://picsum.photos/seed/sneaker2/600/600",
    },
    {
      name: "Urban Daypack Backpack",
      brand: "Carry",
      price: 59.0,
      stock: 80,
      category: "Bags",
      featured: true,
      image: "https://picsum.photos/seed/bag1/600/600",
    },
    {
      name: "Weekend Duffel",
      brand: "Carry",
      price: 89.0,
      stock: 40,
      category: "Bags",
      image: "https://picsum.photos/seed/bag2/600/600",
    },
    {
      name: "Essential Cotton Tee",
      brand: "Basics",
      price: 24.0,
      stock: 200,
      category: "Apparel",
      image: "https://picsum.photos/seed/apparel1/600/600",
    },
    {
      name: "All-Weather Jacket",
      brand: "Summit",
      price: 149.0,
      compareAtPrice: 179.0,
      stock: 25,
      category: "Apparel",
      featured: true,
      image: "https://picsum.photos/seed/apparel2/600/600",
    },
    {
      name: "Leather Card Wallet",
      brand: "Basics",
      price: 39.0,
      stock: 120,
      category: "Accessories",
      image: "https://picsum.photos/seed/acc1/600/600",
    },
    {
      name: "Polarized Sunglasses",
      brand: "Nimbus",
      price: 49.0,
      stock: 90,
      category: "Accessories",
      image: "https://picsum.photos/seed/acc2/600/600",
    },
  ];

  let skuCounter = 1000;
  for (const p of products) {
    const slug = slugify(p.name);
    skuCounter += 1;
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        description: `${p.name} by ${p.brand}. High quality and built to last.`,
        brand: p.brand,
        sku: `SKU-${skuCounter}`,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        isFeatured: Boolean(p.featured),
        categoryId: categories[p.category],
        images: {
          create: [{ url: p.image, alt: p.name, position: 0 }],
        },
      },
    });
  }

  // ---- Coupon ----
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      description: "10% off your first order",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderValue: 30,
      maxDiscount: 50,
      usageLimit: 1000,
      isActive: true,
    },
  });

  console.log("Seed complete.");
  console.log(`  Admin login:    admin@shop.test / Password123!`);
  console.log(`  Customer login: demo@shop.test  / Password123!`);
  console.log(`  Coupon:         WELCOME10`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
