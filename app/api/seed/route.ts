import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
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

    return NextResponse.json({ message: "Seeding categories completed successfully!" });
  } catch (error: any) {
    console.error("Seed API Error:", error);
    return NextResponse.json({ error: error.message || "Gagal melakukan seeding." }, { status: 500 });
  }
}
