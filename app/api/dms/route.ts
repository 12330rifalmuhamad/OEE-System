import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Ambil semua tindakan korektif DMS
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const dmsActions = await db.dmsAction.findMany({
      where: { companyId: user.companyId },
      include: {
        okpLog: {
          include: {
            machine: true,
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ dmsActions });
  } catch (error) {
    console.error("GET DmsActions Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data tindakan DMS." }, { status: 500 });
  }
}

// POST: Buat tindakan korektif DMS baru
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { okpLogId, downtimeCode, actionPlan, pic, targetDate } = await request.json();

    if (!downtimeCode || !actionPlan || !pic) {
      return NextResponse.json({ error: "Kode downtime, rencana tindakan, dan PIC wajib diisi." }, { status: 400 });
    }

    const dmsAction = await db.dmsAction.create({
      data: {
        companyId: user.companyId,
        okpLogId: okpLogId || null,
        downtimeCode: downtimeCode.toUpperCase().trim(),
        actionPlan: actionPlan.trim(),
        pic: pic.trim(),
        targetDate: targetDate ? new Date(targetDate) : null,
        status: "OPEN",
      },
    });

    return NextResponse.json({ message: "Tindakan DMS berhasil didaftarkan.", dmsAction }, { status: 201 });
  } catch (error) {
    console.error("POST DmsAction Error:", error);
    return NextResponse.json({ error: "Gagal mendaftarkan tindakan DMS." }, { status: 500 });
  }
}
