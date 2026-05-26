import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT: Perbarui / Adjust data Aktivitas (Downtime/Uptime)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const activityLogId = parseInt(params.id, 10);
    if (isNaN(activityLogId)) {
      return NextResponse.json({ error: "ID Aktivitas tidak valid." }, { status: 400 });
    }

    const body = await request.json();
    const { activityCodeId, brRootCause, duration } = body;

    if (!activityCodeId) {
      return NextResponse.json({ error: "Kode Aktivitas penyesuaian wajib diisi." }, { status: 400 });
    }

    // Pastikan log aktivitas ini milik company user
    const activityLog = await db.activityLog.findUnique({
      where: { id: activityLogId },
      include: {
        okpLog: true,
      },
    });

    if (!activityLog || activityLog.okpLog.companyId !== user.companyId) {
      return NextResponse.json({ error: "Catatan aktivitas tidak ditemukan." }, { status: 404 });
    }

    // Lakukan adjustment di database
    const updated = await db.activityLog.update({
      where: { id: activityLogId },
      data: {
        activityCodeId: parseInt(activityCodeId, 10),
        brRootCause: brRootCause ? String(brRootCause).trim() : null,
        duration: duration !== undefined ? parseFloat(duration) : undefined,
      },
      include: {
        activityCode: {
          include: { category: true }
        }
      }
    });

    return NextResponse.json({
      message: "Data aktivitas berhasil disesuaikan.",
      activityLog: updated,
    });
  } catch (error) {
    console.error("PUT Activity Log Adjustment Error:", error);
    return NextResponse.json({ error: "Gagal menyesuaikan data aktivitas." }, { status: 500 });
  }
}
