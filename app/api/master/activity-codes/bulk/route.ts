import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Hanya OWNER atau MANAGER yang diizinkan." }, { status: 403 });
    }

    const { codes } = await request.json();

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json({ error: "Data kode aktivitas kosong atau tidak valid." }, { status: 400 });
    }

    // Load available categories mapping
    const categories = await db.activityCategory.findMany();
    const categoryMap = new Map(categories.map((c) => [c.code.toUpperCase(), c.id]));

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process all items sequentially
    for (let i = 0; i < codes.length; i++) {
      const item = codes[i];
      const { categoryCode, code, mainActivity, subActivity, fullDescription } = item;

      if (!categoryCode || !code || !fullDescription) {
        errorCount++;
        errors.push(`Baris ${i + 1}: Kategori, Kode, dan Deskripsi wajib diisi.`);
        continue;
      }

      const categoryId = categoryMap.get(categoryCode.toString().toUpperCase().trim());
      if (!categoryId) {
        errorCount++;
        errors.push(`Baris ${i + 1}: Kategori '${categoryCode}' tidak valid.`);
        continue;
      }

      const normalizedCode = code.toString().toLowerCase().trim();

      // Check if it already exists for this company
      const existing = await db.activityCode.findFirst({
        where: {
          companyId: user.companyId,
          code: normalizedCode,
        },
      });

      if (existing) {
        // Update existing record
        await db.activityCode.update({
          where: { id: existing.id },
          data: {
            categoryId,
            mainActivity: mainActivity ? mainActivity.toString().trim() : null,
            subActivity: subActivity ? subActivity.toString().trim() : null,
            fullDescription: fullDescription.toString().trim(),
          },
        });
        updatedCount++;
      } else {
        // Create new record
        await db.activityCode.create({
          data: {
            companyId: user.companyId,
            categoryId,
            code: normalizedCode,
            mainActivity: mainActivity ? mainActivity.toString().trim() : null,
            subActivity: subActivity ? subActivity.toString().trim() : null,
            fullDescription: fullDescription.toString().trim(),
          },
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      message: `Bulk import selesai. ${createdCount} baru dibuat, ${updatedCount} diperbarui.`,
      summary: {
        created: createdCount,
        updated: updatedCount,
        failed: errorCount,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : [], // Limit to first 10 errors for clean logs
    });
  } catch (error) {
    console.error("Bulk Import ActivityCodes Error:", error);
    return NextResponse.json({ error: "Gagal memproses bulk import." }, { status: 500 });
  }
}
