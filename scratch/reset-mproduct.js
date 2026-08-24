const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetMProduct() {
  try {
    console.log("🧹 Resetting mProduct database table...");

    // 1. Delete dependent OKP logs that reference products
    const deletedOkpLogs = await prisma.okpLog.deleteMany({});
    console.log(`Deleted ${deletedOkpLogs.count} dependent OKP log entries.`);

    // 2. Delete product machine speeds
    const deletedSpeeds = await prisma.productMachineSpeed.deleteMany({});
    console.log(`Deleted ${deletedSpeeds.count} product machine speed entries.`);

    // 3. Delete all products in mProduct
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`Deleted ${deletedProducts.count} rows from mProduct table.`);

    const countAfter = await prisma.product.count();
    console.log(`Current mProduct row count: ${countAfter}`);
  } catch (error) {
    console.error("Error resetting mProduct:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetMProduct();
