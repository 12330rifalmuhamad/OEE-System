const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("=== LOGS DIAGNOSTIC ===");
    
    // OKP Logs
    const okps = await prisma.okpLog.findMany({
      include: {
        activities: true
      }
    });
    
    console.log(`Total OKP Logs: ${okps.length}`);
    okps.forEach(okp => {
      console.log(`- OKP ID: ${okp.id}, Number: ${okp.okpNumber}, Date: ${okp.date}, CompanyID: ${okp.companyId}, MachineID: ${okp.machineId}, Total Activities: ${okp.activities.length}`);
      okp.activities.forEach(act => {
        console.log(`  * Activity ID: ${act.id}, CodeID: ${act.activityCodeId}, Duration: ${act.duration}, Start: ${act.startTime}, End: ${act.endTime}, brRootCause: ${act.brRootCause}`);
      });
    });

  } catch (error) {
    console.error("Diagnostic Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
