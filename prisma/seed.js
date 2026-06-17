const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { recalculateOkpLogOee } = require("../lib/oeeHelper");

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting realistic database seeding...");

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

  // 4. SEED RICH SPECIFIC ACTIVITY CODES
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

  // 5. SEED PRODUCTION LINES & MACHINES
  console.log("🏭 Seeding Line Processes & Machines...");
  const lineA4 = await prisma.lineProcess.create({
    data: {
      name: "Line A4",
      companyId: company.id,
    },
  });

  const machineData = [
    { name: "Filling Line A4", code: "machine1" },
    { name: "Seaming Line A4", code: "machine2" },
    { name: "Cartooning Line A4", code: "machine3" },
    { name: "Labeling Line A4", code: "machine4" },
  ];

  const machines = [];
  for (const m of machineData) {
    const machine = await prisma.machine.create({
      data: {
        name: m.name,
        companyId: company.id,
        lineProcessId: lineA4.id,
      },
    });
    machines.push(machine);

    // Seed MQTT config for this machine
    await prisma.mqttConfig.create({
      data: {
        companyId: company.id,
        machineId: machine.id,
        brokerUrl: "mqtt://broker.hivemq.com:1883",
        clientId: `kmi_oee_${m.code}_client`,
        counterTopic: `kmi/rifdiansyah_oee/lineA4/${m.code}/counter`,
        statusTopic: `kmi/rifdiansyah_oee/lineA4/${m.code}/status`,
        statusRunValue: "1",
        statusStopValue: "0",
      },
    });
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

  // 8. SEED TRANSACTION DATA
  console.log("📊 Seeding Historical OKP Production Logs & Activity Logs...");
  
  const day1 = new Date(); day1.setDate(day1.getDate() - 2);
  const day2 = new Date(); day2.setDate(day2.getDate() - 1);
  const day3 = new Date(); // Today

  // Machine configurations to vary OEE parameters realistically
  const simulationProfiles = [
    {
      // Machine 1: Filling Line A4 (Bottleneck, has calibration & waiting material)
      name: "Filling Line A4",
      operators: ["Bambang Pamungkas", "Candra Darusman", "Feri Irawan"],
      helpers: ["Doni Setiawan", "Eko Wahyudi", "Guntur Triaji"],
      leaders: ["Agus Prasetyo", "Agus Prasetyo", "Yusuf Habibie"],
      history: [
        {
          output: 48500, rework: 80, reject: 20, loading: 480,
          stoppages: [
            { code: codes.calibration, duration: 15, offsetHours: 1 },
            { code: codes.waitMaterial, duration: 25, offsetHours: 4 },
            { code: codes.minorStoppage, duration: 12, offsetHours: 6 }
          ]
        },
        {
          output: 52100, rework: 110, reject: 30, loading: 480,
          stoppages: [
            { code: codes.calibration, duration: 10, offsetHours: 1 },
            { code: codes.airPressureDrop, duration: 15, offsetHours: 3 },
            { code: codes.minorStoppage, duration: 8, offsetHours: 5 }
          ]
        },
        {
          output: 32000, rework: 50, reject: 10, loading: 480,
          stoppages: [
            { code: codes.calibration, duration: 15, offsetHours: 1 }
          ],
          currentState: "RUNNING" // Live running state today
        }
      ]
    },
    {
      // Machine 2: Seaming Line A4 (Mechanical seamer chuck issues)
      name: "Seaming Line A4",
      operators: ["Suparno", "Triyono", "Suparno"],
      helpers: ["Guntur Triaji", "Doni Setiawan", "Eko Wahyudi"],
      leaders: ["Agus Prasetyo", "Agus Prasetyo", "Yusuf Habibie"],
      history: [
        {
          output: 48450, rework: 70, reject: 15, loading: 480,
          stoppages: [
            { code: codes.toolChange, duration: 20, offsetHours: 2 },
            { code: codes.minorStoppage, duration: 15, offsetHours: 5 }
          ]
        },
        {
          output: 52050, rework: 100, reject: 25, loading: 480,
          stoppages: [
            { code: codes.toolChange, duration: 15, offsetHours: 2 },
            { code: codes.minorStoppage, duration: 10, offsetHours: 5 }
          ]
        },
        {
          output: 31950, rework: 45, reject: 8, loading: 480,
          stoppages: [],
          currentState: "RUNNING" // Live running state today
        }
      ]
    },
    {
      // Machine 3: Cartooning Line A4 (Conveyor jams common)
      name: "Cartooning Line A4",
      operators: ["Eko Wahyudi", "Suparno", "Triyono"],
      helpers: ["Feri Irawan", "Bambang Pamungkas", "Candra Darusman"],
      leaders: ["Agus Prasetyo", "Agus Prasetyo", "Yusuf Habibie"],
      history: [
        {
          output: 48200, rework: 60, reject: 10, loading: 480,
          stoppages: [
            { code: codes.conveyorJam, duration: 35, offsetHours: 3, hasDms: true },
            { code: codes.minorStoppage, duration: 10, offsetHours: 6 }
          ]
        },
        {
          output: 51800, rework: 90, reject: 20, loading: 480,
          stoppages: [
            { code: codes.conveyorJam, duration: 25, offsetHours: 3, hasDms: true },
            { code: codes.minorStoppage, duration: 12, offsetHours: 6 }
          ]
        },
        {
          output: 31500, rework: 40, reject: 5, loading: 480,
          stoppages: [],
          currentState: "STOPPED",
          stopCode: codes.conveyorJam,
          hasDms: true // Currently stopped on Conveyor Jam breakdown
        }
      ]
    },
    {
      // Machine 4: Labeling Line A4 (Label roll jams & sensor misalignments)
      name: "Labeling Line A4",
      operators: ["Candra Darusman", "Feri Irawan", "Bambang Pamungkas"],
      helpers: ["Triyono", "Suparno", "Triyono"],
      leaders: ["Agus Prasetyo", "Agus Prasetyo", "Yusuf Habibie"],
      history: [
        {
          output: 48150, rework: 50, reject: 8, loading: 480,
          stoppages: [
            { code: codes.labelJammed, duration: 30, offsetHours: 2, hasDms: true },
            { code: codes.sensorFault, duration: 10, offsetHours: 5 }
          ]
        },
        {
          output: 51750, rework: 80, reject: 18, loading: 480,
          stoppages: [
            { code: codes.labelJammed, duration: 20, offsetHours: 2, hasDms: true },
            { code: codes.sensorFault, duration: 8, offsetHours: 5 }
          ]
        },
        {
          output: 31600, rework: 35, reject: 4, loading: 480,
          stoppages: [],
          currentState: "RUNNING" // Live running state today
        }
      ]
    }
  ];

  const days = [
    { label: "Day1", date: day1, productIdx: 0, shift: 1 },
    { label: "Day2", date: day2, productIdx: 1, shift: 2 },
    { label: "Day3", date: day3, productIdx: 0, shift: 1 },
  ];

  for (let mIdx = 0; mIdx < machines.length; mIdx++) {
    const machine = machines[mIdx];
    const profile = simulationProfiles.find((p) => p.name === machine.name);
    console.log(`🤖 Seeding Production Simulation OKPs for Machine: ${machine.name}...`);

    for (let dIdx = 0; dIdx < days.length; dIdx++) {
      const dayConfig = days[dIdx];
      const dataProfile = profile.history[dIdx];
      const product = products[dayConfig.productIdx];

      // Create OKP Log
      const okpLog = await prisma.okpLog.create({
        data: {
          companyId: company.id,
          okpNumber: `OKP-${mIdx + 1}-${dayConfig.label}`,
          date: dayConfig.date,
          shift: dayConfig.shift,
          machineId: machine.id,
          productId: product.id,
          groupLeader: profile.leaders[dIdx],
          operator: profile.operators[dIdx],
          helper: profile.helpers[dIdx],
          loadingTime: dataProfile.loading,
          totalOutput: dataProfile.output,
          rework: dataProfile.rework,
          reject: dataProfile.reject,
          sampleQc: dIdx + 4.0,
        },
      });

      // Seeding Stoppages
      let totalDowntimeMinutes = 0;
      for (const stop of dataProfile.stoppages) {
        const startTime = new Date(okpLog.date.getTime() + stop.offsetHours * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + stop.duration * 60 * 1000);
        totalDowntimeMinutes += stop.duration;

        await prisma.activityLog.create({
          data: {
            okpLogId: okpLog.id,
            activityCodeId: stop.code.id,
            duration: stop.duration,
            startTime,
            endTime,
            brRootCause: stop.hasDms ? "Auto-Detected via Telemetry" : null,
          },
        });

        // Seed DMS action plan for major breakdowns
        if (stop.hasDms) {
          await prisma.dmsAction.create({
            data: {
              companyId: company.id,
              okpLogId: okpLog.id,
              downtimeCode: stop.code.code.toUpperCase(),
              actionPlan: `Melakukan pemeriksaan dan perbaikan untuk aktivitas ${stop.code.mainActivity} (${stop.code.subActivity}).`,
              pic: `${profile.operators[dIdx]} & Teknisi`,
              targetDate: new Date(okpLog.date.getTime() + 24 * 60 * 60 * 1000),
              status: dIdx === 2 ? "OPEN" : "CLOSED", // Today's is open, historical are closed
            },
          });
        }
      }

      // Seeding Process Run (PR)
      if (dIdx === 2) {
        // Today (Day 3) - Depends on current state
        if (dataProfile.currentState === "RUNNING") {
          // Live Running: Open Normal Run Log
          await prisma.activityLog.create({
            data: {
              okpLogId: okpLog.id,
              activityCodeId: codes.normalRun.id,
              duration: 0.0,
              startTime: new Date(),
              endTime: null,
            },
          });
        } else {
          // Live Stopped: Open Breakdown Log
          const stopCode = dataProfile.stopCode || codes.conveyorJam;
          const openLog = await prisma.activityLog.create({
            data: {
              okpLogId: okpLog.id,
              activityCodeId: stopCode.id,
              duration: 0.0,
              startTime: new Date(Date.now() - 30 * 60 * 1000), // Stopped 30 mins ago
              endTime: null,
              brRootCause: "Auto-Detected via Telemetry",
            },
          });

          if (dataProfile.hasDms) {
            await prisma.dmsAction.create({
              data: {
                companyId: company.id,
                okpLogId: okpLog.id,
                downtimeCode: stopCode.code.toUpperCase(),
                actionPlan: `Periksa ketegangan atau sensor pada ${machine.name}.`,
                pic: `${profile.operators[dIdx]} (Operator)`,
                targetDate: new Date(),
                status: "OPEN",
              },
            });
          }
        }
      } else {
        // Historical Day 1 & Day 2: Closed Process Run
        const productiveMinutes = dataProfile.loading - totalDowntimeMinutes;
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
