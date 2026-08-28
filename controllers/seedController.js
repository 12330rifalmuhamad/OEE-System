const { db } = require("../lib/db");

async function seedCategories(req, res) {
  try {
    const categories = [
      { code: "PR", name: "Production" },
      { code: "SH", name: "Scheduled Shutdown" },
      { code: "BR", name: "Breakdown" },
      { code: "SE", name: "Setup / Changeover" },
      { code: "MI", name: "Minor Stoppages" },
      { code: "CT", name: "Change Tool" },
      { code: "OT", name: "Other Downtime" },
      { code: "ST", name: "Standby" },
    ];

    console.log("Seeding activity categories via API...");

    for (const cat of categories) {
      await db.activityCategory.upsert({
        where: { code: cat.code },
        update: { name: cat.name },
        create: { code: cat.code, name: cat.name },
      });
    }

    return res.json({ message: "Seeding categories completed successfully!" });
  } catch (error) {
    console.error("Seed API Error:", error);
    return res.status(500).json({ error: error.message || "Gagal melakukan seeding." });
  }
}

module.exports = {
  seedCategories,
};
