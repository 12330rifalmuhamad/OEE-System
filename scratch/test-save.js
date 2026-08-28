const { adjustActivityLog } = require("../controllers/transactionController");

async function run() {
  const req = {
    params: { id: "888" },
    body: {
      activityCodeId: 127
    },
    user: {
      id: 35,
      email: "supervisor@kalbe.co.id",
      role: "SUPERVISOR",
      companyId: 1
    }
  };
  
  const res = {
    status: function(code) {
      console.log("STATUS CODE:", code);
      return this;
    },
    json: function(data) {
      console.log("RESPONSE DATA:", JSON.stringify(data, null, 2));
      return this;
    }
  };
  
  console.log("Testing adjustActivityLog directly...");
  await adjustActivityLog(req, res);
}

run();
