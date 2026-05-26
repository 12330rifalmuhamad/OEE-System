import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Ambil daftar seluruh transaksi OKP
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const okpLogs = await db.okpLog.findMany({
      where: { companyId: user.companyId },
      include: {
        machine: true,
        product: true,
        _count: { select: { activities: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ okpLogs });
  } catch (error) {
    console.error("GET OKP Logs Error:", error);
    return NextResponse.json({ error: "Gagal mengambil riwayat transaksi OKP." }, { status: 500 });
  }
}

// POST: Buat Transaksi OKP Baru beserta daftar aktivitas/downtime di dalamnya
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const {
      okpNumber,
      date,
      shift,
      machineId,
      productId,
      groupLeader,
      operator,
      helper,
      loadingTime,
      totalOutput,
      rework,
      reject,
      sampleQc,
      activities, // Array of ActivityLog inputs
    } = await request.json();

    // 1. Validasi Input Utama
    if (!okpNumber || !date || !shift || !machineId || !productId || loadingTime === undefined || totalOutput === undefined) {
      return NextResponse.json({ error: "Kolom OKP, Tanggal, Shift, Mesin, Produk, Loading Time, dan Total Output wajib diisi." }, { status: 400 });
    }

    // 2. Cek apakah OKP Number sudah terdaftar untuk Company ini
    const existingOkp = await db.okpLog.findUnique({
      where: {
        companyId_okpNumber: {
          companyId: user.companyId,
          okpNumber,
        },
      },
    });

    if (existingOkp) {
      return NextResponse.json({ error: `OKP Number '${okpNumber}' sudah terdaftar.` }, { status: 400 });
    }

    // 3. Validasi Durasi (Total Durasi Aktivitas harus sama dengan Loading Time)
    const totalActivityDuration = activities?.reduce((sum: number, act: any) => sum + parseFloat(act.duration || 0), 0) || 0;
    if (Math.abs(totalActivityDuration - parseFloat(loadingTime)) > 0.01) {
      return NextResponse.json({
        error: `Total durasi aktivitas (${totalActivityDuration} menit) harus sama dengan Loading Time (${loadingTime} menit). Selisih: ${Math.abs(totalActivityDuration - parseFloat(loadingTime))} menit.`,
      }, { status: 400 });
    }

    // 4. Jalankan Transaksi Database untuk OKP dan ActivityLogs
    const result = await db.$transaction(async (tx) => {
      const okpLog = await tx.okpLog.create({
        data: {
          companyId: user.companyId,
          okpNumber,
          date: new Date(date),
          shift: parseInt(shift),
          machineId: parseInt(machineId as any, 10),
          productId: parseInt(productId as any, 10),
          groupLeader: groupLeader || null,
          operator: operator || null,
          helper: helper || null,
          loadingTime: parseFloat(loadingTime),
          totalOutput: parseFloat(totalOutput),
          rework: rework !== undefined ? parseFloat(rework) : 0,
          reject: reject !== undefined ? parseFloat(reject) : 0,
          sampleQc: sampleQc !== undefined ? parseFloat(sampleQc) : null,
        },
      });

      // Buat activity logs jika ada
      if (activities && activities.length > 0) {
        await tx.activityLog.createMany({
          data: activities.map((act: any) => ({
            okpLogId: okpLog.id,
            activityCodeId: parseInt(act.activityCodeId, 10),
            duration: parseFloat(act.duration),
            startTime: act.startTime ? new Date(act.startTime) : null,
            endTime: act.endTime ? new Date(act.endTime) : null,
            brRootCause: act.brRootCause || null,
            brMtdtWaiting: act.brMtdtWaiting !== undefined ? parseFloat(act.brMtdtWaiting) : null,
            brMtdtRepair: act.brMtdtRepair !== undefined ? parseFloat(act.brMtdtRepair) : null,
            brMtdtStartup: act.brMtdtStartup !== undefined ? parseFloat(act.brMtdtStartup) : null,
          })),
        });
      }

      return okpLog;
    });

    return NextResponse.json({
      message: "Transaksi OKP dan daftar aktivitas berhasil disimpan.",
      okpLogId: result.id,
    }, { status: 201 });

  } catch (error) {
    console.error("POST OKP Log Error:", error);
    return NextResponse.json({ error: "Gagal menyimpan transaksi OKP." }, { status: 500 });
  }
}
