const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  try {
    const configs = await prisma.mqttConfig.findMany({
      include: { machine: { include: { lineProcess: true } } }
    });
    console.log("=== Active MQTT Configurations ===");
    console.log(JSON.stringify(configs.map(c => ({
      machine: c.machine.name,
      line: c.machine.lineProcess?.name,
      counterTopic: c.counterTopic,
      statusTopic: c.statusTopic
    })), null, 2));

    const okps = await prisma.okpLog.findMany({
      orderBy: { date: "desc" },
      take: 1,
      include: {
        machine: { include: { lineProcess: true } },
        product: true,
        activities: {
          include: { activityCode: { include: { category: true } } },
          orderBy: { id: "desc" }
        }
      }
    });

    console.log("\n=== Latest OKP Log & Activity Logs ===");
    if (okps.length > 0) {
      const log = okps[0];
      console.log(`OKP ID: ${log.id}`);
      console.log(`OKP Number: ${log.okpNumber}`);
      console.log(`Production Line: ${log.machine.lineProcess?.name || log.machine.name}`);
      console.log(`FG Output: ${log.totalOutput}`);
      console.log(`OEE: ${log.oee}%, Availability: ${log.availability}%, Performance: ${log.performance}%, Quality: ${log.quality}%`);
      console.log(`Downtime minutes: ${log.downtime}`);
      console.log("\nActivity Logs (Newest to Oldest):");
      log.activities.slice(0, 10).forEach(act => {
        console.log(`- [${act.activityCode.category.code}] ${act.activityCode.code} (${act.activityCode.fullDescription}) | Start: ${act.startTime?.toISOString()} | End: ${act.endTime?.toISOString() || "ACTIVE"} | Duration: ${act.duration} mins`);
      });
    } else {
      console.log("No OKP logs found.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
