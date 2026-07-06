const { adjustActivityLog } = require("../controllers/transactionController");
const { db } = require("../lib/db");

const mockRes = {
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    console.log(`[Response ${this.statusCode}]`, JSON.stringify(data, null, 2));
    return this;
  }
};

async function test() {
  console.log("Testing adjustActivityLog...");
  try {
    // Find a non-productive activity log in the database
    const act = await db.activityLog.findFirst({
      where: {
        activityCode: {
          category: { code: { not: "PR" } }
        }
      }
    });

    if (!act) {
      console.log("No stoppage activity found to classify.");
      return;
    }

    console.log("Found activity to classify with ID:", act.id);

    const mockReq = {
      params: { id: String(act.id) },
      body: {
        activityCodeId: act.activityCodeId,
        brRootCause: "Test Root Cause",
        brMtdtWaiting: 5,
        brMtdtRepair: 10,
        brMtdtStartup: 2
      },
      user: {
        companyId: 1,
        email: "test@kalbe.co.id"
      }
    };

    await adjustActivityLog(mockReq, mockRes);
  } catch (err) {
    console.error("CRITICAL ERROR IN TEST:", err);
  }
}

test().finally(() => db.$disconnect());
