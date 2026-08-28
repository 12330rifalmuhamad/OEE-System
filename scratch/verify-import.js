const { db } = require("../lib/db");
const { parseAndImportOkpLogs } = require("../controllers/importController");

async function runTest() {
  console.log("🧪 Running line-based daily OEE import verification test...");

  // Fetch a real company and line process from the DB
  const company = await db.company.findFirst();
  if (!company) {
    console.error("❌ No company found in the database. Please seed first.");
    return;
  }
  console.log(`Found Company: ID=${company.id}, Name=${company.name}`);

  const line = await db.lineProcess.findFirst({
    where: { companyId: company.id }
  });
  if (!line) {
    console.error("❌ No line process found in the database. Please seed first.");
    return;
  }
  console.log(`Found Line: ID=${line.id}, Name=${line.name}`);

  // Mock Request & Response with lineProcessId
  const req = {
    body: {
      lineProcessId: line.id,
      rows: [
        {
          dateStr: "1-Jan-26",
          loadingTimeHrs: 20.42,
          operatingTimeHrs: 17.28,
          netOperatingTimeHrs: 17.85,
          valuedOperatingTimeHrs: 17.77,
          totalDowntimeHrs: 3.13,
          minorStoppageHrs: 0.00,
          qualityLossHrs: 0.08,
          availability: 84.65,
          performance: 103.27,
          quality: 99.56,
          oee: 87.04
        }
      ]
    },
    user: {
      companyId: company.id,
      email: "test-import@kalbe.co.id"
    }
  };

  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log(`Response Code: ${this.statusCode}`);
      console.log("Response Body:", JSON.stringify(data, null, 2));
    }
  };

  try {
    // Invoke the controller directly
    await parseAndImportOkpLogs(req, res);

    // Verify record in database
    console.log("🔍 Checking database record...");
    const record = await db.okpLog.findFirst({
      where: { okpNumber: "DAILY-2026-01-01" },
      include: { machine: { include: { lineProcess: true } } }
    });

    if (record) {
      console.log("✅ Daily OKP Log saved successfully!");
      console.log(`  ID: ${record.id}`);
      console.log(`  OKP Number: ${record.okpNumber}`);
      console.log(`  Resolved Machine Name: ${record.machine.name}`);
      console.log(`  Resolved Line Name: ${record.machine.lineProcess.name}`);
      console.log(`  AR (%): ${record.availability}%`);
      console.log(`  PR (%): ${record.performance}%`);
      console.log(`  QR (%): ${record.quality}%`);
      console.log(`  OEE (%): ${record.oee}%`);

      // Clean up the test record
      console.log("🧹 Cleaning up test record from database...");
      await db.okpLog.delete({ where: { id: record.id } });
      console.log("🗑️ Test record cleaned up.");
    } else {
      console.error("❌ Failed to find the saved record in the database.");
    }
  } catch (err) {
    console.error("❌ Error running test:", err);
  } finally {
    await db.$disconnect();
  }
}

runTest();
