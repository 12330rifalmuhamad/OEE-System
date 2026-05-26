import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Ambil seluruh mesin dalam Company user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const machines = await db.machine.findMany({
      where: { companyId: user.companyId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ machines });
  } catch (error) {
    console.error("GET Machines Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data mesin." }, { status: 500 });
  }
}

// POST: Tambah mesin baru (Hanya OWNER / MANAGER)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Hanya OWNER atau MANAGER yang diizinkan." }, { status: 403 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Nama mesin wajib diisi." }, { status: 400 });
    }

    const machine = await db.machine.create({
      data: {
        companyId: user.companyId,
        name,
      },
    });

    return NextResponse.json({ message: "Mesin berhasil ditambahkan.", machine }, { status: 201 });
  } catch (error) {
    console.error("POST Machine Error:", error);
    return NextResponse.json({ error: "Gagal menambahkan mesin." }, { status: 500 });
  }
}
