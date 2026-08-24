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
          orderBy: [
            { startTime: "desc" },
            { id: "desc" }
          ],
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

    if (activityLog.okpLog.isLocked) {
      return res.status(403).json({ error: "Log book ini sudah terkunci (Locked). Aktivitas tidak dapat disesuaikan." });
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
      isLocked,
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

    // 2. Cek eksistensi dan lock status
    const existingLog = await db.okpLog.findUnique({
      where: { id: idInt }
    });
    if (!existingLog || existingLog.companyId !== req.user.companyId) {
      return res.status(404).json({ error: "Transaksi OKP tidak ditemukan." });
    }

    if (existingLog.isLocked && isLocked !== false) {
      return res.status(403).json({ error: "Log book ini sudah terkunci (Locked) dan tidak dapat diubah." });
    }

    // Cek duplikasi OKP Number untuk ID transaksi yang berbeda pada company yang sama
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
        isLocked: isLocked !== undefined ? Boolean(isLocked) : undefined,
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
      lotNumber,
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
      if (productCode && productName) {
        product = await db.product.create({
          data: {
            companyId: machine.companyId,
            productCode: productCode,
            name: productName,
            standarSpeed: 120.0, // default standard speed
          }
        });
      } else {
        // Fallback to the first available product in the database so the request doesn't fail
        product = await db.product.findFirst({
          where: { companyId: machine.companyId }
        });
        if (!product) {
          return res.status(404).json({ error: "Produk tidak ditemukan di database." });
        }
      }
    }

    const emailUser = req.user?.email || "API_INITIATE";

    // 4. Handle previous active OKPs on this line
    // Close any open activity log on previous OKPs on this line when initiating a new OKP
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
        if (isNaN(durationMin) || durationMin <= 0) durationMin = 0.01;

        await db.activityLog.update({
          where: { id: openAct.id },
          data: {
            endTime: now,
            duration: durationMin,
            updatedBy: emailUser
          }
        });
      }

      // Refine loadingTime of previous OKP if it was left at default 480
      const allPrevActs = await db.activityLog.findMany({
        where: { okpLogId: prevOkp.id, endTime: { not: null } }
      });
      const actualPrevDur = allPrevActs.reduce((sum, a) => sum + (a.duration || 0), 0);
      if (actualPrevDur > 0 && prevOkp.loadingTime === 480) {
        await db.okpLog.update({
          where: { id: prevOkp.id },
          data: { loadingTime: parseFloat(actualPrevDur.toFixed(1)), updatedBy: emailUser }
        });
      }

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
      targetOkpNumber = `${okpNumber}-${Date.now().toString().slice(-4)}`;
    }

    // 6. Create new OKP in INITIATED status
    const newOkp = await db.okpLog.create({
      data: {
        companyId: machine.companyId,
        okpNumber: targetOkpNumber,
        lotNumber: lotNumber || null,
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

    // Automatically start PR (Normal Production Run) activity log for the new OKP
    let runCode = await db.activityCode.findFirst({
      where: {
        companyId: machine.companyId,
        code: { equals: "PR.1", mode: "insensitive" }
      }
    });

    if (!runCode) {
      runCode = await db.activityCode.findFirst({
        where: {
          companyId: machine.companyId,
          category: { code: "PR" }
        }
      });
    }

    if (runCode) {
      await db.activityLog.create({
        data: {
          okpLogId: newOkp.id,
          activityCodeId: runCode.id,
          startTime: now,
          endTime: null,
          duration: 0.0,
          createdBy: emailUser,
          updatedBy: emailUser
        }
      });
    }

    // Update machine state cache to RUN for this machine
    const { machineStates } = require("../lib/mqttListener");
    machineStates[machine.id] = "RUN";

    // Recalculate OEE for the new OKP Log
    await recalculateOkpLogOee(newOkp.id, db);

    // 7. Broadcast SSE event (Machine transitioning to RUN for new OKP)
    const { broadcastEvent } = require("../lib/realtime");
    broadcastEvent("machine_state_change", {
      machineId: machine.id,
      machineName: machine.name,
      okpNumber: newOkp.okpNumber,
      state: "RUN",
      category: "PR",
      activityCode: runCode ? runCode.code : "PR.1",
      description: runCode ? runCode.fullDescription : "Normal Production Run",
      timestamp: now.toISOString()
    }, machine.lineProcessId);

    let stdSpeed = product.stdSpeedFilling || product.stdSpeedFbMin || 120;
    const customSpeed = await db.productMachineSpeed.findUnique({
      where: {
        productId_machineId: {
          productId: product.id,
          machineId: machine.id
        }
      }
    });
    if (customSpeed && customSpeed.speed > 0) {
      stdSpeed = customSpeed.speed;
    }

    return res.status(201).json({
      message: "Lini produksi berhasil diinisiasi.",
      okpLogId: newOkp.id,
      okpNumber: newOkp.okpNumber,
      machine: machine.name,
      product: product.name,
      standarSpeed: stdSpeed
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

    if (okpLog.isLocked) {
      return res.status(403).json({ error: "Log book ini sudah terkunci (Locked). Tidak dapat menambahkan gangguan manual." });
    }

    // 2. Close ALL open activity logs for this OKP before starting a new manual activity log
    const manualStart = new Date(startTime);
    const openLogs = await db.activityLog.findMany({
      where: {
        okpLogId: parseInt(okpLogId, 10),
        endTime: null
      }
    });

    if (openLogs.length > 0) {
      for (const openLog of openLogs) {
        const openStart = new Date(openLog.startTime || openLog.createdAt || manualStart);
        let dur = 0.01;
        if (manualStart > openStart) {
          const diffMs = manualStart - openStart;
          dur = parseFloat((diffMs / 60000).toFixed(2));
          if (isNaN(dur) || dur < 0) dur = 0.01;
        }
        await db.activityLog.update({
          where: { id: openLog.id },
          data: {
            endTime: manualStart,
            duration: dur,
            updatedBy: emailUser
          }
        });
      }
    }

    // 3. Calculate duration if provided, otherwise default to 0 for ongoing
    let calculatedDuration = parseFloat(duration);
    if (isNaN(calculatedDuration) && endTime) {
      const diffMs = new Date(endTime) - manualStart;
      calculatedDuration = parseFloat((diffMs / 60000).toFixed(2));
    }

    if (isNaN(calculatedDuration) || calculatedDuration < 0) {
      calculatedDuration = 0;
    }

    // 4. Create the manual activity log
    const newActivity = await db.activityLog.create({
      data: {
        okpLogId: parseInt(okpLogId, 10),
        activityCodeId: parseInt(activityCodeId, 10),
        startTime: manualStart,
        endTime: endTime ? new Date(endTime) : null,
        duration: calculatedDuration,
        brRootCause: brRootCause || null,
        brMtdtWaiting: brMtdtWaiting !== undefined && brMtdtWaiting !== null ? parseFloat(brMtdtWaiting) : null,
        brMtdtRepair: brMtdtRepair !== undefined && brMtdtRepair !== null ? parseFloat(brMtdtRepair) : null,
        brMtdtStartup: brMtdtStartup !== undefined && brMtdtStartup !== null ? parseFloat(brMtdtStartup) : null,
        createdBy: emailUser,
        updatedBy: emailUser
      },
      include: {
        activityCode: {
          include: { category: true }
        }
      }
    });

    // 5. Recalculate OEE metrics
    await recalculateOkpLogOee(okpLog.id, db);

    return res.status(201).json({
      message: (openLogs && openLogs.length > 0) ? "Gangguan lama otomatis diselesaikan dan gangguan baru dimulai." : "Gangguan manual berhasil disimpan.",
      activityLog: newActivity
    });
  } catch (error) {
    console.error("POST Manual Activity Log Error:", error);
    return res.status(500).json({ error: "Gagal menyimpan gangguan manual." });
  }
}

async function resumeProduction(req, res) {
  try {
    const { okpLogId } = req.body;

    if (!okpLogId) {
      return res.status(400).json({ error: "ID OKP Log wajib diisi." });
    }

    const emailUser = req.user?.email || "SYSTEM";
    const okpLog = await db.okpLog.findUnique({
      where: { id: parseInt(okpLogId, 10) },
      include: { machine: true }
    });

    if (!okpLog) {
      return res.status(404).json({ error: "Transaksi OKP tidak ditemukan." });
    }

    if (okpLog.isLocked) {
      return res.status(403).json({ error: "Log book ini sudah terkunci (Locked)." });
    }

    const now = new Date();

    // Find all currently open activity logs
    const openLogs = await db.activityLog.findMany({
      where: {
        okpLogId: okpLog.id,
        endTime: null
      },
      include: {
        activityCode: { include: { category: true } }
      }
    });

    // If only 1 open log exists and it's already PR, line is already running
    if (openLogs.length === 1 && openLogs[0].activityCode && openLogs[0].activityCode.category && openLogs[0].activityCode.category.code === 'PR') {
      return res.status(200).json({
        message: "Lini/Mesin sudah dalam keadaan RUNNING.",
        activityLog: openLogs[0]
      });
    }

    // Close ALL existing open logs
    for (const openLog of openLogs) {
      const openStart = new Date(openLog.startTime || openLog.createdAt);
      let dur = parseFloat(((now - openStart) / 60000).toFixed(2));
      if (isNaN(dur) || dur <= 0) dur = 0.01;
      await db.activityLog.update({
        where: { id: openLog.id },
        data: {
          endTime: now,
          duration: dur,
          updatedBy: emailUser
        }
      });
    }

    // Resolve PR.1 or default Productive activity code
    let prCode = await db.activityCode.findFirst({
      where: { code: "PR.1" }
    });

    if (!prCode) {
      prCode = await db.activityCode.findFirst({
        where: { category: { code: "PR" } }
      });
    }

    if (!prCode) {
      return res.status(400).json({ error: "Kode Aktivitas Produksi (PR) tidak ditemukan." });
    }

    // Create new PR running log
    const newPrLog = await db.activityLog.create({
      data: {
        okpLogId: okpLog.id,
        activityCodeId: prCode.id,
        startTime: now,
        endTime: null,
        duration: 0,
        createdBy: emailUser,
        updatedBy: emailUser
      },
      include: {
        activityCode: { include: { category: true } }
      }
    });

    await recalculateOkpLogOee(okpLog.id, db);

    return res.status(200).json({
      message: "Mesin berhasil kembali RUNNING. Gangguan telah diselesaikan.",
      activityLog: newPrLog
    });
  } catch (error) {
    console.error("Resume Production Error:", error);
    return res.status(500).json({ error: "Gagal mengembalikan mesin ke status RUNNING." });
  }
}

async function toggleLockOkpLog(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    if (isNaN(idInt)) {
      return res.status(400).json({ error: "ID OKP tidak valid." });
    }

    const { isLocked } = req.body;
    if (isLocked === undefined) {
      return res.status(400).json({ error: "Kolom status kunci (isLocked) wajib diisi." });
    }

    const existingLog = await db.okpLog.findUnique({
      where: { id: idInt }
    });

    if (!existingLog || existingLog.companyId !== req.user.companyId) {
      return res.status(404).json({ error: "Transaksi OKP tidak ditemukan." });
    }

    const updated = await db.okpLog.update({
      where: { id: idInt },
      data: {
        isLocked: Boolean(isLocked)
      }
    });

    return res.json({
      message: isLocked ? "Log book berhasil dikunci." : "Kunci log book berhasil dibuka.",
      okpLog: updated
    });
  } catch (error) {
    console.error("PUT OKP Log Lock Error:", error);
    return res.status(500).json({ error: "Gagal mengubah status kunci log book." });
  }
}

async function finishOkpLog(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    if (isNaN(idInt)) {
      return res.status(400).json({ error: "ID OKP tidak valid." });
    }

    const emailUser = req.user?.email || "API_FINISH";

    const okpLog = await db.okpLog.findUnique({
      where: { id: idInt },
      include: {
        machine: true,
        activities: { where: { endTime: null } }
      }
    });

    if (!okpLog) {
      return res.status(404).json({ error: "OKP tidak ditemukan." });
    }

    const now = new Date();

    // 1. Close any open activity log for this OKP
    for (const openAct of okpLog.activities) {
      const start = openAct.startTime || openAct.createdAt || now;
      let durationMin = parseFloat(((now - start) / 60000).toFixed(2));
      if (isNaN(durationMin) || durationMin <= 0) durationMin = 0.01;

      await db.activityLog.update({
        where: { id: openAct.id },
        data: { endTime: now, duration: durationMin, updatedBy: emailUser }
      });
    }



    // Calculate total actual activity duration for this OKP upon finish
    const allActs = await db.activityLog.findMany({
      where: { okpLogId: okpLog.id, endTime: { not: null } }
    });
    const actualDur = allActs.reduce((sum, a) => sum + (a.duration || 0), 0);
    
    // If loadingTime was default 480 and actual duration is known, refine loadingTime to actual duration
    if (actualDur > 0 && okpLog.loadingTime === 480) {
      await db.okpLog.update({
        where: { id: okpLog.id },
        data: { loadingTime: parseFloat(actualDur.toFixed(1)), updatedBy: emailUser }
      });
    } else {
      await db.okpLog.update({
        where: { id: okpLog.id },
        data: { updatedBy: emailUser }
      });
    }

    await recalculateOkpLogOee(okpLog.id, db);

    const { broadcastEvent } = require("../lib/realtime");
    broadcastEvent("machine_state_change", {
      machineId: okpLog.machineId,
      machineName: okpLog.machine ? okpLog.machine.name : "Mesin Utama",
      okpNumber: okpLog.okpNumber,
      state: "STOP",
      category: "SE",
      timestamp: now.toISOString()
    });

    return res.status(200).json({
      message: `OKP '${okpLog.okpNumber}' berhasil di-finish. Persiapan (SE.8) diinisiasi.`,
      okpLogId: okpLog.id
    });
  } catch (error) {
    console.error("Finish OKP Error:", error);
    return res.status(500).json({ error: "Gagal memproses Finish OKP." });
  }
}

async function getMachineStates(req, res) {
  try {
    const { machineStates } = require("../lib/mqttListener");
    return res.json({ machineStates });
  } catch (error) {
    console.error("GET Machine States Error:", error);
    return res.status(500).json({ error: "Gagal mengambil status mesin." });
  }
}

async function splitActivityLog(req, res) {
  try {
    const { id } = req.params;
    const { splits } = req.body; // Array of { activityCodeId, duration, brRootCause, brMtdtWaiting, brMtdtRepair, brMtdtStartup }

    if (!splits || !Array.isArray(splits) || splits.length < 2) {
      return res.status(400).json({ error: "Minimal 2 bagian split yang harus diisi." });
    }

    const activityLogId = parseInt(id, 10);
    if (isNaN(activityLogId)) {
      return res.status(400).json({ error: "ID activity log tidak valid." });
    }

    // 1. Fetch original activity log
    const originalLog = await db.activityLog.findUnique({
      where: { id: activityLogId },
      include: {
        activityCode: { include: { category: true } },
        okpLog: true
      }
    });

    if (!originalLog) {
      return res.status(404).json({ error: "Aktivitas tidak ditemukan." });
    }

    if (originalLog.okpLog && originalLog.okpLog.isLocked) {
      return res.status(403).json({ error: "Transaksi OKP sudah terkunci." });
    }

    if (originalLog.endTime === null) {
      return res.status(400).json({ error: "Hanya aktivitas downtime yang sudah selesai yang dapat di-split." });
    }

    if (originalLog.activityCode && originalLog.activityCode.category && originalLog.activityCode.category.code === "PR") {
      return res.status(400).json({ error: "Aktivitas berjalan (Productive/PR) tidak dapat di-split." });
    }

    // 2. Validate total duration of splits
    const originalDuration = parseFloat(originalLog.duration) || 0;
    let totalSplitDuration = 0;
    
    for (let i = 0; i < splits.length; i++) {
      const dur = parseFloat(splits[i].duration);
      if (isNaN(dur) || dur <= 0) {
        return res.status(400).json({ error: `Durasi pada bagian ke-${i + 1} harus lebih besar dari 0.` });
      }
      totalSplitDuration += dur;
    }

    // Floating point check: totalSplitDuration cannot exceed originalDuration + 0.01 tolerance
    if (totalSplitDuration > originalDuration + 0.01) {
      return res.status(400).json({
        error: `Total durasi split (${totalSplitDuration.toFixed(2)} menit) melebihi durasi asli (${originalDuration.toFixed(2)} menit).`
      });
    }

    const emailUser = req.user ? req.user.email : (originalLog.createdBy || "SYSTEM");
    const originalStartMs = new Date(originalLog.startTime).getTime();
    const originalEndMs = new Date(originalLog.endTime).getTime();

    // 3. Process splits sequentially
    const createdLogs = [];
    let currentStartMs = originalStartMs;

    for (let i = 0; i < splits.length; i++) {
      const s = splits[i];
      const durMin = parseFloat(s.duration);
      const segDurationMs = Math.round(durMin * 60000);
      
      let segEndMs = currentStartMs + segDurationMs;
      if (i === splits.length - 1 && Math.abs(totalSplitDuration - originalDuration) < 0.05) {
        segEndMs = originalEndMs;
      }

      const segStartTime = new Date(currentStartMs);
      const segEndTime = new Date(segEndMs);
      const actCodeId = parseInt(s.activityCodeId, 10);

      if (i === 0) {
        const updated = await db.activityLog.update({
          where: { id: originalLog.id },
          data: {
            activityCodeId: actCodeId,
            startTime: segStartTime,
            endTime: segEndTime,
            duration: parseFloat(durMin.toFixed(2)),
            brRootCause: s.brRootCause || originalLog.brRootCause || null,
            brMtdtWaiting: s.brMtdtWaiting !== undefined && s.brMtdtWaiting !== null ? parseFloat(s.brMtdtWaiting) : null,
            brMtdtRepair: s.brMtdtRepair !== undefined && s.brMtdtRepair !== null ? parseFloat(s.brMtdtRepair) : null,
            brMtdtStartup: s.brMtdtStartup !== undefined && s.brMtdtStartup !== null ? parseFloat(s.brMtdtStartup) : null,
            updatedBy: emailUser
          },
          include: { activityCode: { include: { category: true } } }
        });
        createdLogs.push(updated);
      } else {
        const created = await db.activityLog.create({
          data: {
            okpLogId: originalLog.okpLogId,
            activityCodeId: actCodeId,
            startTime: segStartTime,
            endTime: segEndTime,
            duration: parseFloat(durMin.toFixed(2)),
            brRootCause: s.brRootCause || null,
            brMtdtWaiting: s.brMtdtWaiting !== undefined && s.brMtdtWaiting !== null ? parseFloat(s.brMtdtWaiting) : null,
            brMtdtRepair: s.brMtdtRepair !== undefined && s.brMtdtRepair !== null ? parseFloat(s.brMtdtRepair) : null,
            brMtdtStartup: s.brMtdtStartup !== undefined && s.brMtdtStartup !== null ? parseFloat(s.brMtdtStartup) : null,
            createdBy: emailUser,
            updatedBy: emailUser
          },
          include: { activityCode: { include: { category: true } } }
        });
        createdLogs.push(created);
      }

      currentStartMs = segEndMs;
    }

    // 4. Recalculate OEE
    await recalculateOkpLogOee(originalLog.okpLogId, db);

    return res.status(200).json({
      message: "Downtime berhasil di-split.",
      activityLogs: createdLogs
    });
  } catch (error) {
    console.error("Split Activity Log Error:", error);
    return res.status(500).json({ error: "Gagal memproses split downtime." });
  }
}

module.exports = {
  getOkpLogs,
  createOkpLog,
  getOkpLogDetail,
  adjustActivityLog,
  splitActivityLog,
  updateOkpLog,
  toggleLockOkpLog,
  initiateOkpLog,
  finishOkpLog,
  getActiveStoppage,
  createManualActivityLog,
  resumeProduction,
  getMachineStates,
  changeLotOkpLog,
};

async function changeLotOkpLog(req, res) {
  try {
    const { okpLogId, lotNumber, action, notes } = req.body;

    if (!okpLogId) {
      return res.status(400).json({ error: "ID OKP Log wajib diisi." });
    }

    const emailUser = req.user?.email || "SYSTEM";
    const okpLog = await db.okpLog.findUnique({
      where: { id: parseInt(okpLogId, 10) },
      include: { machine: true }
    });

    if (!okpLog) {
      return res.status(404).json({ error: "Transaksi OKP tidak ditemukan." });
    }

    if (okpLog.isLocked) {
      return res.status(403).json({ error: "Log book ini sudah terkunci (Locked)." });
    }

    const now = new Date();

    if (action === 'pause') {
      const openLogs = await db.activityLog.findMany({
        where: { okpLogId: okpLog.id, endTime: null }
      });

      for (const openLog of openLogs) {
        const openStart = new Date(openLog.startTime || openLog.createdAt);
        let dur = parseFloat(((now - openStart) / 60000).toFixed(2));
        if (isNaN(dur) || dur < 0) dur = 0.01;
        await db.activityLog.update({
          where: { id: openLog.id },
          data: { endTime: now, duration: dur, updatedBy: emailUser }
        });
      }

      let coCode = await db.activityCode.findFirst({
        where: {
          OR: [
            { code: { contains: "CO", mode: "insensitive" } },
            { subActivity: { contains: "Changeover", mode: "insensitive" } },
            { fullDescription: { contains: "Changeover", mode: "insensitive" } },
            { fullDescription: { contains: "Lot", mode: "insensitive" } },
            { category: { code: { in: ["CO", "PA", "DT"] } } }
          ]
        },
        include: { category: true }
      });

      if (!coCode) {
        coCode = await db.activityCode.findFirst({
          where: { category: { code: { not: "PR" } } },
          include: { category: true }
        });
      }

      let newStoppage = null;
      if (coCode) {
        newStoppage = await db.activityLog.create({
          data: {
            okpLogId: okpLog.id,
            activityCodeId: coCode.id,
            startTime: now,
            endTime: null,
            duration: 0,
            brRootCause: notes || "Change Lot / Changeover Line",
            createdBy: emailUser,
            updatedBy: emailUser
          },
          include: { activityCode: { include: { category: true } } }
        });
      }

      if (okpLog.machineId) {
        const { machineStates } = require("../lib/mqttListener");
        machineStates[okpLog.machineId] = "STOP";
      }

      const { broadcastEvent } = require("../lib/realtime");
      broadcastEvent("machine_state_change", {
        machineId: okpLog.machineId,
        machineName: okpLog.machine ? okpLog.machine.name : "Machine",
        okpNumber: okpLog.okpNumber,
        state: "STOP",
        category: coCode ? (coCode.category ? coCode.category.code : "CO") : "CO",
        activityCode: coCode ? coCode.code : "CO.1",
        description: coCode ? coCode.fullDescription : "Changeover / Ganti Lot",
        timestamp: now.toISOString()
      }, okpLog.machine ? okpLog.machine.lineProcessId : null);

      return res.status(200).json({
        message: "Lini produksi dihentikan sementara untuk Change Lot.",
        status: "STOP",
        activityLog: newStoppage
      });
    }

    const updatedOkp = await db.okpLog.update({
      where: { id: okpLog.id },
      data: {
        lotNumber: lotNumber || okpLog.lotNumber,
        updatedBy: emailUser
      }
    });

    if (action === 'update_only') {
      return res.status(200).json({
        message: "Nomor Lot berhasil diperbarui.",
        okpLog: updatedOkp
      });
    }

    const openLogs = await db.activityLog.findMany({
      where: { okpLogId: okpLog.id, endTime: null }
    });

    for (const openLog of openLogs) {
      const openStart = new Date(openLog.startTime || openLog.createdAt);
      let dur = parseFloat(((now - openStart) / 60000).toFixed(2));
      if (isNaN(dur) || dur < 0) dur = 0.01;
      await db.activityLog.update({
        where: { id: openLog.id },
        data: { endTime: now, duration: dur, updatedBy: emailUser }
      });
    }

    let prCode = await db.activityCode.findFirst({
      where: { code: "PR.1" }
    });
    if (!prCode) {
      prCode = await db.activityCode.findFirst({
        where: { category: { code: "PR" } }
      });
    }

    let newPrLog = null;
    if (prCode) {
      newPrLog = await db.activityLog.create({
        data: {
          okpLogId: okpLog.id,
          activityCodeId: prCode.id,
          startTime: now,
          endTime: null,
          duration: 0,
          createdBy: emailUser,
          updatedBy: emailUser
        }
      });
    }

    if (okpLog.machineId) {
      const { machineStates } = require("../lib/mqttListener");
      machineStates[okpLog.machineId] = "RUN";
    }

    await recalculateOkpLogOee(okpLog.id, db);

    const { broadcastEvent } = require("../lib/realtime");
    broadcastEvent("machine_state_change", {
      machineId: okpLog.machineId,
      machineName: okpLog.machine ? okpLog.machine.name : "Machine",
      okpNumber: okpLog.okpNumber,
      lotNumber: updatedOkp.lotNumber,
      state: "RUN",
      category: "PR",
      activityCode: prCode ? prCode.code : "PR.1",
      description: "Normal Production Run",
      timestamp: now.toISOString()
    }, okpLog.machine ? okpLog.machine.lineProcessId : null);

    return res.status(200).json({
      message: "Nomor Lot berhasil diperbarui dan lini produksi kembali RUNNING.",
      okpLog: updatedOkp,
      activityLog: newPrLog
    });

  } catch (error) {
    console.error("Change Lot OKP Log Error:", error);
    return res.status(500).json({ error: "Gagal memproses Change Lot." });
  }
}
