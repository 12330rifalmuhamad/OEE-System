import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Ambil target KPI Company user (atau default jika belum dikonfigurasi)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    let kpiTarget = await db.kpiTarget.findUnique({
      where: { companyId: user.companyId },
    });

    // Jika belum ada di database, kirim nilai default industri
    if (!kpiTarget) {
      kpiTarget = {
        id: "default",
        companyId: user.companyId,
        oeeTarget: 85.0,
        availTarget: 90.0,
        perfTarget: 95.0,
        qualTarget: 99.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return NextResponse.json({ kpiTarget });
  } catch (error) {
    console.error("GET KpiTargets Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data KPI Target." }, { status: 500 });
  }
}

// POST/PUT: Konfigurasi target KPI Company (Hanya OWNER / MANAGER)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Hanya OWNER atau MANAGER yang diizinkan." }, { status: 403 });
    }

    const { oeeTarget, availTarget, perfTarget, qualTarget } = await request.json();

    const kpiTarget = await db.kpiTarget.upsert({
      where: { companyId: user.companyId },
      update: {
        oeeTarget: parseFloat(oeeTarget) || 85.0,
        availTarget: parseFloat(availTarget) || 90.0,
        perfTarget: parseFloat(perfTarget) || 95.0,
        qualTarget: parseFloat(qualTarget) || 99.0,
      },
      create: {
        companyId: user.companyId,
        oeeTarget: parseFloat(oeeTarget) || 85.0,
        availTarget: parseFloat(availTarget) || 90.0,
        perfTarget: parseFloat(perfTarget) || 95.0,
        qualTarget: parseFloat(qualTarget) || 99.0,
      },
    });

    return NextResponse.json({ message: "Target KPI berhasil diperbarui.", kpiTarget });
  } catch (error) {
    console.error("POST KpiTargets Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui Target KPI." }, { status: 500 });
  }
}
