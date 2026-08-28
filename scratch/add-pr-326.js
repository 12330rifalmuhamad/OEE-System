const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pr = await prisma.activityCode.findFirst({
    where: {
      OR: [
        { code: { equals: 'PR.1', mode: 'insensitive' } },
        { category: { code: 'PR' } }
      ]
    }
  });
  if (pr) {
    await prisma.activityLog.create({
      data: {
        okpLogId: 326,
        activityCodeId: pr.id,
        startTime: new Date(),
        endTime: null,
        duration: 0,
        createdBy: 'SYSTEM'
      }
    });
    console.log('PR added to OKP 326 with code:', pr.code);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
