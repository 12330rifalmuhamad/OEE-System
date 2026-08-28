const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function reset() {
  console.log("🧹 Memulai reset data transaksi OEE...");

  try {
    // 1. Hapus semua data transaksi
    console.log("- Menghapus semua data DMS Action...");
    await prisma.dmsAction.deleteMany({});

    console.log("- Menghapus semua data Activity Log...");
    await prisma.activityLog.deleteMany({});

    console.log("- Menghapus semua data OKP Log...");
    await prisma.okpLog.deleteMany({});

    console.log("✅ Data transaksi lama berhasil dibersihkan.");

    // 2. Ambil referensi Master Data yang dibutuhkan
    const company = await prisma.company.findFirst();
    const machine = await prisma.machine.findFirst({
      where: { name: { contains: "Filling", mode: "insensitive" } }
    }) || await prisma.machine.findFirst(); // Fallback to first machine
    const product = await prisma.product.findFirst(); // Produk default
    const runCode = await prisma.activityCode.findFirst({
      where: {
        category: { code: "PR" }
      }
    });

    if (!company || !machine || !product || !runCode) {
      console.warn("⚠️ Master data (Company/Machine/Product/ActivityCode) tidak lengkap. Pastikan Anda sudah menjalankan 'npx prisma db seed' terlebih dahulu.");
      return;
    }

    // 3. Buat OKP aktif baru untuk hari ini di mesin utama (Filling Line A4) mewakili lini tersebut
    const today = new Date();
    const okpNumber = "OKP-TEST-" + today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
    
    console.log(`- Membuat OKP tes [${okpNumber}] pada mesin utama [${machine.name}] mewakili lini...`);
    const okpLog = await prisma.okpLog.create({
      data: {
        companyId: company.id,
        okpNumber: okpNumber,
        date: today,
        shift: 1,
        machineId: machine.id,
        productId: product.id,
        groupLeader: "Budi Santoso (Test)",
        operator: "Andi Wijaya (Test)",
        helper: "Siti Rahma (Test)",
        loadingTime: 480.0,
        totalOutput: 0.0,
        rework: 0.0,
        reject: 0.0,
      }
    });
    console.log(`  ✅ Sukses membuat OKP aktif untuk lini: ${okpLog.okpNumber}`);

    // 4. Inisialisasi status awal mesin sebagai RUNNING (Normal Run)
    await prisma.activityLog.create({
      data: {
        okpLogId: okpLog.id,
        activityCodeId: runCode.id,
        startTime: new Date(),
        endTime: null,
        duration: 0,
      }
    });
    console.log("🚀 Reset selesai! Mesin siap menerima sinyal telemetri dan memicu popup.");

  } catch (err) {
    console.error("❌ Terjadi kesalahan saat mereset data:", err);
  } finally {
    await prisma.$disconnect();
  }
}

reset();
