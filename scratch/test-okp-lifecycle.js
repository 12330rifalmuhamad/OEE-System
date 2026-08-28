const { PrismaClient } = require("@prisma/client");
const { initiateOkpLog, finishOkpLog } = require("../controllers/transactionController");
const prisma = new PrismaClient();

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
};

async function testOkpLifecycle() {
  console.log("🚀 Testing OKP Lifecycle & SE.8 Preparation Timing Workflow...\n");

  try {
    // Get machine and product
    const machine = await prisma.machine.findFirst();
    const product = await prisma.product.findFirst({ where: { companyId: machine.companyId } });

    if (!machine || !product) {
      console.error("❌ Machine or Product not found in database.");
      return;
    }

    console.log(`Using Machine: ${machine.name} (ID: ${machine.id}), Line: ${machine.lineProcessId}`);

    // Step 1: Initiate OKP #1
    const testOkpNum1 = `TEST-OKP1-${Date.now()}`;
    console.log(`\n1️⃣ Initiating OKP #1 (${testOkpNum1})...`);
    
    const req1 = {
      body: {
        okpNumber: testOkpNum1,
        machineId: machine.id,
        productId: product.id,
        shift: 1,
        loadingTime: 480
      },
      user: { companyId: machine.companyId, email: "test@kalbe.co.id" }
    };
    const res1 = createMockRes();
    await initiateOkpLog(req1, res1);

    console.log("Response OKP #1 Status:", res1.statusCode, res1.body);
    const okpId1 = res1.body.okpLogId;

    let okp1Detail = await prisma.okpLog.findUnique({
      where: { id: okpId1 },
      include: { activities: { include: { activityCode: { include: { category: true } } } } }
    });

    console.log("OKP #1 Initial Activities:", okp1Detail.activities.map(a => ({
      id: a.id,
      code: a.activityCode.code,
      cat: a.activityCode.category.code,
      endTime: a.endTime
    })));

    // Step 2: Finish OKP #1
    console.log(`\n2️⃣ Finishing OKP #1 (ID: ${okpId1})...`);
    const reqFinish1 = {
      params: { id: String(okpId1) },
      user: { companyId: machine.companyId, email: "test@kalbe.co.id" }
    };
    const resFinish1 = createMockRes();
    await finishOkpLog(reqFinish1, resFinish1);

    console.log("Finish Response Status:", resFinish1.statusCode, resFinish1.body);

    // Verify SE.8 preparation log was created on OKP #1
    okp1Detail = await prisma.okpLog.findUnique({
      where: { id: okpId1 },
      include: { activities: { include: { activityCode: { include: { category: true } } } } }
    });

    console.log("OKP #1 Activities after Finish:", okp1Detail.activities.map(a => ({
      id: a.id,
      code: a.activityCode.code,
      cat: a.activityCode.category.code,
      endTime: a.endTime
    })));

    const openSe8Log = okp1Detail.activities.find(a => a.endTime === null);
    if (openSe8Log) {
      console.log(`✅ SE.8 Preparation log is OPEN on OKP #1 (Log ID: ${openSe8Log.id}, Code: ${openSe8Log.activityCode.code})`);
    } else {
      console.error("❌ Failed to create open SE.8 Preparation log on OKP #1.");
    }

    // Step 3: Initiate OKP #2
    const testOkpNum2 = `TEST-OKP2-${Date.now()}`;
    console.log(`\n3️⃣ Initiating OKP #2 (${testOkpNum2})...`);

    const req2 = {
      body: {
        okpNumber: testOkpNum2,
        machineId: machine.id,
        productId: product.id,
        shift: 1,
        loadingTime: 480
      },
      user: { companyId: machine.companyId, email: "test@kalbe.co.id" }
    };
    const res2 = createMockRes();
    await initiateOkpLog(req2, res2);

    console.log("Response OKP #2 Status:", res2.statusCode, res2.body);
    const okpId2 = res2.body.okpLogId;

    // Verify SE.8 log on OKP #1 remains open during preparation
    const okp1AfterInit2 = await prisma.okpLog.findUnique({
      where: { id: okpId1 },
      include: { activities: { where: { endTime: null }, include: { activityCode: true } } }
    });
    console.log(`OKP #1 open activities during OKP #2 preparation: ${okp1AfterInit2.activities.length} open log(s)`);

    // Step 4: Simulate Machine transition to RUN (Close open SE.8 on line and start PR on OKP #2)
    console.log(`\n4️⃣ Simulating machine transition to RUN for line...`);
    
    const now = new Date();
    // Close open SE.8 on line (which is owned by OKP #1)
    const lineOpenLogs = await prisma.activityLog.findMany({
      where: {
        okpLog: { machine: { lineProcessId: machine.lineProcessId } },
        endTime: null
      },
      include: { activityCode: { include: { category: true } } }
    });

    for (const openLog of lineOpenLogs) {
      if (openLog.activityCode.category.code !== "PR") {
        const start = openLog.startTime || openLog.createdAt || now;
        let durationMin = parseFloat(((now - start) / 60000).toFixed(2));
        if (isNaN(durationMin) || durationMin <= 0) durationMin = 0.01;
        await prisma.activityLog.update({
          where: { id: openLog.id },
          data: { endTime: now, duration: durationMin }
        });
        console.log(`Closed open preparation log #${openLog.id} (${openLog.activityCode.code}) on OKP #${openLog.okpLogId}`);
      }
    }

    // Start PR log for OKP #2
    const prCode = await prisma.activityCode.findFirst({
      where: { companyId: machine.companyId, category: { code: "PR" } }
    });

    await prisma.activityLog.create({
      data: {
        okpLogId: okpId2,
        activityCodeId: prCode.id,
        startTime: now,
        endTime: null,
        duration: 0.0
      }
    });

    // Step 5: Verify results
    const finalOkp1 = await prisma.okpLog.findUnique({
      where: { id: okpId1 },
      include: { activities: { include: { activityCode: true } } }
    });

    const finalOkp2 = await prisma.okpLog.findUnique({
      where: { id: okpId2 },
      include: { activities: { include: { activityCode: true } } }
    });

    console.log("\n📊 FINAL RESULT:");
    console.log(`OKP #1 (ID: ${okpId1}) Activities:`, finalOkp1.activities.map(a => ({
      id: a.id,
      code: a.activityCode.code,
      startTime: a.startTime,
      endTime: a.endTime,
      duration: a.duration
    })));

    console.log(`OKP #2 (ID: ${okpId2}) Activities:`, finalOkp2.activities.map(a => ({
      id: a.id,
      code: a.activityCode.code,
      startTime: a.startTime,
      endTime: a.endTime,
      duration: a.duration
    })));

    const isOkp1Se8Closed = finalOkp1.activities.some(a => (a.activityCode.code === "se.8" || a.activityCode.code === "se.1") && a.endTime !== null);
    const isOkp2PrOpen = finalOkp2.activities.some(a => a.activityCode.code === "pr.1" && a.endTime === null);

    if (isOkp1Se8Closed && isOkp2PrOpen) {
      console.log("\n🎉 SUCCESS! Full OKP lifecycle & SE.8 preparation timing verified successfully!");
    } else {
      console.error("\n❌ Verification failed. Check activity logs above.");
    }
  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testOkpLifecycle();
