const { db } = require("../lib/db");
const { recalculateOkpLogOee } = require("../lib/oeeHelper");
const { machineStates } = require("../lib/mqttListener");

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
        machine: {
          include: { lineProcess: true }
        },
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
      box,
      cartonCode,
      expireDate,
      noCartonAwal,
      noCartonAkhir,
      fgBtlSachet,
      totalFgTargetCtn,
      casingMdfTarget,
      mdfTarget,
      casingNnsTarget,
      nnsTarget,
      mppCount,
      tempoMin,
      rejectSachet,
      rejectPlastik,
      rejectFoil,
      rejectCarton,
      plastikLembar,
      plastikKg,
      plastikSisa,
      plastikHasil,
      cartonPcs,
      cartonLembar,
      cartonSisa,
      cartonHasil,
      totalPemakaian,
      oneRollSachet,
      outsetRoll,
      inputKembaliOkp,
      rejectKembaliOkp,
      activities, // Array of ActivityLog inputs
    } = req.body;

    const emailUser = req.user?.email || "SYSTEM";

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
          box: box !== undefined ? parseFloat(box) : null,
          cartonCode: cartonCode || null,
          expireDate: expireDate ? new Date(expireDate) : null,
          noCartonAwal: noCartonAwal !== undefined ? parseInt(noCartonAwal, 10) : null,
          noCartonAkhir: noCartonAkhir !== undefined ? parseInt(noCartonAkhir, 10) : null,
          fgBtlSachet: fgBtlSachet !== undefined ? parseFloat(fgBtlSachet) : null,
          totalFgTargetCtn: totalFgTargetCtn !== undefined ? parseFloat(totalFgTargetCtn) : null,
          casingMdfTarget: casingMdfTarget !== undefined ? parseFloat(casingMdfTarget) : null,
          mdfTarget: mdfTarget !== undefined ? parseFloat(mdfTarget) : null,
          casingNnsTarget: casingNnsTarget !== undefined ? parseFloat(casingNnsTarget) : null,
          nnsTarget: nnsTarget !== undefined ? parseFloat(nnsTarget) : null,
          mppCount: mppCount !== undefined ? parseFloat(mppCount) : null,
          tempoMin: tempoMin !== undefined ? parseFloat(tempoMin) : null,
          rejectSachet: rejectSachet !== undefined ? parseFloat(rejectSachet) : null,
          rejectPlastik: rejectPlastik !== undefined ? parseFloat(rejectPlastik) : null,
          rejectFoil: rejectFoil !== undefined ? parseFloat(rejectFoil) : null,
          rejectCarton: rejectCarton !== undefined ? parseFloat(rejectCarton) : null,
          plastikLembar: plastikLembar !== undefined ? parseFloat(plastikLembar) : null,
          plastikKg: plastikKg !== undefined ? parseFloat(plastikKg) : null,
          plastikSisa: plastikSisa !== undefined ? parseFloat(plastikSisa) : null,
          plastikHasil: plastikHasil !== undefined ? parseFloat(plastikHasil) : null,
          cartonPcs: cartonPcs !== undefined ? parseFloat(cartonPcs) : null,
          cartonLembar: cartonLembar !== undefined ? parseFloat(cartonLembar) : null,
          cartonSisa: cartonSisa !== undefined ? parseFloat(cartonSisa) : null,
          cartonHasil: cartonHasil !== undefined ? parseFloat(cartonHasil) : null,
          totalPemakaian: totalPemakaian !== undefined ? parseFloat(totalPemakaian) : null,
          oneRollSachet: oneRollSachet !== undefined ? parseFloat(oneRollSachet) : null,
          outsetRoll: outsetRoll !== undefined ? parseFloat(outsetRoll) : null,
          inputKembaliOkp: inputKembaliOkp !== undefined ? parseFloat(inputKembaliOkp) : null,
          rejectKembaliOkp: rejectKembaliOkp !== undefined ? parseFloat(rejectKembaliOkp) : null,
          createdBy: emailUser,
          updatedBy: emailUser,
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
            createdBy: emailUser,
            updatedBy: emailUser,
          })),
        });
      }

      // Recalculate OEE metrics physically in DB
      await recalculateOkpLogOee(okpLog.id, tx);

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
        machine: {
          include: { lineProcess: true }
        },
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

    const {
      activityCodeId,
      brRootCause,
      duration,
      brMtdtWaiting,
      brMtdtRepair,
      brMtdtStartup
    } = req.body;

    if (!activityCodeId) {
      return res.status(400).json({ error: "Kode Aktivitas penyesuaian wajib diisi." });
    }

    const emailUser = req.user?.email || "SYSTEM";

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
        brMtdtWaiting: brMtdtWaiting !== undefined ? parseFloat(brMtdtWaiting) : null,
        brMtdtRepair: brMtdtRepair !== undefined ? parseFloat(brMtdtRepair) : null,
        brMtdtStartup: brMtdtStartup !== undefined ? parseFloat(brMtdtStartup) : null,
        updatedBy: emailUser,
      },
      include: {
        activityCode: {
          include: { category: true }
        }
      }
    });

    // Recalculate OEE parameters physically in DB
    await recalculateOkpLogOee(activityLog.okpLogId, db);

    return res.json({
      message: "Data aktivitas berhasil disesuaikan.",
      activityLog: updated,
    });
  } catch (error) {
    console.error("PUT Activity Log Adjustment Error:", error);
    return res.status(500).json({ error: "Gagal menyesuaikan data aktivitas." });
  }
}

async function updateOkpLog(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    if (isNaN(idInt)) {
      return res.status(400).json({ error: "ID OKP tidak valid." });
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
      box,
      cartonCode,
      expireDate,
      noCartonAwal,
      noCartonAkhir,
      fgBtlSachet,
      totalFgTargetCtn,
      casingMdfTarget,
      mdfTarget,
      casingNnsTarget,
      nnsTarget,
      mppCount,
      tempoMin,
      rejectSachet,
      rejectPlastik,
      rejectFoil,
      rejectCarton,
      plastikLembar,
      plastikKg,
      plastikSisa,
      plastikHasil,
      cartonPcs,
      cartonLembar,
      cartonSisa,
      cartonHasil,
      totalPemakaian,
      oneRollSachet,
      outsetRoll,
      inputKembaliOkp,
      rejectKembaliOkp,
    } = req.body;

    const emailUser = req.user?.email || "SYSTEM";

    // 1. Validasi Input Utama
    if (!okpNumber || !date || !shift || !machineId || !productId || loadingTime === undefined || totalOutput === undefined) {
      return res.status(400).json({ error: "Kolom OKP, Tanggal, Shift, Mesin, Produk, Loading Time, dan Total Output wajib diisi." });
    }

    // 2. Cek duplikasi OKP Number untuk ID transaksi yang berbeda pada company yang sama
    const duplicate = await db.okpLog.findFirst({
      where: {
        companyId: req.user.companyId,
        okpNumber,
        id: { not: idInt }
      }
    });

    if (duplicate) {
      return res.status(400).json({ error: `OKP Number '${okpNumber}' sudah terdaftar pada transaksi lain.` });
    }

    // 3. Validasi durasi aktivitas yang ada vs Loading Time baru
    const activities = await db.activityLog.findMany({
      where: { okpLogId: idInt }
    });
    const totalActivityDuration = activities.reduce((sum, act) => sum + act.duration, 0);

    if (Math.abs(totalActivityDuration - parseFloat(loadingTime)) > 0.01) {
      return res.status(400).json({
        error: `Total durasi aktivitas saat ini (${totalActivityDuration} menit) tidak sesuai dengan Loading Time baru (${loadingTime} menit). Silakan sesuaikan durasi aktivitas di halaman adjust terlebih dahulu.`
      });
    }

    // 4. Update data OKP Log
    const updated = await db.okpLog.update({
      where: { id: idInt },
      data: {
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
        box: box !== undefined ? parseFloat(box) : null,
        cartonCode: cartonCode || null,
        expireDate: expireDate ? new Date(expireDate) : null,
        noCartonAwal: noCartonAwal !== undefined ? parseInt(noCartonAwal, 10) : null,
        noCartonAkhir: noCartonAkhir !== undefined ? parseInt(noCartonAkhir, 10) : null,
        fgBtlSachet: fgBtlSachet !== undefined ? parseFloat(fgBtlSachet) : null,
        totalFgTargetCtn: totalFgTargetCtn !== undefined ? parseFloat(totalFgTargetCtn) : null,
        casingMdfTarget: casingMdfTarget !== undefined ? parseFloat(casingMdfTarget) : null,
        mdfTarget: mdfTarget !== undefined ? parseFloat(mdfTarget) : null,
        casingNnsTarget: casingNnsTarget !== undefined ? parseFloat(casingNnsTarget) : null,
        nnsTarget: nnsTarget !== undefined ? parseFloat(nnsTarget) : null,
        mppCount: mppCount !== undefined ? parseFloat(mppCount) : null,
        tempoMin: tempoMin !== undefined ? parseFloat(tempoMin) : null,
        rejectSachet: rejectSachet !== undefined ? parseFloat(rejectSachet) : null,
        rejectPlastik: rejectPlastik !== undefined ? parseFloat(rejectPlastik) : null,
        rejectFoil: rejectFoil !== undefined ? parseFloat(rejectFoil) : null,
        rejectCarton: rejectCarton !== undefined ? parseFloat(rejectCarton) : null,
        plastikLembar: plastikLembar !== undefined ? parseFloat(plastikLembar) : null,
        plastikKg: plastikKg !== undefined ? parseFloat(plastikKg) : null,
        plastikSisa: plastikSisa !== undefined ? parseFloat(plastikSisa) : null,
        plastikHasil: plastikHasil !== undefined ? parseFloat(plastikHasil) : null,
        cartonPcs: cartonPcs !== undefined ? parseFloat(cartonPcs) : null,
        cartonLembar: cartonLembar !== undefined ? parseFloat(cartonLembar) : null,
        cartonSisa: cartonSisa !== undefined ? parseFloat(cartonSisa) : null,
        cartonHasil: cartonHasil !== undefined ? parseFloat(cartonHasil) : null,
        totalPemakaian: totalPemakaian !== undefined ? parseFloat(totalPemakaian) : null,
        oneRollSachet: oneRollSachet !== undefined ? parseFloat(oneRollSachet) : null,
        outsetRoll: outsetRoll !== undefined ? parseFloat(outsetRoll) : null,
        inputKembaliOkp: inputKembaliOkp !== undefined ? parseFloat(inputKembaliOkp) : null,
        rejectKembaliOkp: rejectKembaliOkp !== undefined ? parseFloat(rejectKembaliOkp) : null,
        updatedBy: emailUser,
      }
    });

    // Recalculate OEE parameters physically in DB
    await recalculateOkpLogOee(idInt, db);

    return res.json({
      message: "Transaksi OKP berhasil diperbarui.",
      okpLog: updated
    });
  } catch (error) {
    console.error("PUT OKP Log Error:", error);
    return res.status(500).json({ error: "Gagal memperbarui transaksi OKP." });
  }
}

async function initiateOkpLog(req, res) {
  try {
    const {
      okpNumber,
      machineId,
      machineCode,
      machineName,
      productId,
      productCode,
      productName,
      shift,
      groupLeader,
      operator,
      helper,
      loadingTime,
    } = req.body;

    // 1. Validate mandatory inputs
    if (!okpNumber) {
      return res.status(400).json({ error: "Kolom nomor OKP (okpNumber) wajib diisi." });
    }

    if (!machineId && !machineCode && !machineName) {
      return res.status(400).json({ error: "Identifikasi mesin (machineId, machineCode, atau machineName) wajib diisi." });
    }

    // 2. Resolve Machine
    const machine = await db.machine.findFirst({
      where: {
        OR: [
          machineId ? { id: parseInt(machineId, 10) } : null,
          machineCode ? { name: { contains: String(machineCode), mode: "insensitive" } } : null,
          machineName ? { name: { equals: String(machineName), mode: "insensitive" } } : null,
        ].filter(Boolean)
      }
    });

    if (!machine) {
      return res.status(404).json({ error: "Mesin tidak ditemukan." });
    }

    // Resolve all machines belonging to the same line
    let targetMachines = [machine];
    if (machine.lineProcessId) {
      const lineMachines = await db.machine.findMany({
        where: { lineProcessId: machine.lineProcessId }
      });
      if (lineMachines.length > 0) {
        targetMachines = lineMachines;
      }
    }

    // 3. Resolve Product
    let product = await db.product.findFirst({
      where: {
        OR: [
          productId ? { id: parseInt(productId, 10) } : null,
          productCode ? { productCode: { equals: String(productCode), mode: "insensitive" } } : null,
          productName ? { name: { equals: String(productName), mode: "insensitive" } } : null,
        ].filter(Boolean)
      }
    });

    if (!product) {
      // Fallback to the first available product in the database so the request doesn't fail
      product = await db.product.findFirst({
        where: { companyId: machine.companyId }
      });
      if (!product) {
        return res.status(404).json({ error: "Produk tidak ditemukan di database." });
      }
    }

    const emailUser = req.user?.email || "API_INITIATE";

    // 4. Close any previous active OKP on this production line
    // An active OKP is defined as one with an open activity log (endTime: null)
    const now = new Date();
    const activeOkpLogs = await db.okpLog.findMany({
      where: {
        machine: {
          lineProcessId: machine.lineProcessId
        },
        activities: {
          some: { endTime: null }
        }
      },
      include: {
        activities: {
          where: { endTime: null }
        }
      }
    });

    for (const prevOkp of activeOkpLogs) {
      for (const openAct of prevOkp.activities) {
        const start = openAct.startTime || openAct.createdAt || now;
        let durationMin = parseFloat(((now - start) / 60000).toFixed(2));
        if (isNaN(durationMin) || durationMin <= 0) {
          durationMin = 0.01;
        }
        
        await db.activityLog.update({
          where: { id: openAct.id },
          data: {
            endTime: now,
            duration: durationMin,
            updatedBy: emailUser
          }
        });
      }
      
      // Recalculate OEE metrics for the closed OKP log
      await recalculateOkpLogOee(prevOkp.id, db);
    }

    // 5. Check if the OKP number is already used for this company
    let targetOkpNumber = okpNumber;
    const existing = await db.okpLog.findFirst({
      where: {
        companyId: machine.companyId,
        okpNumber: targetOkpNumber
      }
    });

    if (existing) {
      // If it exists, append a timestamp to make it unique and allow re-initiation for testing
      targetOkpNumber = `${okpNumber}-${Date.now().toString().slice(-4)}`;
    }

    // 6. Create active running OKP log and activity log for the target machine representing the line
    const runCode = await db.activityCode.findFirst({
      where: {
        companyId: machine.companyId,
        category: { code: "PR" }
      }
    });

    const newOkp = await db.okpLog.create({
      data: {
        companyId: machine.companyId,
        okpNumber: targetOkpNumber,
        date: new Date(),
        shift: parseInt(shift, 10) || 1,
        machineId: machine.id,
        productId: product.id,
        groupLeader: groupLeader || "SYSTEM",
        operator: operator || "SYSTEM",
        helper: helper || "SYSTEM",
        loadingTime: parseFloat(loadingTime) || 480.0,
        totalOutput: 0.0,
        rework: 0.0,
        reject: 0.0,
        createdBy: emailUser,
        updatedBy: emailUser
      }
    });

    if (runCode) {
      await db.activityLog.create({
        data: {
          okpLogId: newOkp.id,
          activityCodeId: runCode.id,
          startTime: new Date(),
          endTime: null,
          duration: 0.0,
          createdBy: emailUser,
          updatedBy: emailUser
        }
      });
    }

    // Recalculate OEE for the new OKP Log
    await recalculateOkpLogOee(newOkp.id, db);

    // 7. Broadcast SSE event to trigger real-time UI refresh in Next.js dashboard
    const { broadcastEvent } = require("../lib/realtime");
    broadcastEvent("machine_state_change", {
      machineId: machine.id,
      machineName: machine.name,
      okpNumber: newOkp.okpNumber,
      state: "RUN",
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      message: "Lini produksi berhasil diinisiasi.",
      okpLogId: newOkp.id,
      okpNumber: newOkp.okpNumber,
      machine: machine.name,
      product: product.name,
      standarSpeed: product.standarSpeed
    });

  } catch (error) {
    console.error("Initiate OKP Log Error:", error);
    return res.status(500).json({ error: "Gagal menginisiasi lini produksi." });
  }
}

async function getActiveStoppage(req, res) {
  try {
    let companyId;
    if (req.user) {
      companyId = req.user.companyId;
    } else {
      const firstCompany = await db.company.findFirst();
      companyId = firstCompany ? firstCompany.id : 1;
    }

    const activeOkp = await db.okpLog.findFirst({
      where: { companyId },
      orderBy: { date: "desc" },
      include: {
        machine: true
      }
    });

    if (!activeOkp) {
      return res.json({ activeStoppage: null });
    }

    const openLog = await db.activityLog.findFirst({
      where: {
        okpLogId: activeOkp.id,
        endTime: null,
        activityCode: {
          category: {
            code: { not: "PR" }
          }
        }
      },
      orderBy: { id: "desc" },
      include: {
        activityCode: {
          include: { category: true }
        }
      }
    });

    if (!openLog) {
      return res.json({ activeStoppage: null });
    }

    return res.json({
      activeStoppage: {
        activityLogId: openLog.id,
        machineId: activeOkp.machineId,
        machineName: activeOkp.machine.name,
        okpNumber: activeOkp.okpNumber,
        state: "STOP",
        activityCode: openLog.activityCode.code,
        category: openLog.activityCode.category.code,
        description: openLog.activityCode.fullDescription,
        startTime: openLog.startTime ? openLog.startTime.toISOString() : null
      }
    });

  } catch (error) {
    console.error("GET Active Stoppage Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data henti mesin aktif." });
  }
}

async function createManualActivityLog(req, res) {
  try {
    const {
      okpLogId,
      activityCodeId,
      startTime,
      endTime,
      duration,
      brRootCause,
      brMtdtWaiting,
      brMtdtRepair,
      brMtdtStartup
    } = req.body;

    if (!okpLogId || !activityCodeId || !startTime) {
      return res.status(400).json({ error: "Kolom OKP, Kode Aktivitas, dan Waktu Mulai wajib diisi." });
    }

    const emailUser = req.user?.email || "SYSTEM";

    // 1. Resolve OKP
    const okpLog = await db.okpLog.findUnique({
      where: { id: parseInt(okpLogId, 10) }
    });

    if (!okpLog || okpLog.companyId !== req.user.companyId) {
      return res.status(404).json({ error: "Transaksi OKP tidak ditemukan." });
    }

    // 2. Calculate duration if not provided
    let calculatedDuration = parseFloat(duration);
    if (isNaN(calculatedDuration) && endTime) {
      const diffMs = new Date(endTime) - new Date(startTime);
      calculatedDuration = parseFloat((diffMs / 60000).toFixed(2));
    }

    if (isNaN(calculatedDuration) || calculatedDuration < 0) {
      calculatedDuration = 0;
    }

    // 3. Create the manual activity log
    const newActivity = await db.activityLog.create({
      data: {
        okpLogId: parseInt(okpLogId, 10),
        activityCodeId: parseInt(activityCodeId, 10),
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        duration: calculatedDuration,
        brRootCause: brRootCause || null,
        brMtdtWaiting: brMtdtWaiting !== undefined ? parseFloat(brMtdtWaiting) : null,
        brMtdtRepair: brMtdtRepair !== undefined ? parseFloat(brMtdtRepair) : null,
        brMtdtStartup: brMtdtStartup !== undefined ? parseFloat(brMtdtStartup) : null,
        createdBy: emailUser,
        updatedBy: emailUser
      },
      include: {
        activityCode: {
          include: { category: true }
        }
      }
    });

    // 4. Recalculate OEE metrics
    await recalculateOkpLogOee(okpLog.id, db);

    return res.status(201).json({
      message: "Gangguan manual berhasil disimpan.",
      activityLog: newActivity
    });
  } catch (error) {
    console.error("POST Manual Activity Log Error:", error);
    return res.status(500).json({ error: "Gagal menyimpan gangguan manual." });
  }
}

async function getMachineStates(req, res) {
  try {
    return res.json({ machineStates });
  } catch (error) {
    console.error("GET Machine States Error:", error);
    return res.status(500).json({ error: "Gagal mengambil status mesin." });
  }
}

module.exports = {
  getOkpLogs,
  createOkpLog,
  getOkpLogDetail,
  adjustActivityLog,
  updateOkpLog,
  initiateOkpLog,
  getActiveStoppage,
  createManualActivityLog,
  getMachineStates,
};
