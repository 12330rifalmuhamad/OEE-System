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
    console.log("Fetching /api/analytics/oee (no filters)...");
    const resAll = await getJson("http://localhost:5001/api/analytics/oee");
    console.log("ALL latestOkp:", resAll.latestOkp);

    console.log("\nFetching with OKP filter: okp=OKP-NODERED-M4...");
    const resOkp = await getJson("http://localhost:5001/api/analytics/oee?okp=OKP-NODERED-M4");
    console.log("OKP latestOkp:", resOkp.latestOkp);

    console.log("\nFetching with Date filter: date=2026-06-09...");
    const resDate = await getJson("http://localhost:5001/api/analytics/oee?date=2026-06-09");
    console.log("Date latestOkp:", resDate.latestOkp);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
