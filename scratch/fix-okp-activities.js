const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const okp325 = await prisma.okpLog.findUnique({
    where: { id: 325 },
    include: { activities: { include: { activityCode: true } } }
  });
  const okp326 = await prisma.okpLog.findUnique({
    where: { id: 326 }
  });

  if (!okp325 || !okp326) {
    console.log("OKPs not found");
    return;
  }

  // Find open or non-SE.8 activity on 325 after SE.8
  const se8 = okp325.activities.find(a => a.activityCode && a.activityCode.code.toLowerCase() === 'se.8');
  const se8EndTime = se8 ? se8.endTime : null;

  const actsToMove = okp325.activities.filter(a => {
    if (!a.activityCode) return false;
    const code = a.activityCode.code.toLowerCase();
    if (code === 'se.8') return false;
    if (se8EndTime && a.startTime >= se8EndTime) return true;
    if (a.endTime === null) return true;
    return false;
  });

  console.log(`Found ${actsToMove.length} activities to move from OKP 325 to OKP 326:`, actsToMove.map(a => `${a.id}: ${a.activityCode.code}`));

  const now = new Date();
  for (const act of actsToMove) {
    const isNowNull = act.endTime === null;
    let dur = act.duration;
    if (isNowNull) {
      const diff = (now - new Date(act.startTime)) / 60000;
      dur = parseFloat(diff.toFixed(2));
    }

    await prisma.activityLog.update({
      where: { id: act.id },
      data: {
        okpLogId: okp326.id,
        endTime: isNowNull ? now : act.endTime,
        duration: dur
      }
    });
  }

  // Check if 326 has a PR running log
  const prCode = await prisma.activityCode.findFirst({ where: { code: 'PR.1' } });
  if (prCode) {
    await prisma.activityLog.create({
      data: {
        okpLogId: okp326.id,
        activityCodeId: prCode.id,
        startTime: now,
        endTime: null,
        duration: 0,
        createdBy: 'SYSTEM_FIX'
      }
    });
  }

  console.log("Fix completed successfully!");
}

fix().catch(console.error).finally(() => prisma.$disconnect());
