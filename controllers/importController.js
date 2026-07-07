const { db } = require("../lib/db");
const { recalculateOkpLogOee } = require("../lib/oeeHelper");

async function parseAndImportOkpLogs(req, res) {
  try {
    const { lineProcessId, rows } = req.body;

    if (!lineProcessId) {
      return res.status(400).json({ error: "Lini produksi tujuan wajib dipilih." });
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "Tidak ada data untuk di-import." });
    }

    let companyId;
    if (req.user) {
      companyId = req.user.companyId;
    } else {
      const firstCompany = await db.company.findFirst();
      companyId = firstCompany ? firstCompany.id : 1;
    }

    const emailUser = req.user?.email || "SYSTEM_IMPORT";

    const results = [];

    // Resolve a product placeholder to satisfy foreign keys
    let product = await db.product.findFirst({
      where: { companyId }
    });

    if (!product) {
      product = await db.product.create({
        data: {
          companyId,
          productCode: "DAILY-PROD",
          name: "Daily Production Log",
          size: "1Kg",
          standarSpeed: 100.0,
          createdBy: emailUser,
          updatedBy: emailUser
        }
      });
    }

    // Perform inside a single database transaction for safety
    await db.$transaction(async (tx) => {
      // Resolve Representative Machine for this Line Process
      const machine = await tx.machine.findFirst({
        where: { companyId, lineProcessId: parseInt(lineProcessId, 10) }
      });
      if (!machine) {
        throw new Error("Lini produksi terpilih tidak memiliki mesin terdaftar.");
      }
      const machineId = machine.id;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;

        if (!row.dateStr) {
          throw new Error(`Baris ${rowNum}: Tanggal wajib diisi.`);
        }

        const dateParsed = new Date(row.dateStr);
        if (isNaN(dateParsed.getTime())) {
          throw new Error(`Baris ${rowNum}: Format tanggal tidak valid (${row.dateStr}).`);
        }

        const year = dateParsed.getFullYear();
        const month = String(dateParsed.getMonth() + 1).padStart(2, "0");
        const day = String(dateParsed.getDate()).padStart(2, "0");
        const dateFormatted = `${year}-${month}-${day}`;
        const okpNumber = `DAILY-${dateFormatted}`;

        // Raw inputs in hours
        const loadingHrs = parseFloat(row.loadingTimeHrs) || 0;
        const operatingHrs = parseFloat(row.operatingTimeHrs) || 0;
        const netOperatingHrs = parseFloat(row.netOperatingTimeHrs) || 0;
        const valuedOperatingHrs = parseFloat(row.valuedOperatingTimeHrs) || 0;
        const totalDowntimeHrs = parseFloat(row.totalDowntimeHrs) || 0;
        const minorStoppageHrs = parseFloat(row.minorStoppageHrs) || 0;
        const qualityLossHrs = parseFloat(row.qualityLossHrs) || 0;

        // Calculate Rates (prioritize incoming parsed rates from the body)
        let ar = parseFloat(row.availability) || 0;
        if (ar === 0 && loadingHrs > 0) {
          ar = (operatingHrs / loadingHrs) * 100;
          if (ar < 0) ar = 0;
          if (ar > 100) ar = 100;
        }

        let pr = parseFloat(row.performance) || 0;
        if (pr === 0 && operatingHrs > 0) {
          pr = (netOperatingHrs / operatingHrs) * 100;
          if (pr < 0) pr = 0;
        }

        let qr = parseFloat(row.quality) || 0;
        if (qr === 0 && netOperatingHrs > 0) {
          qr = (valuedOperatingHrs / netOperatingHrs) * 100;
          if (qr < 0) qr = 0;
          if (qr > 100) qr = 100;
        }

        let oee = parseFloat(row.oee) || 0;
        if (oee === 0) {
          oee = (ar / 100) * (pr / 100) * (qr / 100) * 100;
        }

        // Convert hours to minutes for the DB log
        const loadingTimeMin = loadingHrs * 60;
        const downtimeMin = totalDowntimeHrs * 60;
        const miMin = minorStoppageHrs * 60;
        
        // Output Pcs (placeholder conversion since it's time-based, use hours * 60)
        const totalOutputPcs = netOperatingHrs * 60;
        const reworkKg = qualityLossHrs * 60;

        // Check if OKP already exists for this company
        const existingOkp = await tx.okpLog.findUnique({
          where: {
            companyId_okpNumber: {
              companyId,
              okpNumber
            }
          }
        });

        if (existingOkp) {
          // Update existing OKP log
          const updated = await tx.okpLog.update({
            where: { id: existingOkp.id },
            data: {
              date: dateParsed,
              productId: product.id,
              loadingTime: loadingTimeMin,
              totalOutput: totalOutputPcs,
              rework: reworkKg,
              reject: 0,
              totalInput: loadingTimeMin, // loading time as input placeholder
              yield: parseFloat(qr.toFixed(2)), // For daily OEE, yield can align with Quality Rate
              availability: parseFloat(ar.toFixed(2)),
              performance: parseFloat(pr.toFixed(2)),
              quality: parseFloat(qr.toFixed(2)),
              oee: parseFloat(oee.toFixed(2)),
              downtime: downtimeMin,
              mi: miMin,
              updatedBy: emailUser,
            }
          });
          results.push(updated);
        } else {
          // Create new OKP log
          const created = await tx.okpLog.create({
            data: {
              companyId,
              okpNumber,
              date: dateParsed,
              shift: 1,
              machineId: parseInt(machineId, 10),
              productId: product.id,
              loadingTime: loadingTimeMin,
              totalOutput: totalOutputPcs,
              rework: reworkKg,
              reject: 0,
              totalInput: loadingTimeMin,
              yield: parseFloat(qr.toFixed(2)),
              availability: parseFloat(ar.toFixed(2)),
              performance: parseFloat(pr.toFixed(2)),
              quality: parseFloat(qr.toFixed(2)),
              oee: parseFloat(oee.toFixed(2)),
              downtime: downtimeMin,
              mi: miMin,
              createdBy: emailUser,
              updatedBy: emailUser,
            }
          });
          results.push(created);
        }
      }
    });

    return res.status(200).json({
      message: `Berhasil meng-import ${results.length} data harian OEE.`,
      count: results.length
    });

  } catch (error) {
    console.error("Import OKP Logs Error:", error);
    return res.status(500).json({ error: error.message || "Gagal meng-import data harian OEE." });
  }
}

async function importPackagingLogs(req, res) {
  try {
    const { lineProcessId, rows } = req.body;

    if (!lineProcessId) {
      return res.status(400).json({ error: "Lini produksi tujuan wajib dipilih." });
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "Tidak ada data untuk di-import." });
    }

    let companyId;
    if (req.user) {
      companyId = req.user.companyId;
    } else {
      const firstCompany = await db.company.findFirst();
      companyId = firstCompany ? firstCompany.id : 1;
    }

    const emailUser = req.user?.email || "SYSTEM_IMPORT_PACKAGING";
    const results = [];

    // Resolve representative machine for lineProcessId
    const machine = await db.machine.findFirst({
      where: { companyId, lineProcessId: parseInt(lineProcessId, 10) }
    });
    if (!machine) {
      return res.status(400).json({ error: "Lini produksi terpilih tidak memiliki mesin terdaftar." });
    }

    await db.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;

        if (!row.okpNumber) {
          throw new Error(`Baris ${rowNum}: Nomor OKP wajib diisi.`);
        }

        if (!row.dateStr) {
          throw new Error(`Baris ${rowNum}: Tanggal wajib diisi.`);
        }

        const dateParsed = new Date(row.dateStr);
        if (isNaN(dateParsed.getTime())) {
          throw new Error(`Baris ${rowNum}: Format tanggal tidak valid (${row.dateStr}).`);
        }

        // Resolve Product
        let product = null;
        if (row.productCode) {
          product = await tx.product.findFirst({
            where: { companyId, productCode: row.productCode }
          });
        }
        if (!product && row.productName) {
          product = await tx.product.findFirst({
            where: { companyId, name: { contains: row.productName, mode: "insensitive" } }
          });
        }

        // Fallback Product
        if (!product) {
          product = await tx.product.findFirst({ where: { companyId } });
          if (!product) {
            product = await tx.product.create({
              data: {
                companyId,
                productCode: row.productCode || "DAILY-PROD",
                name: row.productName || "Daily Production Log",
                size: "1Kg",
                standarSpeed: 100.0,
                createdBy: emailUser,
                updatedBy: emailUser
              }
            });
          }
        }

        // Check if OKP already exists
        const existingOkp = await tx.okpLog.findUnique({
          where: {
            companyId_okpNumber: {
              companyId,
              okpNumber: row.okpNumber
            }
          }
        });

        // Map values with fallbacks
        const dataPayload = {
          date: dateParsed,
          shift: parseInt(row.shift, 10) || 1,
          productId: product.id,
          groupLeader: row.groupLeader || null,
          operator: row.operator || null,
          helper: row.helper || null,
          loadingTime: parseFloat(row.loadingTime) || 0.0,
          totalOutput: parseFloat(row.totalOutput) || 0.0,
          rework: parseFloat(row.rework) || 0.0,
          reject: parseFloat(row.reject) || 0.0,
          sampleQc: parseFloat(row.sampleQc) || null,

          // Packaging specific fields
          box: row.box !== undefined ? parseFloat(row.box) : null,
          cartonCode: row.cartonCode || null,
          expireDate: row.expireDate ? new Date(row.expireDate) : null,
          noCartonAwal: row.noCartonAwal !== undefined ? parseInt(row.noCartonAwal, 10) : null,
          noCartonAkhir: row.noCartonAkhir !== undefined ? parseInt(row.noCartonAkhir, 10) : null,
          fgBtlSachet: row.fgBtlSachet !== undefined ? parseFloat(row.fgBtlSachet) : null,
          totalFgTargetCtn: row.totalFgTargetCtn !== undefined ? parseFloat(row.totalFgTargetCtn) : null,
          casingMdfTarget: row.casingMdfTarget !== undefined ? parseFloat(row.casingMdfTarget) : null,
          mdfTarget: row.mdfTarget !== undefined ? parseFloat(row.mdfTarget) : null,
          casingNnsTarget: row.casingNnsTarget !== undefined ? parseFloat(row.casingNnsTarget) : null,
          nnsTarget: row.nnsTarget !== undefined ? parseFloat(row.nnsTarget) : null,
          mppCount: row.mppCount !== undefined ? parseFloat(row.mppCount) : null,
          tempoMin: row.tempoMin !== undefined ? parseFloat(row.tempoMin) : null,

          rejectSachet: row.rejectSachet !== undefined ? parseFloat(row.rejectSachet) : null,
          rejectPlastik: row.rejectPlastik !== undefined ? parseFloat(row.rejectPlastik) : null,
          rejectFoil: row.rejectFoil !== undefined ? parseFloat(row.rejectFoil) : null,
          rejectCarton: row.rejectCarton !== undefined ? parseFloat(row.rejectCarton) : null,

          plastikLembar: row.plastikLembar !== undefined ? parseFloat(row.plastikLembar) : null,
          plastikKg: row.plastikKg !== undefined ? parseFloat(row.plastikKg) : null,
          plastikSisa: row.plastikSisa !== undefined ? parseFloat(row.plastikSisa) : null,
          plastikHasil: row.plastikHasil !== undefined ? parseFloat(row.plastikHasil) : null,

          cartonPcs: row.cartonPcs !== undefined ? parseFloat(row.cartonPcs) : null,
          cartonLembar: row.cartonLembar !== undefined ? parseFloat(row.cartonLembar) : null,
          cartonSisa: row.cartonSisa !== undefined ? parseFloat(row.cartonSisa) : null,
          cartonHasil: row.cartonHasil !== undefined ? parseFloat(row.cartonHasil) : null,

          totalPemakaian: row.totalPemakaian !== undefined ? parseFloat(row.totalPemakaian) : null,
          oneRollSachet: row.oneRollSachet !== undefined ? parseFloat(row.oneRollSachet) : null,
          outsetRoll: row.outsetRoll !== undefined ? parseFloat(row.outsetRoll) : null,
          inputKembaliOkp: row.inputKembaliOkp !== undefined ? parseFloat(row.inputKembaliOkp) : null,
          rejectKembaliOkp: row.rejectKembaliOkp !== undefined ? parseFloat(row.rejectKembaliOkp) : null,
          updatedBy: emailUser,
        };

        // If Availability, Performance, Quality, OEE are in the row, preserve them
        if (row.availability !== undefined) dataPayload.availability = parseFloat(row.availability);
        if (row.performance !== undefined) dataPayload.performance = parseFloat(row.performance);
        if (row.quality !== undefined) dataPayload.quality = parseFloat(row.quality);
        if (row.oee !== undefined) dataPayload.oee = parseFloat(row.oee);

        let okpLog;
        if (existingOkp) {
          okpLog = await tx.okpLog.update({
            where: { id: existingOkp.id },
            data: dataPayload
          });
        } else {
          okpLog = await tx.okpLog.create({
            data: {
              ...dataPayload,
              companyId,
              okpNumber: row.okpNumber,
              machineId: machine.id,
              createdBy: emailUser
            }
          });
        }

        // Recalculate OEE using standard helper
        await recalculateOkpLogOee(okpLog.id, tx);
        results.push(okpLog);
      }
    });

    return res.status(200).json({
      message: `Berhasil meng-import ${results.length} data log book packaging.`,
      count: results.length
    });

  } catch (error) {
    console.error("Import Packaging Logs Error:", error);
    return res.status(500).json({ error: error.message || "Gagal meng-import data log book." });
  }
}

module.exports = {
  parseAndImportOkpLogs,
  importPackagingLogs
};
