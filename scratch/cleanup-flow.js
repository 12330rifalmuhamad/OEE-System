const fs = require("fs");
const path = require("path");

const flowPath = path.join(__dirname, "../oee_node_red_flow.json");
console.log(`Reading Node-RED flow from: ${flowPath}`);

try {
  const rawData = fs.readFileSync(flowPath, "utf8");
  const flow = JSON.parse(rawData);
  console.log(`Original flow count: ${flow.length} nodes`);

  // Filter out any nodes related to Machine 5 (m5)
  const filteredFlow = flow.filter((node) => {
    // Exclude by node ID
    if (node.id && (node.id.startsWith("m5_") || node.id === "m5_debug" || node.id === "m5_initiate_inject")) {
      return false;
    }
    // Exclude by name
    if (node.name && (node.name.includes("(M5)") || node.name.includes("Machine (M5)"))) {
      return false;
    }
    // Exclude by topics
    if (node.topic && node.topic.includes("machine5")) {
      return false;
    }
    return true;
  });

  console.log(`Filtered flow count: ${filteredFlow.length} nodes`);
  
  // Write the filtered JSON back to the file
  fs.writeFileSync(flowPath, JSON.stringify(filteredFlow, null, 2), "utf8");
  console.log("Successfully wrote updated flow with exactly 4 machines!");

} catch (err) {
  console.error("Failed to filter flow:", err);
}
