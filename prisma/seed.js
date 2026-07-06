const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { recalculateOkpLogOee } = require("../lib/oeeHelper");

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting realistic database seeding for 5 lines...");

  // 0. Reset existing data to prevent unique constraints errors
  console.log("🧹 Cleaning up existing records...");
  await prisma.dmsAction.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.okpLog.deleteMany({});
  await prisma.kpiTarget.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.activityCode.deleteMany({});
  await prisma.mqttConfig.deleteMany({});
  await prisma.machine.deleteMany({});
  await prisma.lineProcess.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.activityCategory.deleteMany({});
  await prisma.company.deleteMany({});

  // 1. SEED COMPANY (Multi-tenant Platform)
  console.log("🏢 Seeding Company...");
  const company = await prisma.company.create({
    data: {
      id: 1,
      name: "PT Kalbe Morinaga Indonesia",
      subscription: "ENTERPRISE",
    },
  });

  // 2. SEED USERS
  console.log("👤 Seeding Users...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  await prisma.user.createMany({
    data: [
      {
        email: "supervisor@kalbe.co.id",
        password: hashedPassword,
        role: "SUPERVISOR",
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

  // 3. SEED GLOBAL ACTIVITY CATEGORIES
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

  // 4. SEED SPECIFIC ACTIVITY CODES
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
    unknownStoppage: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.BR.id,
        code: "unknown",
        mainActivity: "Unknown Stoppage",
        subActivity: "Belum Diklasifikasikan",
        fullDescription: "Penyebab tidak diketahui secara otomatis oleh sistem, silakan pilih penyebab yang benar.",
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
    airPressureDrop: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.BR.id,
        code: "br.3",
        mainActivity: "Breakdown Pneumatic",
        subActivity: "Air Pressure Drop",
        fullDescription: "System pneumatic pressure fell below 5.5 bar threshold",
      },
    }),
    labelJammed: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.BR.id,
        code: "br.4",
        mainActivity: "Breakdown Material",
        subActivity: "Label Jammed",
        fullDescription: "Label roll feeding mechanism jammed or torn paper",
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
    toolChange: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.SE.id,
        code: "se.2",
        mainActivity: "Setup & Adjustments",
        subActivity: "Seaming Chuck Replacement",
        fullDescription: "Replacing worn seamer chuck and setting height parameters",
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
    sizeChangeover: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.CT.id,
        code: "ct.1",
        mainActivity: "Changeover",
        subActivity: "Format Change 400g to 800g",
        fullDescription: "Replacing guide rails and guides for larger tin format",
      },
    }),
    warmUpTrial: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.ST.id,
        code: "st.1",
        mainActivity: "Startup Losses",
        subActivity: "Line Warm-up & Test run",
        fullDescription: "Heating seamer tooling and performing blank run trials",
      },
    }),
    waitMaterial: await prisma.activityCode.create({
      data: {
        companyId: company.id,
        categoryId: categories.OT.id,
        code: "ot.1",
        mainActivity: "Other Downtime",
        subActivity: "Waiting for Bulk Powder",
        fullDescription: "Drying tower batch transfer delay from raw material warehouse",
      },
    }),
  };

  // 5. SEED 5 PRODUCTION LINES & 3 MACHINES EACH
  console.log("🏭 Seeding Line Processes & Machines...");
  
  const linesData = [
    { name: "Line A", slug: "line_a" },
    { name: "Line D", slug: "line_d" },
    { name: "Line E", slug: "line_e" },
    { name: "Line F", slug: "line_f" },
    { name: "Canning", slug: "canning" },
  ];

  const machineTypes = [
    { name: "Filling", slug: "machine1" },
    { name: "Cartoning", slug: "machine2" },
    { name: "Casepacker", slug: "machine3" },
  ];

  const machines = [];

  for (const l of linesData) {
    const lineProcess = await prisma.lineProcess.create({
      data: {
        name: l.name,
        companyId: company.id,
      },
    });

    for (const mType of machineTypes) {
      const machineName = `${mType.name} ${l.name}`;
      
      const machine = await prisma.machine.create({
        data: {
          name: machineName,
          companyId: company.id,
          lineProcessId: lineProcess.id,
        },
      });
      machines.push(machine);

      // Seed MQTT config for this machine
      await prisma.mqttConfig.create({
        data: {
          companyId: company.id,
          machineId: machine.id,
          brokerUrl: "mqtt://broker.hivemq.com:1883",
          clientId: `kmi_oee_${l.slug}_${mType.slug}_client`,
          counterTopic: `kmi/rifdiansyah_oee/${l.slug}/${mType.slug}/counter`,
          statusTopic: `kmi/rifdiansyah_oee/${l.slug}/${mType.slug}/status`,
          statusRunValue: "1",
          statusStopValue: "0",
        },
      });
    }
  }

  // 6. SEED PRODUCTS
  console.log("📦 Seeding Products...");
  const products = [
    await prisma.product.create({
      data: {
        companyId: company.id,
        productCode: "CHIL-KID-800",
        name: "Chil Kid Platinum Vanilla",
        size: "800g",
        standarSpeed: 120.0, // 120 pcs/menit
      },
    }),
    await prisma.product.create({
      data: {
        companyId: company.id,
        productCode: "BMT-GOLD-400",
        name: "Morinaga BMT Gold Regular",
        size: "400g",
        standarSpeed: 140.0, // 140 pcs/menit
      },
    }),
    await prisma.product.create({
      data: {
        companyId: company.id,
        productCode: "CHIL-MIL-800",
        name: "Chil Mil Regular Honey",
        size: "800g",
        standarSpeed: 110.0, // 110 pcs/menit
      },
    }),
  ];

  // 7. SEED KPI TARGETS
  console.log("🎯 Seeding KPI Target...");
  await prisma.kpiTarget.create({
    data: {
      companyId: company.id,
      oeeTarget: 85.0,
      availTarget: 90.0,
      perfTarget: 95.0,
      qualTarget: 99.0,
    },
  });

  // 8. SEED REALISTIC TRANSACTION DATA
  console.log("📊 Seeding Historical OKP Production Logs & Activity Logs...");
  
  const day1 = new Date(); day1.setDate(day1.getDate() - 2);
  const day2 = new Date(); day2.setDate(day2.getDate() - 1);
  const day3 = new Date(); // Today

  const days = [
    { label: "Day1", date: day1, productIdx: 0, shift: 1 },
    { label: "Day2", date: day2, productIdx: 1, shift: 2 },
    { label: "Day3", date: day3, productIdx: 0, shift: 1 },
  ];

  const operators = ["Andi Wijaya", "Budi Santoso", "Siti Rahma", "Ahmad Fauzi", "Dewi Lestari"];
  const helpers = ["Rian Hidayat", "Eka Saputra", "Mega Utami", "Hadi Wibowo", "Indah Permata"];
  const leaders = ["Agus Prasetyo", "Yusuf Habibie", "Hendra Wijaya"];

  for (let mIdx = 0; mIdx < machines.length; mIdx++) {
    const machine = machines[mIdx];
    const lineNameClean = machine.name.replace(/\s+/g, "-");

    for (let dIdx = 0; dIdx < days.length; dIdx++) {
      const dayConfig = days[dIdx];
      const product = products[dayConfig.productIdx];
      
      // Randomize output parameters for realism
      const baseOutput = dIdx === 0 ? 45000 : dIdx === 1 ? 52000 : 25000;
      const totalOutput = baseOutput + Math.floor(Math.random() * 3000);
      const rework = Math.floor(Math.random() * 80);
      const reject = Math.floor(Math.random() * 20);

      // Create OKP Log
      const okpLog = await prisma.okpLog.create({
        data: {
          companyId: company.id,
          okpNumber: `OKP-${lineNameClean}-${dayConfig.label}`,
          date: dayConfig.date,
          shift: dayConfig.shift,
          machineId: machine.id,
          productId: product.id,
          groupLeader: leaders[mIdx % leaders.length],
          operator: operators[mIdx % operators.length],
          helper: helpers[mIdx % helpers.length],
          loadingTime: 480.0,
          totalOutput: totalOutput,
          rework: rework,
          reject: reject,
          sampleQc: 5.0,
        },
      });

      // Seeding Stoppages
      let totalDowntimeMinutes = 0;
      
      // Add a couple of random stoppages
      const stoppageCount = dIdx === 2 ? 1 : 2;
      for (let s = 0; s < stoppageCount; s++) {
        const stopDuration = 10 + Math.floor(Math.random() * 15); // 10-25 mins
        totalDowntimeMinutes += stopDuration;
        
        const startTime = new Date(okpLog.date.getTime() + (s + 1) * 2 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + stopDuration * 60 * 1000);

        // Pick a random stoppage code
        const stopCodes = [codes.weeklyCleaning, codes.conveyorJam, codes.sensorFault, codes.airPressureDrop, codes.waitMaterial];
        const selectedCode = stopCodes[Math.floor(Math.random() * stopCodes.length)];

        await prisma.activityLog.create({
          data: {
            okpLogId: okpLog.id,
            activityCodeId: selectedCode.id,
            duration: stopDuration,
            startTime,
            endTime: dIdx === 2 && s === stoppageCount - 1 ? null : endTime, // Leave the last stoppage of today open
            brRootCause: selectedCode.categoryId === categories.BR.id ? "Auto-Detected via Telemetry" : null,
          },
        });

        // Add DMS action for breakdowns
        if (selectedCode.categoryId === categories.BR.id) {
          await prisma.dmsAction.create({
            data: {
              companyId: company.id,
              okpLogId: okpLog.id,
              downtimeCode: selectedCode.code.toUpperCase(),
              actionPlan: `Periksa dan perbaiki masalah pada ${machine.name}.`,
              pic: okpLog.operator,
              targetDate: new Date(okpLog.date.getTime() + 24 * 60 * 60 * 1000),
              status: dIdx === 2 ? "OPEN" : "CLOSED",
            },
          });
        }
      }

      // Seeding Process Run (PR)
      if (dIdx === 2) {
        // Today: if the last activity is not open, open a normal run log
        const openActivity = await prisma.activityLog.findFirst({
          where: { okpLogId: okpLog.id, endTime: null }
        });
        
        if (!openActivity) {
          await prisma.activityLog.create({
            data: {
              okpLogId: okpLog.id,
              activityCodeId: codes.normalRun.id,
              duration: 0.0,
              startTime: new Date(),
              endTime: null,
            },
          });
        }
      } else {
        // Historical: Closed Process Run for the remaining time
        const productiveMinutes = 480.0 - totalDowntimeMinutes;
        await prisma.activityLog.create({
          data: {
            okpLogId: okpLog.id,
            activityCodeId: codes.normalRun.id,
            duration: productiveMinutes,
            startTime: okpLog.date,
            endTime: new Date(okpLog.date.getTime() + productiveMinutes * 60 * 1000),
          },
        });
      }

      // Recalculate OEE
      await recalculateOkpLogOee(okpLog.id, prisma);
    }
  }

  console.log("🎉 Real-world simulation database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
