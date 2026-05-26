import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Ambil semua Activity Code dalam Company user beserta Kategorinya
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const activityCodes = await db.activityCode.findMany({
      where: { companyId: user.companyId },
      include: { category: true },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ activityCodes });
  } catch (error) {
    console.error("GET ActivityCodes Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data activity codes." }, { status: 500 });
  }
}

// POST: Tambah Activity Code baru (Hanya OWNER / MANAGER)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Hanya OWNER atau MANAGER yang diizinkan." }, { status: 403 });
    }

    const { categoryCode, code, mainActivity, subActivity, fullDescription } = await request.json();

    if (!categoryCode || !code || !fullDescription) {
      return NextResponse.json({ error: "Kategori (categoryCode), Kode, dan Deskripsi Lengkap wajib diisi." }, { status: 400 });
    }

    // Cari kategori berdasarkan categoryCode (misal: "SH", "BR")
    const category = await db.activityCategory.findUnique({
      where: { code: categoryCode.toUpperCase() },
    });

    if (!category) {
      return NextResponse.json({ error: `Kategori aktivitas dengan kode '${categoryCode}' tidak valid.` }, { status: 400 });
    }

    const activityCode = await db.activityCode.create({
      data: {
        companyId: user.companyId,
        categoryId: category.id,
        code: code.toLowerCase(),
        mainActivity: mainActivity || null,
        subActivity: subActivity || null,
        fullDescription,
      },
      include: { category: true },
    });

    return NextResponse.json({ message: "Activity Code berhasil ditambahkan.", activityCode }, { status: 201 });
  } catch (error) {
    console.error("POST ActivityCode Error:", error);
    return NextResponse.json({ error: "Gagal menambahkan Activity Code." }, { status: 500 });
  }
}
