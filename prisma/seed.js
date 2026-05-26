const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database seeding...");

  // 0. Reset existing data to prevent unique constraints errors
  console.log("🧹 Cleaning up existing records...");
  await prisma.dmsAction.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.okpLog.deleteMany({});
  await prisma.kpiTarget.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.activityCode.deleteMany({});
  await prisma.machine.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.activityCategory.deleteMany({});
  await prisma.company.deleteMany({});

  // 1. SEED COMPANY (Multi-tenant Platform)
  console.log("🏢 Seeding Company...");
  const company = await prisma.company.create({
    data: {
      name: "PT Kalbe Morinaga Indonesia",
      subscription: "ENTERPRISE",
    },
  });

  // 2. SEED USERS (with hashed passwords using bcryptjs)
  console.log("👤 Seeding Users...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  await prisma.user.createMany({
    data: [
      {
        email: "owner@kalbe.co.id",
        password: hashedPassword,
        role: "OWNER",
        companyId: company.id,
      },
      {
        email: "manager@kalbe.co.id",
        password: hashedPassword,
        role: "MANAGER",
        companyId: company.id,
      },
      {
        email: "operator@kalbe.co.id",
        password: hashedPassword,
        role: "OPERATOR",
        companyId: company.id,
      },
    ],
  });

  // 3. SEED GLOBAL ACTIVITY CATEGORIES (PR, SH, BR, SE, MI, CT, OT, ST)
  console.log("📦 Seeding Global Activity Categories...");
  const categories = {
    PR: await prisma.activityCategory.create({ data: { code: "PR", name: "Process Run (Productive)" } }),
    SH: await prisma.activityCategory.create({ data: { code: "SH", name: "Scheduled Down" } }),
    BR: await prisma.activityCategory.create({ data: { code: "BR", name: "Breakdown Stoppages" } }),
    SE: await prisma.activityCategory.create({ data: { code: "SE", name: "Setup & Adjustments" } }),
    MI: await prisma.activityCategory.create({ data: { code: "MI", name: "Minor Stoppages" } }),
    CT: await prisma.activityCategory.create({ data: { code: "CT", name: "Changeover" } }),
    OT: await prisma.activityCategory.create({ data: { code: "OT", name: "Other Downtimes" } }),
    ST: await prisma.activityCategory.create({ data: { code: "ST", name: "Startup Losses" } }),
  };

  // 4. SEED SPECIFIC ACTIVITY CODES per Company
  console.log("⚙️ Seeding Specific Activity Codes...");
  const codes = {
    normalRun: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.PR.id,
        code: "pr.1",
        mainActivity: "Process Run",
        subActivity: "Normal Running",
        fullDescription: "Normal running production process at target speed",
      },
    }),
    weeklyCleaning: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.SH.id,
        code: "sh.1",
        mainActivity: "Scheduled Down",
        subActivity: "Weekly Cleaning",
        fullDescription: "Scheduled weekly cleaning and line hygiene",
      },
    }),
    preventiveMaint: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.SH.id,
        code: "sh.2",
        mainActivity: "Scheduled Down",
        subActivity: "Preventive Maintenance",
        fullDescription: "Routine bi-weekly preventive maintenance audit",
      },
    }),
    conveyorJam: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.BR.id,
        code: "br.1",
        mainActivity: "Breakdown Mechanical",
        subActivity: "Chain Conveyor Jammed",
        fullDescription: "Main outfeed chain conveyor jammed with cartoon boxes",
      },
    }),
    sensorFault: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.BR.id,
        code: "br.2",
        mainActivity: "Breakdown Electrical",
        subActivity: "Sensor Photoeye Fault",
        fullDescription: "Line block photoeye sensor failed or misaligned",
      },
    }),
    calibration: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.SE.id,
        code: "se.1",
        mainActivity: "Setup & Adjustments",
        subActivity: "Weight Dosing Calibration",
        fullDescription: "Weight filling head adjustment and dosing test",
      },
    }),
    minorStoppage: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.MI.id,
        code: "mi.1",
        mainActivity: "Minor Stoppages",
        subActivity: "Chute Jamming",
        fullDescription: "Temporary chute blockage cleared within 2 minutes",
      },
    }),
  };

  // 5. SEED PRODUCTION MACHINES
  console.log("🏭 Seeding Machines...");
  const machines = [
    await prisma.machine.create({ data: { name: "Filling Line A4", companyId: company.id } }),
    await prisma.machine.create({ data: { name: "Seaming Line A4", companyId: company.id } }),
    await prisma.machine.create({ data: { name: "Cartooning Line A4", companyId: company.id } }),
  ];

  // 6. SEED PRODUCTS & STANDARDS SPEED
  console.log("📦 Seeding Products...");
  const products = [
    await prisma.product.create({
      data: {
        companyId: company.id,
        productCode: "CHIL-KID-800",
        name: "Chil Kid Platinum Vanilla",
        size: "800g",
        standarSpeed: 120.0, // 120 pcs per menit
      },
    }),
    await prisma.product.create({
      data: {
        companyId: company.id,
        productCode: "BMT-GOLD-400",
        name: "Morinaga BMT Gold Regular",
        size: "400g",
        standarSpeed: 140.0, // 140 pcs per menit
      },
    }),
    await prisma.product.create({
      data: {
        companyId: company.id,
        productCode: "CHIL-MIL-800",
        name: "Chil Mil Regular Honey",
        size: "800g",
        standarSpeed: 110.0,
      },
    }),
  ];

  // 7. SEED KPI BENCHMARKS TARGET (World-Class OEE Standard)
  console.log("🎯 Seeding KPI Benchmarks Target...");
  await prisma.kpiTarget.create({
    data: {
      companyId: company.id,
      oeeTarget: 85.0,
      availTarget: 90.0,
      perfTarget: 95.0,
      qualTarget: 99.0,
    },
  });

  // 8. SEED TRANSACTION DATA (Historical OKP logs for the last 3 days)
  console.log("📊 Seeding Historical OKP Production Logs & Downtimes...");
  
  // Date helpers
  const day1 = new Date(); day1.setDate(day1.getDate() - 2);
  const day2 = new Date(); day2.setDate(day2.getDate() - 1);
  const day3 = new Date(); // Today

  const okpLogsData = [
    {
      okpNumber: "OKP-20260523-01",
      date: day1,
      shift: 1,
      machineId: machines[0].id,
      productId: products[0].id,
      groupLeader: "Agus Prasetyo",
      operator: "Bambang Pamungkas",
      helper: "Doni Setiawan",
      loadingTime: 480.0,
      totalOutput: 48200.0,
      rework: 80.0,
      reject: 20.0,
      sampleQc: 5.0,
    },
    {
      okpNumber: "OKP-20260524-01",
      date: day2,
      shift: 2,
      machineId: machines[0].id,
      productId: products[1].id,
      groupLeader: "Agus Prasetyo",
      operator: "Candra Darusman",
      helper: "Eko Wahyudi",
      loadingTime: 480.0,
      totalOutput: 51200.0,
      rework: 120.0,
      reject: 35.0,
      sampleQc: 4.0,
    },
    {
      okpNumber: "OKP-20260525-01",
      date: day3,
      shift: 1,
      machineId: machines[0].id,
      productId: products[0].id,
      groupLeader: "Yusuf Habibie",
      operator: "Feri Irawan",
      helper: "Guntur Triaji",
      loadingTime: 480.0,
      totalOutput: 46100.0,
      rework: 90.0,
      reject: 15.0,
      sampleQc: 6.0,
    },
  ];

  for (const okpData of okpLogsData) {
    const okpLog = await prisma.okpLog.create({
      data: {
        ...okpData,
        companyId: company.id,
      },
    });

    // Seed activity logs (productive process run & downtime stoppages) for each OKP
    console.log(`⏱️ Seeding Activity Logs for ${okpLog.okpNumber}...`);

    // 1. Process Run (Productive normal run)
    await prisma.activityLog.create({
      data: {
        okpLogId: okpLog.id,
        activityCodeId: codes.normalRun.id,
        duration: 410.0, // Productive time
      },
    });

    // 2. Setup Calibration (15 minutes)
    await prisma.activityLog.create({
      data: {
        okpLogId: okpLog.id,
        activityCodeId: codes.calibration.id,
        duration: 15.0,
        startTime: new Date(okpLog.date.getTime() + 60 * 60 * 1000), // 1 hour after start
        endTime: new Date(okpLog.date.getTime() + 75 * 60 * 1000),
      },
    });

    // 3. Breakdown Mechanical (Conveyor Jammed - 35 minutes)
    const conveyorStopStart = new Date(okpLog.date.getTime() + 180 * 60 * 1000); // 3 hours after start
    const conveyorStopEnd = new Date(okpLog.date.getTime() + 215 * 60 * 1000);
    
    const conveyorActivity = await prisma.activityLog.create({
      data: {
        okpLogId: okpLog.id,
        activityCodeId: codes.conveyorJam.id,
        duration: 35.0,
        startTime: conveyorStopStart,
        endTime: conveyorStopEnd,
        brRootCause: "8 Basic Competency - Loose tension chain",
        brMtdtWaiting: 10.0,
        brMtdtRepair: 20.0,
        brMtdtStartup: 5.0,
      },
    });

    // 4. Minor stoppages (10 minutes total across the shift)
    await prisma.activityLog.create({
      data: {
        okpLogId: okpLog.id,
        activityCodeId: codes.minorStoppage.id,
        duration: 10.0,
      },
    });

    // Seed Shopfloor Daily Management System Actions for the mechanical breakdowns
    console.log(`📋 Seeding Shopfloor DMS Actions for ${okpLog.okpNumber}...`);
    await prisma.dmsAction.create({
      data: {
        companyId: company.id,
        okpLogId: okpLog.id,
        downtimeCode: "BR.001",
        actionPlan: "Melakukan penyetelan ulang ketegangan rantai conveyor dan pelumasan bearing outfeed.",
        pic: "Suparno (Mekanik Line A4)",
        targetDate: new Date(okpLog.date.getTime() + 24 * 60 * 60 * 1000), // Target next day
        status: okpLog.okpNumber.includes("0525") ? "OPEN" : "CLOSED", // Today's action is open, past are closed
      },
    });
  }

  console.log("🎉 Database seeded successfully! Happy Coding!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
