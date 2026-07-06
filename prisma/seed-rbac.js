const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// Helper to parse CSV lines safely
function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV line parser that respects quotes
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
    const values = matches.map(v => v.replace(/^"|"$/g, "").trim());
    
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });
    records.push(record);
  }
  return records;
}

async function main() {
  console.log("🌱 Seeding OEE RBAC & Menu tables in PostgreSQL...");

  const dataDir = path.join(__dirname, "../../kmiplatform/Modules/Oees/Database/data");

  // 1. Seed OeeLevel
  console.log("Seeding OeeLevel...");
  const levels = parseCsv(path.join(dataDir, "mleveloees.csv"));
  for (const level of levels) {
    await prisma.oeeLevel.upsert({
      where: { id: parseInt(level.intidlevel) },
      update: { name: level.txtnamalevel },
      create: {
        id: parseInt(level.intidlevel),
        name: level.txtnamalevel,
      },
    });
  }

  // 2. Seed OeeRole
  console.log("Seeding OeeRole...");
  const roles = parseCsv(path.join(dataDir, "mroleoees.csv"));
  for (const role of roles) {
    await prisma.oeeRole.upsert({
      where: { id: parseInt(role.intidrole) },
      update: {
        userId: parseInt(role.intiduser),
        levelId: parseInt(role.intidlevel),
      },
      create: {
        id: parseInt(role.intidrole),
        userId: parseInt(role.intiduser),
        levelId: parseInt(role.intidlevel),
      },
    });
  }

  // 3. Seed OeeMenu
  console.log("Seeding OeeMenu...");
  const menus = parseCsv(path.join(dataDir, "mmenuoees.csv"));
  for (const menu of menus) {
    await prisma.oeeMenu.upsert({
      where: { id: parseInt(menu.intidmenu) },
      update: {
        name: menu.txtnamamenu,
        icon: menu.txticon || null,
        isActive: parseInt(menu.intisactivemenu) || 1,
        sorter: parseInt(menu.intsortermenu) || 0,
      },
      create: {
        id: parseInt(menu.intidmenu),
        name: menu.txtnamamenu,
        icon: menu.txticon || null,
        isActive: parseInt(menu.intisactivemenu) || 1,
        sorter: parseInt(menu.intsortermenu) || 0,
      },
    });
  }

  // 4. Seed OeeSubmenu
  console.log("Seeding OeeSubmenu...");
  const submenus = parseCsv(path.join(dataDir, "msubmenuoees.csv"));
  for (const sub of submenus) {
    await prisma.oeeSubmenu.upsert({
      where: { id: parseInt(sub.intidsubmenu) },
      update: {
        menuId: parseInt(sub.intidmenu),
        name: sub.txtnamasubmenu,
        url: sub.txturl || null,
        route: sub.txtroute || null,
        icon: sub.txticonsubmenu || null,
        isActive: parseInt(sub.intisactivesubmenu) || 1,
        sorter: parseInt(sub.intsortersubmenu) || 0,
      },
      create: {
        id: parseInt(sub.intidsubmenu),
        menuId: parseInt(sub.intidmenu),
        name: sub.txtnamasubmenu,
        url: sub.txturl || null,
        route: sub.txtroute || null,
        icon: sub.txticonsubmenu || null,
        isActive: parseInt(sub.intisactivesubmenu) || 1,
        sorter: parseInt(sub.intsortersubmenu) || 0,
      },
    });
  }

  // 5. Seed OeeAccessMenu
  console.log("Seeding OeeAccessMenu...");
  const accessMenus = parseCsv(path.join(dataDir, "maccessmenuoees.csv"));
  for (const acc of accessMenus) {
    await prisma.oeeAccessMenu.upsert({
      where: { id: parseInt(acc.intidaccessmenu) },
      update: {
        levelId: parseInt(acc.intidlevel),
        menuId: parseInt(acc.intidmenu),
      },
      create: {
        id: parseInt(acc.intidaccessmenu),
        levelId: parseInt(acc.intidlevel),
        menuId: parseInt(acc.intidmenu),
      },
    });
  }

  console.log("🎉 Seeding OEE RBAC completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding RBAC:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
