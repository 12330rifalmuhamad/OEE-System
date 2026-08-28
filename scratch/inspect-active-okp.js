const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function inspectActiveOkp() {
  try {
    const okp = await prisma.okpLog.findFirst({
      where: { okpNumber: { contains: "PD-5420BA" } },
      include: {
        machine: true,
        activities: {
          include: { activityCode: { include: { category: true } } },
          orderBy: { id: "desc" }
        }
      }
    });

    if (!okp) {
      console.log("OKP PD-5420BA not found directly by exact match. Fetching latest OKPs...");
      const latestOkps = await prisma.okpLog.findMany({
        take: 5,
        orderBy: { id: "desc" },
        include: {
          machine: true,
          activities: {
            include: { activityCode: { include: { category: true } } },
            orderBy: { id: "desc" },
            take: 3
          }
        }
      });
      console.log("Latest OKPs in DB:", JSON.stringify(latestOkps, null, 2));
      return;
    }

    console.log("=== OKP DETAIL ===");
    console.log(`ID: ${okp.id}, OKP: ${okp.okpNumber}, Machine: ${okp.machine ? okp.machine.name : 'N/A'} (ID: ${okp.machineId})`);
    console.log("Activities (Top 5):", JSON.stringify(okp.activities.slice(0, 5), null, 2));

    // Check open activity
    const openAct = okp.activities.find(a => a.endTime === null);
    console.log("Open Activity:", openAct ? {
      id: openAct.id,
      code: openAct.activityCode ? openAct.activityCode.code : 'N/A',
      category: openAct.activityCode && openAct.activityCode.category ? openAct.activityCode.category.code : 'N/A',
      startTime: openAct.startTime,
      duration: openAct.duration
    } : "NONE (All activities closed)");

  } catch (err) {
    console.error("Error inspecting OKP:", err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectActiveOkp();
