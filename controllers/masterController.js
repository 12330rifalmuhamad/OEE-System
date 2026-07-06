const { db } = require("../lib/db");
const { hashPassword } = require("../lib/auth");
const { initMqttListeners, activeClients } = require("../lib/mqttListener");

// ==========================================
// 1. MACHINES CRUD
// ==========================================

async function getMachines(req, res) {
  try {
    const machines = await db.machine.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { name: "asc" },
    });
    return res.json({ machines });
  } catch (error) {
    console.error("GET Machines Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data mesin." });
  }
}

async function createMachine(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nama mesin wajib diisi." });
    }

    const machine = await db.machine.create({
      data: {
        companyId: req.user.companyId,
        name,
      },
    });
    return res.status(201).json({ message: "Mesin berhasil ditambahkan.", machine });
  } catch (error) {
    console.error("POST Machine Error:", error);
    return res.status(500).json({ error: "Gagal menambahkan mesin." });
  }
}

async function updateMachine(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const idInt = parseInt(req.params.id, 10);
    const { name } = req.body;

    const existingMachine = await db.machine.findFirst({
      where: { id: idInt, companyId: req.user.companyId },
    });

    if (!existingMachine) {
      return res.status(404).json({ error: "Mesin tidak ditemukan." });
    }

    const updatedMachine = await db.machine.update({
      where: { id: idInt },
      data: {
        name: name !== undefined ? name : existingMachine.name,
      },
    });

    return res.json({ message: "Mesin berhasil diperbarui.", machine: updatedMachine });
  } catch (error) {
    console.error("PUT Machine Error:", error);
    return res.status(500).json({ error: "Gagal memperbarui data mesin." });
  }
}

async function deleteMachine(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const idInt = parseInt(req.params.id, 10);

    const existingMachine = await db.machine.findFirst({
      where: { id: idInt, companyId: req.user.companyId },
    });

    if (!existingMachine) {
      return res.status(404).json({ error: "Mesin tidak ditemukan." });
    }

    await db.machine.delete({
      where: { id: idInt },
    });

    return res.json({ message: "Mesin berhasil dihapus." });
  } catch (error) {
    console.error("DELETE Machine Error:", error);
    return res.status(500).json({ error: "Gagal menghapus mesin. Kemungkinan data mesin ini masih digunakan dalam transaksi produksi." });
  }
}

// ==========================================
// 2. PRODUCTS CRUD
// ==========================================

async function getProducts(req, res) {
  try {
    const products = await db.product.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { name: "asc" },
    });
    return res.json({ products });
  } catch (error) {
    console.error("GET Products Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data produk." });
  }
}

async function createProduct(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const { productCode, name, size, standarSpeed } = req.body;
    if (!name || standarSpeed === undefined) {
      return res.status(400).json({ error: "Nama produk dan standar speed wajib diisi." });
    }

    const product = await db.product.create({
      data: {
        companyId: req.user.companyId,
        productCode: productCode || null,
        name,
        size: size || null,
        standarSpeed: parseFloat(standarSpeed),
      },
    });

    return res.status(201).json({ message: "Produk berhasil ditambahkan.", product });
  } catch (error) {
    console.error("POST Product Error:", error);
    return res.status(500).json({ error: "Gagal menambahkan produk." });
  }
}

async function updateProduct(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const idInt = parseInt(req.params.id, 10);
    const { productCode, name, size, standarSpeed } = req.body;

    const existingProduct = await db.product.findFirst({
      where: { id: idInt, companyId: req.user.companyId },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Produk tidak ditemukan." });
    }

    const updatedProduct = await db.product.update({
      where: { id: idInt },
      data: {
        productCode: productCode !== undefined ? productCode : existingProduct.productCode,
        name: name !== undefined ? name : existingProduct.name,
        size: size !== undefined ? size : existingProduct.size,
        standarSpeed: standarSpeed !== undefined ? parseFloat(standarSpeed) : existingProduct.standarSpeed,
      },
    });

    return res.json({ message: "Produk berhasil diperbarui.", product: updatedProduct });
  } catch (error) {
    console.error("PUT Product Error:", error);
    return res.status(500).json({ error: "Gagal memperbarui produk." });
  }
}

async function deleteProduct(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const idInt = parseInt(req.params.id, 10);

    const existingProduct = await db.product.findFirst({
      where: { id: idInt, companyId: req.user.companyId },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Produk tidak ditemukan." });
    }

    await db.product.delete({
      where: { id: idInt },
    });

    return res.json({ message: "Produk berhasil dihapus." });
  } catch (error) {
    console.error("DELETE Product Error:", error);
    return res.status(500).json({ error: "Gagal menghapus produk. Kemungkinan data produk ini masih direferensikan oleh tabel transaksi lain." });
  }
}

// ==========================================
// 3. ACTIVITY CODES CRUD & BULK
// ==========================================

async function getActivityCodes(req, res) {
  try {
    const activityCodes = await db.activityCode.findMany({
      where: { companyId: req.user.companyId },
      include: { category: true },
      orderBy: { code: "asc" },
    });
    return res.json({ activityCodes });
  } catch (error) {
    console.error("GET ActivityCodes Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data activity codes." });
  }
}

async function createActivityCode(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const { categoryCode, code, mainActivity, subActivity, fullDescription } = req.body;
    if (!categoryCode || !code || !fullDescription) {
      return res.status(400).json({ error: "Kategori (categoryCode), Kode, dan Deskripsi Lengkap wajib diisi." });
    }

    const category = await db.activityCategory.findUnique({
      where: { code: categoryCode.toUpperCase() },
    });

    if (!category) {
      return res.status(400).json({ error: `Kategori aktivitas dengan kode '${categoryCode}' tidak valid.` });
    }

    const activityCode = await db.activityCode.create({
      data: {
        companyId: req.user.companyId,
        categoryId: category.id,
        code: code.toLowerCase(),
        mainActivity: mainActivity || null,
        subActivity: subActivity || null,
        fullDescription,
      },
      include: { category: true },
    });

    return res.status(201).json({ message: "Activity Code berhasil ditambahkan.", activityCode });
  } catch (error) {
    console.error("POST ActivityCode Error:", error);
    return res.status(500).json({ error: "Gagal menambahkan Activity Code." });
  }
}

async function updateActivityCode(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const idInt = parseInt(req.params.id, 10);
    const { categoryCode, code, mainActivity, subActivity, fullDescription } = req.body;

    const existingCode = await db.activityCode.findFirst({
      where: { id: idInt, companyId: req.user.companyId },
    });

    if (!existingCode) {
      return res.status(404).json({ error: "Activity Code tidak ditemukan." });
    }

    const updateData = {};
    if (code) updateData.code = code.toLowerCase();
    if (mainActivity !== undefined) updateData.mainActivity = mainActivity;
    if (subActivity !== undefined) updateData.subActivity = subActivity;
    if (fullDescription !== undefined) updateData.fullDescription = fullDescription;

    if (categoryCode) {
      const category = await db.activityCategory.findUnique({
        where: { code: categoryCode.toUpperCase() },
      });
      if (!category) {
        return res.status(400).json({ error: `Kategori '${categoryCode}' tidak valid.` });
      }
      updateData.categoryId = category.id;
    }

    const updated = await db.activityCode.update({
      where: { id: idInt },
      data: updateData,
      include: { category: true },
    });

    return res.json({ message: "Activity Code berhasil diperbarui.", activityCode: updated });
  } catch (error) {
    console.error("PUT ActivityCode Error:", error);
    return res.status(500).json({ error: "Gagal memperbarui Activity Code." });
  }
}

async function deleteActivityCode(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const idInt = parseInt(req.params.id, 10);

    const existingCode = await db.activityCode.findFirst({
      where: { id: idInt, companyId: req.user.companyId },
    });

    if (!existingCode) {
      return res.status(404).json({ error: "Activity Code tidak ditemukan." });
    }

    await db.activityCode.delete({
      where: { id: idInt },
    });

    return res.json({ message: "Activity Code berhasil dihapus." });
  } catch (error) {
    console.error("DELETE ActivityCode Error:", error);
    return res.status(500).json({ error: "Gagal menghapus Activity Code. Kemungkinan data ini masih direferensikan oleh tabel transaksi." });
  }
}

async function bulkCreateActivityCodes(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const { codes } = req.body;
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ error: "Data kode aktivitas kosong atau tidak valid." });
    }

    const categories = await db.activityCategory.findMany();
    const categoryMap = new Map(categories.map((c) => [c.code.toUpperCase(), c.id]));

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < codes.length; i++) {
      const item = codes[i];
      const { categoryCode, code, mainActivity, subActivity, fullDescription } = item;

      if (!categoryCode || !code || !fullDescription) {
        errorCount++;
        errors.push(`Baris ${i + 1}: Kategori, Kode, dan Deskripsi wajib diisi.`);
        continue;
      }

      const categoryId = categoryMap.get(categoryCode.toString().toUpperCase().trim());
      if (!categoryId) {
        errorCount++;
        errors.push(`Baris ${i + 1}: Kategori '${categoryCode}' tidak valid.`);
        continue;
      }

      const normalizedCode = code.toString().toLowerCase().trim();

      const existing = await db.activityCode.findFirst({
        where: {
          companyId: req.user.companyId,
          code: normalizedCode,
        },
      });

      if (existing) {
        await db.activityCode.update({
          where: { id: existing.id },
          data: {
            categoryId,
            mainActivity: mainActivity ? mainActivity.toString().trim() : null,
            subActivity: subActivity ? subActivity.toString().trim() : null,
            fullDescription: fullDescription.toString().trim(),
          },
        });
        updatedCount++;
      } else {
        await db.activityCode.create({
          data: {
            companyId: req.user.companyId,
            categoryId,
            code: normalizedCode,
            mainActivity: mainActivity ? mainActivity.toString().trim() : null,
            subActivity: subActivity ? subActivity.toString().trim() : null,
            fullDescription: fullDescription.toString().trim(),
          },
        });
        createdCount++;
      }
    }

    return res.json({
      message: `Bulk import selesai. ${createdCount} baru dibuat, ${updatedCount} diperbarui.`,
      summary: {
        created: createdCount,
        updated: updatedCount,
        failed: errorCount,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : [],
    });
  } catch (error) {
    console.error("Bulk Import ActivityCodes Error:", error);
    return res.status(500).json({ error: "Gagal memproses bulk import." });
  }
}

// ==========================================
// 4. MQTT TELEMETRY CONFIGS
// ==========================================

async function getMqttConfigs(req, res) {
  try {
    const configs = await db.mqttConfig.findMany({
      where: { companyId: req.user.companyId },
      include: {
        machine: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const enrichedConfigs = configs.map((config) => {
      const client = activeClients[config.machineId];
      const isConnected = client && client.connected ? 1 : 0;

      return {
        ...config,
        status: isConnected
      };
    });

    return res.json({ mqttConfigs: enrichedConfigs });
  } catch (error) {
    console.error("GET MQTT Configs Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data konfigurasi MQTT." });
  }
}

async function saveMqttConfig(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const {
      machineId,
      brokerUrl,
      clientId,
      username,
      password,
      counterTopic,
      counterJsonPath,
      statusTopic,
      statusJsonPath,
      statusRunValue,
      statusStopValue,
    } = req.body;

    if (!machineId || !brokerUrl) {
      return res.status(400).json({ error: "Machine ID dan Broker URL wajib diisi." });
    }

    const machineIdInt = parseInt(machineId, 10);

    const machine = await db.machine.findFirst({
      where: { id: machineIdInt, companyId: req.user.companyId },
    });

    if (!machine) {
      return res.status(404).json({ error: "Mesin tidak ditemukan." });
    }

    const mqttConfig = await db.mqttConfig.upsert({
      where: { machineId: machineIdInt },
      update: {
        brokerUrl: brokerUrl.trim(),
        clientId: clientId ? clientId.trim() : null,
        username: username ? username.trim() : null,
        password: password ? password.trim() : null,
        counterTopic: counterTopic ? counterTopic.trim() : null,
        counterJsonPath: counterJsonPath ? counterJsonPath.trim() : null,
        statusTopic: statusTopic ? statusTopic.trim() : null,
        statusJsonPath: statusJsonPath ? statusJsonPath.trim() : null,
        statusRunValue: statusRunValue ? statusRunValue.trim() : "RUN",
        statusStopValue: statusStopValue ? statusStopValue.trim() : "STOP",
      },
      create: {
        companyId: req.user.companyId,
        machineId: machineIdInt,
        brokerUrl: brokerUrl.trim(),
        clientId: clientId ? clientId.trim() : null,
        username: username ? username.trim() : null,
        password: password ? password.trim() : null,
        counterTopic: counterTopic ? counterTopic.trim() : null,
        counterJsonPath: counterJsonPath ? counterJsonPath.trim() : null,
        statusTopic: statusTopic ? statusTopic.trim() : null,
        statusJsonPath: statusJsonPath ? statusJsonPath.trim() : null,
        statusRunValue: statusRunValue ? statusRunValue.trim() : "RUN",
        statusStopValue: statusStopValue ? statusStopValue.trim() : "STOP",
      },
    });

    // Hot-reload background listeners asynchronously
    initMqttListeners().catch((err) => {
      console.error("[MQTT-HOTRELOAD] Failed to reload listeners:", err);
    });

    return res.json({
      message: "Konfigurasi MQTT berhasil disimpan.",
      mqttConfig,
    });
  } catch (error) {
    console.error("POST MQTT Config Error:", error);
    return res.status(500).json({ error: "Gagal menyimpan konfigurasi MQTT." });
  }
}

async function deleteMqttConfig(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const idInt = parseInt(req.params.id, 10);

    const existing = await db.mqttConfig.findFirst({
      where: { id: idInt, companyId: req.user.companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Konfigurasi MQTT tidak ditemukan." });
    }

    await db.mqttConfig.delete({
      where: { id: idInt },
    });

    // Hot-reload to end the connection
    initMqttListeners().catch((err) => {
      console.error("[MQTT-HOTRELOAD] Failed to reload listeners after delete:", err);
    });

    return res.json({ message: "Konfigurasi MQTT berhasil dihapus." });
  } catch (error) {
    console.error("DELETE MQTT Config Error:", error);
    return res.status(500).json({ error: "Gagal menghapus konfigurasi MQTT." });
  }
}

// ==========================================
// 5. KPI TARGETS
// ==========================================

async function getKpiTarget(req, res) {
  try {
    let kpiTarget = await db.kpiTarget.findUnique({
      where: { companyId: req.user.companyId },
    });

    if (!kpiTarget) {
      kpiTarget = {
        id: "default",
        companyId: req.user.companyId,
        oeeTarget: 85.0,
        availTarget: 90.0,
        perfTarget: 95.0,
        qualTarget: 99.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return res.json({ kpiTarget });
  } catch (error) {
    console.error("GET KpiTargets Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data KPI Target." });
  }
}

async function saveKpiTarget(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const { oeeTarget, availTarget, perfTarget, qualTarget } = req.body;

    const kpiTarget = await db.kpiTarget.upsert({
      where: { companyId: req.user.companyId },
      update: {
        oeeTarget: parseFloat(oeeTarget) || 85.0,
        availTarget: parseFloat(availTarget) || 90.0,
        perfTarget: parseFloat(perfTarget) || 95.0,
        qualTarget: parseFloat(qualTarget) || 99.0,
      },
      create: {
        companyId: req.user.companyId,
        oeeTarget: parseFloat(oeeTarget) || 85.0,
        availTarget: parseFloat(availTarget) || 90.0,
        perfTarget: parseFloat(perfTarget) || 95.0,
        qualTarget: parseFloat(qualTarget) || 99.0,
      },
    });

    return res.json({ message: "Target KPI berhasil diperbarui.", kpiTarget });
  } catch (error) {
    console.error("POST KpiTargets Error:", error);
    return res.status(500).json({ error: "Gagal memperbarui Target KPI." });
  }
}

// ==========================================
// 6. EMPLOYEES / USERS CRUD
// ==========================================

async function getEmployees(req, res) {
  try {
    const employees = await db.user.findMany({
      where: { companyId: req.user.companyId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { email: "asc" },
    });
    return res.json({ employees });
  } catch (error) {
    console.error("GET Employees Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data karyawan." });
  }
}

async function createEmployee(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password, dan role wajib diisi." });
    }

    const roleUpper = role.toUpperCase();
    if (roleUpper !== "SUPERVISOR" && roleUpper !== "OPERATOR") {
      return res.status(400).json({ error: "Role tidak valid. Gunakan SUPERVISOR atau OPERATOR." });
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email sudah terdaftar." });
    }

    const hashedPassword = await hashPassword(password);

    const employee = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        role: roleUpper,
        companyId: req.user.companyId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ message: "Karyawan berhasil didaftarkan.", employee });
  } catch (error) {
    console.error("POST Employee Error:", error);
    return res.status(500).json({ error: "Gagal mendaftarkan karyawan." });
  }
}

async function updateEmployee(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const idInt = parseInt(req.params.id, 10);
    const { email, password, role } = req.body;

    const existingEmployee = await db.user.findFirst({
      where: { id: idInt, companyId: req.user.companyId },
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: "Karyawan tidak ditemukan." });
    }

    let roleUpper = existingEmployee.role;
    if (role) {
      roleUpper = role.toUpperCase();
      if (roleUpper !== "SUPERVISOR" && roleUpper !== "OPERATOR") {
        return res.status(400).json({ error: "Role tidak valid. Gunakan SUPERVISOR atau OPERATOR." });
      }
    }

    const updateData = { role: roleUpper };

    if (email) {
      if (email !== existingEmployee.email) {
        const emailExists = await db.user.findUnique({ where: { email } });
        if (emailExists) {
          return res.status(400).json({ error: "Email sudah terdaftar." });
        }
        updateData.email = email;
      }
    }

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const updatedEmployee = await db.user.update({
      where: { id: idInt },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ message: "Karyawan berhasil diperbarui.", employee: updatedEmployee });
  } catch (error) {
    console.error("PUT Employee Error:", error);
    return res.status(500).json({ error: "Gagal memperbarui data karyawan." });
  }
}

async function deleteEmployee(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const idInt = parseInt(req.params.id, 10);

    const existingEmployee = await db.user.findFirst({
      where: { id: idInt, companyId: req.user.companyId },
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: "Karyawan tidak ditemukan." });
    }

    if (existingEmployee.id === req.user.id) {
      return res.status(400).json({ error: "Anda tidak dapat menghapus akun Anda sendiri." });
    }

    await db.user.delete({
      where: { id: idInt },
    });

    return res.json({ message: "Karyawan berhasil dihapus." });
  } catch (error) {
    console.error("DELETE Employee Error:", error);
    return res.status(500).json({ error: "Gagal menghapus karyawan. Kemungkinan akun ini memiliki keterkaitan relasi database lain." });
  }
}

// ==========================================
// 7. LINE PROCESSES CRUD
// ==========================================

async function getLineProcesses(req, res) {
  try {
    const lineProcesses = await db.lineProcess.findMany({
      where: { companyId: req.user.companyId },
      include: {
        machines: {
          select: { id: true, name: true }
        }
      },
      orderBy: { name: "asc" },
    });
    return res.json({ lineProcesses });
  } catch (error) {
    console.error("GET LineProcesses Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data line process." });
  }
}

async function createLineProcess(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const { name, machineIds } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nama line process wajib diisi." });
    }

    // Create the LineProcess
    const lineProcess = await db.lineProcess.create({
      data: {
        companyId: req.user.companyId,
        name,
      },
    });

    // If there are machines to associate, update them
    if (machineIds && Array.isArray(machineIds) && machineIds.length > 0) {
      const parsedIds = machineIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      await db.machine.updateMany({
        where: {
          id: { in: parsedIds },
          companyId: req.user.companyId
        },
        data: {
          lineProcessId: lineProcess.id
        }
      });
    }

    // Retrieve the newly created LineProcess with its machines
    const createdLine = await db.lineProcess.findUnique({
      where: { id: lineProcess.id },
      include: { machines: true }
    });

    return res.status(201).json({ message: "Line process berhasil ditambahkan.", lineProcess: createdLine });
  } catch (error) {
    console.error("POST LineProcess Error:", error);
    return res.status(500).json({ error: "Gagal menambahkan line process." });
  }
}

async function updateLineProcess(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const idInt = parseInt(req.params.id, 10);
    const { name, machineIds } = req.body;

    const existingLine = await db.lineProcess.findFirst({
      where: { id: idInt, companyId: req.user.companyId },
    });

    if (!existingLine) {
      return res.status(404).json({ error: "Line process tidak ditemukan." });
    }

    // Update the LineProcess name
    const updatedLine = await db.lineProcess.update({
      where: { id: idInt },
      data: {
        name: name !== undefined ? name : existingLine.name,
      },
    });

    // Handle machine association updates if provided
    if (machineIds && Array.isArray(machineIds)) {
      const parsedIds = machineIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

      // 1. Unlink all currently linked machines for this line
      await db.machine.updateMany({
        where: {
          lineProcessId: idInt,
          companyId: req.user.companyId
        },
        data: {
          lineProcessId: null
        }
      });

      // 2. Link the newly chosen machines
      if (parsedIds.length > 0) {
        await db.machine.updateMany({
          where: {
            id: { in: parsedIds },
            companyId: req.user.companyId
          },
          data: {
            lineProcessId: idInt
          }
        });
      }
    }

    const finalLine = await db.lineProcess.findUnique({
      where: { id: idInt },
      include: { machines: true }
    });

    return res.json({ message: "Line process berhasil diperbarui.", lineProcess: finalLine });
  } catch (error) {
    console.error("PUT LineProcess Error:", error);
    return res.status(500).json({ error: "Gagal memperbarui data line process." });
  }
}

async function deleteLineProcess(req, res) {
  try {
    if (req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ error: "Hanya SUPERVISOR yang diizinkan." });
    }

    const idInt = parseInt(req.params.id, 10);

    const existingLine = await db.lineProcess.findFirst({
      where: { id: idInt, companyId: req.user.companyId },
    });

    if (!existingLine) {
      return res.status(404).json({ error: "Line process tidak ditemukan." });
    }

    // Safe unlinking of machines
    await db.machine.updateMany({
      where: { lineProcessId: idInt, companyId: req.user.companyId },
      data: { lineProcessId: null }
    });

    await db.lineProcess.delete({
      where: { id: idInt },
    });

    return res.json({ message: "Line process berhasil dihapus." });
  } catch (error) {
    console.error("DELETE LineProcess Error:", error);
    return res.status(500).json({ error: "Gagal menghapus line process." });
  }
}

module.exports = {
  getMachines,
  createMachine,
  updateMachine,
  deleteMachine,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getActivityCodes,
  createActivityCode,
  updateActivityCode,
  deleteActivityCode,
  bulkCreateActivityCodes,
  getMqttConfigs,
  saveMqttConfig,
  deleteMqttConfig,
  getKpiTarget,
  saveKpiTarget,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getLineProcesses,
  createLineProcess,
  updateLineProcess,
  deleteLineProcess,
};
