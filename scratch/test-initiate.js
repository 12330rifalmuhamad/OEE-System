const { initiateOkpLog } = require("../controllers/transactionController");

// Mock Express Response object
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

// Mock Express Request object
const mockReq = {
  body: {
    okpNumber: "OKP-TEST-999",
    machineId: 73, // Filling Line A
    shift: 1,
    loadingTime: 480,
    productId: 1 // We have products in the DB, 1 will fall back if not found
  },
  user: {
    companyId: 1,
    email: "test@kalbe.co.id"
  }
};

async function test() {
  console.log("Testing initiateOkpLog...");
  try {
    await initiateOkpLog(mockReq, mockRes);
  } catch (err) {
    console.error("CRITICAL ERROR IN TEST:", err);
  }
}

test();
