const { db } = require("../lib/db");

async function main() {
  const activeOkp = await db.okpLog.findFirst({
    orderBy: { date: "desc" },
    include: {
      activities: {
        include: {
          activityCode: {
            include: { category: true }
          }
        }
      }
    }
  });

  if (!activeOkp) {
    console.log("No active OKP found");
    process.exit(0);
  }

  console.log("ACTIVE OKP:", {
    id: activeOkp.id,
    okpNumber: activeOkp.okpNumber,
    machineId: activeOkp.machineId,
  });

  console.log("ACTIVITIES:");
  activeOkp.activities.forEach(act => {
    console.log({
      id: act.id,
      code: act.activityCode.code,
      category: act.activityCode.category.code,
      startTime: act.startTime,
      endTime: act.endTime,
      duration: act.duration,
    });
  });
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
