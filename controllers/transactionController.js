const { db } = require("../lib/db");

async function getOkpLogs(req, res) {
  try {
    let companyId;
    if (req.user) {
      companyId = req.user.companyId;
    } else {
      const firstCompany = await db.company.findFirst();
      companyId = firstCompany ? firstCompany.id : 1;
    }

    const okpLogs = await db.okpLog.findMany({
      where: { companyId },
      include: {
        machine: true,
        product: true,
        _count: { select: { activities: true } },
      },
      orderBy: { date: "desc" },
    });
    return res.json({ okpLogs });
  } catch (error) {
    console.error("GET OKP Logs Error:", error);
    return res.status(500).json({ error: "Gagal mengambil riwayat transaksi OKP." });
  }
}

async function createOkpLog(req, res) {
  try {
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
    } = req.body;

    // 1. Validasi Input Utama
    if (!okpNumber || !date || !shift || !machineId || !productId || loadingTime === undefined || totalOutput === undefined) {
      return res.status(400).json({ error: "Kolom OKP, Tanggal, Shift, Mesin, Produk, Loading Time, dan Total Output wajib diisi." });
    }

    // 2. Cek apakah OKP Number sudah terdaftar untuk Company ini
    const existingOkp = await db.okpLog.findUnique({
      where: {
        companyId_okpNumber: {
          companyId: req.user.companyId,
          okpNumber,
        },
      },
    });

    if (existingOkp) {
      return res.status(400).json({ error: `OKP Number '${okpNumber}' sudah terdaftar.` });
    }

    // 3. Validasi Durasi (Total Durasi Aktivitas harus sama dengan Loading Time)
    const totalActivityDuration = activities?.reduce((sum, act) => sum + parseFloat(act.duration || 0), 0) || 0;
    if (Math.abs(totalActivityDuration - parseFloat(loadingTime)) > 0.01) {
      return res.status(400).json({
        error: `Total durasi aktivitas (${totalActivityDuration} menit) harus sama dengan Loading Time (${loadingTime} menit). Selisih: ${Math.abs(totalActivityDuration - parseFloat(loadingTime))} menit.`,
      });
    }

    // 4. Jalankan Transaksi Database untuk OKP dan ActivityLogs
    const result = await db.$transaction(async (tx) => {
      const okpLog = await tx.okpLog.create({
        data: {
          companyId: req.user.companyId,
          okpNumber,
          date: new Date(date),
          shift: parseInt(shift),
          machineId: parseInt(machineId, 10),
          productId: parseInt(productId, 10),
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
          data: activities.map((act) => ({
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

    return res.status(201).json({
      message: "Transaksi OKP dan daftar aktivitas berhasil disimpan.",
      okpLogId: result.id,
    });
  } catch (error) {
    console.error("POST OKP Log Error:", error);
    return res.status(500).json({ error: "Gagal menyimpan transaksi OKP." });
  }
}

async function getOkpLogDetail(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    if (isNaN(idInt)) {
      return res.status(400).json({ error: "ID OKP tidak valid." });
    }

    let companyId;
    if (req.user) {
      companyId = req.user.companyId;
    } else {
      const firstCompany = await db.company.findFirst();
      companyId = firstCompany ? firstCompany.id : 1;
    }

    const okpLog = await db.okpLog.findFirst({
      where: { id: idInt, companyId },
      include: {
        machine: true,
        product: true,
        activities: {
          include: {
            activityCode: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!okpLog) {
      return res.status(404).json({ error: "Transaksi OKP tidak ditemukan." });
    }

    return res.json({ okpLog });
  } catch (error) {
    console.error("GET OKP Log Detail Error:", error);
    return res.status(500).json({ error: "Gagal mengambil detail transaksi OKP." });
  }
}

async function adjustActivityLog(req, res) {
  try {
    const activityLogId = parseInt(req.params.id, 10);
    if (isNaN(activityLogId)) {
      return res.status(400).json({ error: "ID Aktivitas tidak valid." });
    }

    const { activityCodeId, brRootCause, duration } = req.body;

    if (!activityCodeId) {
      return res.status(400).json({ error: "Kode Aktivitas penyesuaian wajib diisi." });
    }

    // Pastikan log aktivitas ini milik company user
    const activityLog = await db.activityLog.findUnique({
      where: { id: activityLogId },
      include: {
        okpLog: true,
      },
    });

    if (!activityLog || activityLog.okpLog.companyId !== req.user.companyId) {
      return res.status(404).json({ error: "Catatan aktivitas tidak ditemukan." });
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

    return res.json({
      message: "Data aktivitas berhasil disesuaikan.",
      activityLog: updated,
    });
  } catch (error) {
    console.error("PUT Activity Log Adjustment Error:", error);
    return res.status(500).json({ error: "Gagal menyesuaikan data aktivitas." });
  }
}

module.exports = {
  getOkpLogs,
  createOkpLog,
  getOkpLogDetail,
  adjustActivityLog,
};
