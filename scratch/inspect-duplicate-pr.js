const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function inspectDuplicatePr() {
  try {
    const recentActivities = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { id: "desc" },
      include: {
        okpLog: { include: { machine: true } },
        activityCode: { include: { category: true } }
      }
    });

    console.log("=== MOST RECENT 10 ACTIVITY LOGS ===");
    recentActivities.forEach(act => {
      console.log({
        id: act.id,
        okpLogId: act.okpLogId,
        okpNumber: act.okpLog ? act.okpLog.okpNumber : null,
        code: act.activityCode ? act.activityCode.code : null,
        category: act.activityCode && act.activityCode.category ? act.activityCode.category.code : null,
        startTime: act.startTime,
        endTime: act.endTime,
        duration: act.duration,
        brRootCause: act.brRootCause,
        createdBy: act.createdBy
      });
    });
  } catch (err) {
    console.error("Error inspecting activities:", err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDuplicatePr();
