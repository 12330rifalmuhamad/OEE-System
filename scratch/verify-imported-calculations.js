const http = require("http");

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e + " : " + data);
        }
      });
    }).on("error", reject);
  });
}

async function run() {
  try {
    console.log("Fetching OEE analytics for OKP DAILY-2026-01-01...");
    const url = "http://localhost:5001/api/analytics/oee?okp=DAILY-2026-01-01";
    const data = await getJson(url);

    console.log("\n=== API Response Summary ===");
    console.log(JSON.stringify(data.summary, null, 2));

    const expected = {
      oee: 87.0,
      availability: 84.6,
      performance: 103.3,
      quality: 99.6
    };

    console.log("\n=== Validation ===");
    let passed = true;
    for (const key of Object.keys(expected)) {
      const actual = data.summary[key];
      // Allow minor floating point difference since database has 2 decimals but summary rounds to 1 decimal
      const diff = Math.abs(actual - expected[key]);
      if (diff > 0.1) {
        console.error(`❌ Mismatch for ${key}: Expected ~${expected[key]}, got ${actual}`);
        passed = false;
      } else {
        console.log(`✅ ${key}: ${actual}% (Expected ~${expected[key]}%)`);
      }
    }

    if (passed) {
      console.log("\n🎉 Verification SUCCESSFUL! The backend calculation matches the stored database columns.");
    } else {
      console.log("\n❌ Verification FAILED!");
      process.exit(1);
    }
  } catch (err) {
    console.error("Error running validation:", err);
    process.exit(1);
  }
}

run();
