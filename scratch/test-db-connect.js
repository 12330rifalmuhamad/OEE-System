const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("Connecting to PostgreSQL database...");
    await prisma.$connect();
    console.log("SUCCESS: Database connection established!");
    const count = await prisma.okpLog.count();
    console.log(`Total OKP Logs in DB: ${count}`);
  } catch (err) {
    console.error("FAILED to connect to DB:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
