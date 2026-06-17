const fs = require("fs");
const path = require("path");

async function importFlow() {
  const filePath = path.join(__dirname, "../oee_node_red_flow.json");
  console.log(`Reading Node-RED flow configuration from: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error("❌ flow config file not found!");
    return;
  }

  const flowData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  console.log(`Successfully parsed flow config with ${flowData.length} nodes.`);

  try {
    console.log("Sending POST request to Node-RED Admin API...");
    const res = await fetch("http://localhost:1880/flows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Node-RED-Deployment-Type": "full"
      },
      body: JSON.stringify(flowData)
    });

    const rawText = await res.text();
    console.log("Response Status:", res.status);
    console.log("Response Raw Body:", rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.log("Response is not JSON.");
    }

    if (res.status === 200 || res.status === 201 || res.status === 204) {
      console.log("\n✅ Success! Node-RED flow configuration imported and deployed successfully.");
    } else {
      console.error("\n❌ Failed to import Node-RED flow config.");
    }
  } catch (err) {
    console.error("❌ Error connecting to Node-RED Admin API:", err.message);
    console.log("Make sure Node-RED is running at http://localhost:1880/");
  }
}

importFlow();
