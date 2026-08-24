const { db } = require('../lib/db');

async function resetProducts() {
  console.log("Memulai reset Master Produk...");

  // 1. Hapus transaksi/activityLog & okpLog agar relasi foreign key bersih
  await db.activityLog.deleteMany({});
  await db.okpLog.deleteMany({});

  // 2. Hapus ProductMachineSpeed
  await db.productMachineSpeed.deleteMany({});

  // 3. Hapus seluruh data Produk
  const deleted = await db.product.deleteMany({});

  console.log(`✅ Sukses menghapus seluruh master produk (${deleted.count} produk berhasil dibersihkan).`);
  process.exit(0);
}

resetProducts().catch(err => {
  console.error("Error resetting products:", err);
  process.exit(1);
});
