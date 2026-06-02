import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { CategoryModel, UserModel, BranchModel } from "./models";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buffer = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buffer.toString("hex")}.${salt}`;
}

export async function seed() {
  // Remove old phone numbers if exist
  await UserModel.deleteMany({ phone: "0532441566" });
  await UserModel.deleteMany({ phone: "0552469643" });
  await UserModel.deleteMany({ phone: "0567326086" });
  await UserModel.deleteMany({ phone: "567326086" });
  await UserModel.deleteMany({ phone: "567891011" });

  // Create فوجي كافيه admin user
  console.log("Seeding فوجي كافيه admin user...");
  const password = await hashPassword("123456");
  await storage.createUser({
    phone: "567891011",
    password,
    role: "admin",
    name: "فوجي كافيه",
    username: "567891011",
    email: "fugi2030@outlook.com",
    walletBalance: "0",
    addresses: [],
    permissions: [
      "orders.view", "orders.edit", "orders.refund",
      "products.view", "products.edit",
      "customers.view", "wallet.adjust",
      "reports.view", "staff.manage",
      "pos.access", "settings.manage"
    ],
    loginType: "both",
    isActive: true,
    mustChangePassword: false,
    loyaltyPoints: 0,
    loyaltyTier: "bronze",
    totalSpent: 0,
    phoneDiscountEligible: false
  });
  console.log("Admin user created with phone 567891011 and password 123456");

  const defaultCategoryData: Record<string, { nameAr: string; image: string }> = {
    ethiopian:   { nameAr: "قهوة إثيوبية",   image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=500&fit=crop&auto=format" },
    brazilian:   { nameAr: "قهوة برازيلية",  image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=500&fit=crop&auto=format" },
    yemeni:      { nameAr: "قهوة يمنية",      image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=500&fit=crop&auto=format" },
    colombian:   { nameAr: "قهوة كولومبية",   image: "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=400&h=500&fit=crop&auto=format" },
    blends:      { nameAr: "خلطات مميزة",     image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=500&fit=crop&auto=format" },
    accessories: { nameAr: "معدات القهوة",    image: "https://images.unsplash.com/photo-1572119865084-43c285814d63?w=400&h=500&fit=crop&auto=format" },
  };

  const categories = await storage.getCategories();
  if (categories.length === 0) {
    await CategoryModel.insertMany([
      { name: "Ethiopian",   slug: "ethiopian",   nameAr: "قهوة إثيوبية",   image: defaultCategoryData.ethiopian.image },
      { name: "Brazilian",   slug: "brazilian",   nameAr: "قهوة برازيلية",  image: defaultCategoryData.brazilian.image },
      { name: "Yemeni",      slug: "yemeni",      nameAr: "قهوة يمنية",      image: defaultCategoryData.yemeni.image },
      { name: "Colombian",   slug: "colombian",   nameAr: "قهوة كولومبية",   image: defaultCategoryData.colombian.image },
      { name: "Blends",      slug: "blends",      nameAr: "خلطات مميزة",     image: defaultCategoryData.blends.image },
      { name: "Accessories", slug: "accessories", nameAr: "معدات القهوة",    image: defaultCategoryData.accessories.image },
    ]);
    console.log("Fuji Cafe categories seeded");
  } else {
    // Migrate existing categories: add nameAr and image if missing
    for (const cat of categories) {
      const def = defaultCategoryData[cat.slug];
      if (def && (!cat.image || !cat.nameAr)) {
        await storage.updateCategory(cat.id, {
          nameAr: cat.nameAr || def.nameAr,
          image: cat.image || def.image,
        });
      }
    }
  }

  // ─── Default branch ──────────────────────────────────────────────────────
  const branches = await BranchModel.find().lean();
  if (branches.length === 0) {
    await BranchModel.insertMany([
      {
        name: "فرع الرئيسي - فوجي كافيه",
        nameEn: "Fuji Cafe Main Branch",
        address: "المملكة العربية السعودية",
        phone: "",
        isActive: true,
        location: { lat: 24.7136, lng: 46.6753 },
      },
    ]);
    console.log("Default Fuji Cafe branch seeded");
  }
}
