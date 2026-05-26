import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE: Hapus konfigurasi MQTT mesin berdasarkan ID config
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

    const existing = await db.mqttConfig.findFirst({
      where: { id: idInt, companyId: user.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Konfigurasi MQTT tidak ditemukan." }, { status: 404 });
    }

    await db.mqttConfig.delete({
      where: { id: idInt },
    });

    return NextResponse.json({ message: "Konfigurasi MQTT berhasil dihapus." });
  } catch (error) {
    console.error("DELETE MQTT Config Error:", error);
    return NextResponse.json({ error: "Gagal menghapus konfigurasi MQTT." }, { status: 500 });
  }
}
