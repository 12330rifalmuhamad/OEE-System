const http = require("http");

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on("error", reject);
  });
}

async function test() {
  console.log("Testing HTTP connection to running backend...");
  try {
    // 1. Health check
    const health = await get("http://localhost:5001/");
    console.log("Health Check:", health.status, health.body);

    // 2. Analytics OEE query
    const analytics = await get("http://localhost:5001/api/analytics/oee?startDate=2026-06-30&endDate=2026-06-30&lineId=25");
    console.log("Analytics Status:", analytics.status);
    if (analytics.status !== 200) {
      console.log("Analytics Error Body:", analytics.body);
    } else {
      const json = JSON.parse(analytics.body);
      console.log("Analytics Summary:", JSON.stringify(json.summary, null, 2));
    }
  } catch (err) {
    console.error("HTTP Request Failed:", err.message);
  }
}

test();
