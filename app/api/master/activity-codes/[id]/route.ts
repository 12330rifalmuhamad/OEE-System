import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT: Perbarui data Activity Code
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Hanya OWNER atau MANAGER yang diizinkan." }, { status: 403 });
    }

    const { id } = await params;
    const idInt = parseInt(id, 10);
    const { categoryCode, code, mainActivity, subActivity, fullDescription } = await request.json();

    // Pastikan activity code milik company user
    const existingCode = await db.activityCode.findFirst({
      where: { id: idInt, companyId: user.companyId },
    });

    if (!existingCode) {
      return NextResponse.json({ error: "Activity Code tidak ditemukan." }, { status: 404 });
    }

    // Tentukan category jika diganti
    let categoryId = existingCode.categoryId;
    if (categoryCode) {
      const category = await db.activityCategory.findUnique({
        where: { code: categoryCode.toUpperCase() },
      });
      if (!category) {
        return NextResponse.json({ error: `Kategori aktivitas dengan kode '${categoryCode}' tidak valid.` }, { status: 400 });
      }
      categoryId = category.id;
    }

    const updatedCode = await db.activityCode.update({
      where: { id: idInt },
      data: {
        categoryId,
        code: code !== undefined ? code.toLowerCase() : existingCode.code,
        mainActivity: mainActivity !== undefined ? mainActivity : existingCode.mainActivity,
        subActivity: subActivity !== undefined ? subActivity : existingCode.subActivity,
        fullDescription: fullDescription !== undefined ? fullDescription : existingCode.fullDescription,
      },
      include: { category: true },
    });

    return NextResponse.json({ message: "Activity Code berhasil diperbarui.", activityCode: updatedCode });
  } catch (error) {
    console.error("PUT ActivityCode Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui data Activity Code." }, { status: 500 });
  }
}

// DELETE: Hapus Activity Code
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Hanya OWNER atau MANAGER yang diizinkan." }, { status: 403 });
    }

    const { id } = await params;
    const idInt = parseInt(id, 10);

    // Pastikan milik company user
    const existingCode = await db.activityCode.findFirst({
      where: { id: idInt, companyId: user.companyId },
    });

    if (!existingCode) {
      return NextResponse.json({ error: "Activity Code tidak ditemukan." }, { status: 404 });
    }

    await db.activityCode.delete({
      where: { id: idInt },
    });

    return NextResponse.json({ message: "Activity Code berhasil dihapus." });
  } catch (error) {
    console.error("DELETE ActivityCode Error:", error);
    return NextResponse.json({ error: "Gagal menghapus Activity Code. Kemungkinan kode ini masih digunakan dalam catatan downtime/aktivitas produksi harian." }, { status: 500 });
  }
}
