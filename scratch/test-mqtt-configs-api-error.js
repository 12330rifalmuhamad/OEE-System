const { getMqttConfigs } = require("../controllers/masterController");

const mockReq = {
  user: {
    companyId: 10
  }
};

const mockRes = {
  status(code) {
    console.log(`status code: ${code}`);
    return this;
  },
  json(data) {
    console.log("JSON response:", JSON.stringify(data, null, 2));
    return this;
  }
};

async function run() {
  console.log("Executing getMqttConfigs...");
  try {
    await getMqttConfigs(mockReq, mockRes);
  } catch (err) {
    console.error("Caught error during execution:", err);
  }
  process.exit(0);
}

run();
