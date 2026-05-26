import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT: Perbarui data mesin
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
    const { name } = await request.json();

    // Pastikan mesin milik company user
    const existingMachine = await db.machine.findFirst({
      where: { id: idInt, companyId: user.companyId },
    });

    if (!existingMachine) {
      return NextResponse.json({ error: "Mesin tidak ditemukan." }, { status: 404 });
    }

    const updatedMachine = await db.machine.update({
      where: { id: idInt },
      data: {
        name: name !== undefined ? name : existingMachine.name,
      },
    });

    return NextResponse.json({ message: "Mesin berhasil diperbarui.", machine: updatedMachine });
  } catch (error) {
    console.error("PUT Machine Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui data mesin." }, { status: 500 });
  }
}

// DELETE: Hapus mesin
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

    // Pastikan mesin milik company user
    const existingMachine = await db.machine.findFirst({
      where: { id: idInt, companyId: user.companyId },
    });

    if (!existingMachine) {
      return NextResponse.json({ error: "Mesin tidak ditemukan." }, { status: 404 });
    }

    await db.machine.delete({
      where: { id: idInt },
    });

    return NextResponse.json({ message: "Mesin berhasil dihapus." });
  } catch (error) {
    console.error("DELETE Machine Error:", error);
    return NextResponse.json({ error: "Gagal menghapus mesin. Kemungkinan data mesin ini masih digunakan dalam transaksi produksi." }, { status: 500 });
  }
}
