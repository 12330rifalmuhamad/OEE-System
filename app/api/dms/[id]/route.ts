import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT: Perbarui status atau detail tindakan DMS
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const idInt = parseInt(params.id, 10);
    const { actionPlan, pic, targetDate, status } = await request.json();

    const existing = await db.dmsAction.findFirst({
      where: { id: idInt, companyId: user.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tindakan DMS tidak ditemukan." }, { status: 404 });
    }

    const dmsAction = await db.dmsAction.update({
      where: { id: idInt },
      data: {
        actionPlan: actionPlan !== undefined ? actionPlan.trim() : existing.actionPlan,
        pic: pic !== undefined ? pic.trim() : existing.pic,
        targetDate: targetDate !== undefined ? (targetDate ? new Date(targetDate) : null) : existing.targetDate,
        status: status !== undefined ? status.toUpperCase() : existing.status,
      },
    });

    return NextResponse.json({ message: "Tindakan DMS berhasil diperbarui.", dmsAction });
  } catch (error) {
    console.error("PUT DmsAction Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui tindakan DMS." }, { status: 500 });
  }
}

// DELETE: Hapus tindakan DMS
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const idInt = parseInt(params.id, 10);

    const existing = await db.dmsAction.findFirst({
      where: { id: idInt, companyId: user.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tindakan DMS tidak ditemukan." }, { status: 404 });
    }

    await db.dmsAction.delete({
      where: { id: idInt },
    });

    return NextResponse.json({ message: "Tindakan DMS berhasil dihapus." });
  } catch (error) {
    console.error("DELETE DmsAction Error:", error);
    return NextResponse.json({ error: "Gagal menghapus tindakan DMS." }, { status: 500 });
  }
}
