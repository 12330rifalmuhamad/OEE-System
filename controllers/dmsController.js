const { db } = require("../lib/db");

async function getDmsActions(req, res) {
  try {
    const dmsActions = await db.dmsAction.findMany({
      where: { companyId: req.user.companyId },
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
    return res.json({ dmsActions });
  } catch (error) {
    console.error("GET DmsActions Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data tindakan DMS." });
  }
}

async function createDmsAction(req, res) {
  try {
    const { okpLogId, downtimeCode, actionPlan, pic, targetDate } = req.body;

    if (!downtimeCode || !actionPlan || !pic) {
      return res.status(400).json({ error: "Kode downtime, rencana tindakan, dan PIC wajib diisi." });
    }

    const dmsAction = await db.dmsAction.create({
      data: {
        companyId: req.user.companyId,
        okpLogId: okpLogId ? parseInt(okpLogId, 10) : null,
        downtimeCode: downtimeCode.toUpperCase().trim(),
        actionPlan: actionPlan.trim(),
        pic: pic.trim(),
        targetDate: targetDate ? new Date(targetDate) : null,
        status: "OPEN",
      },
    });

    return res.status(201).json({ message: "Tindakan DMS berhasil didaftarkan.", dmsAction });
  } catch (error) {
    console.error("POST DmsAction Error:", error);
    return res.status(500).json({ error: "Gagal mendaftarkan tindakan DMS." });
  }
}

async function updateDmsAction(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    if (isNaN(idInt)) {
      return res.status(400).json({ error: "ID tindakan DMS tidak valid." });
    }

    const { actionPlan, pic, targetDate, status } = req.body;

    const existing = await db.dmsAction.findFirst({
      where: { id: idInt, companyId: req.user.companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Tindakan DMS tidak ditemukan." });
    }

    const dmsAction = await db.dmsAction.update({
      where: { id: idInt },
      data: {
        actionPlan: actionPlan !== undefined ? actionPlan.trim() : existing.actionPlan,
        pic: pic !== undefined ? pic.trim() : existing.pic,
        targetDate: targetDate !== undefined ? (targetDate ? new Date(targetDate) : null) : existing.targetDate,
        status: status !== undefined ? status.toUpperCase() : existing.status,
      },
    });

    return res.json({ message: "Tindakan DMS berhasil diperbarui.", dmsAction });
  } catch (error) {
    console.error("PUT DmsAction Error:", error);
    return res.status(500).json({ error: "Gagal memperbarui tindakan DMS." });
  }
}

async function deleteDmsAction(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    if (isNaN(idInt)) {
      return res.status(400).json({ error: "ID tindakan DMS tidak valid." });
    }

    const existing = await db.dmsAction.findFirst({
      where: { id: idInt, companyId: req.user.companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Tindakan DMS tidak ditemukan." });
    }

    await db.dmsAction.delete({
      where: { id: idInt },
    });

    return res.json({ message: "Tindakan DMS berhasil dihapus." });
  } catch (error) {
    console.error("DELETE DmsAction Error:", error);
    return res.status(500).json({ error: "Gagal menghapus tindakan DMS." });
  }
}

module.exports = {
  getDmsActions,
  createDmsAction,
  updateDmsAction,
  deleteDmsAction,
};
