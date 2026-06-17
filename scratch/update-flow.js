const fs = require("fs");
const path = require("path");

const flowPath = path.join(__dirname, "../oee_node_red_flow.json");
const rawFlow = fs.readFileSync(flowPath, "utf-8");
const flow = JSON.parse(rawFlow);

// 1. Modify mX_set_stop nodes to allow payload to pass through
for (const node of flow) {
  if (node.type === "change" && /^m\d_set_stop$/.test(node.id)) {
    // Keep only the first rule (which sets flow status to 0)
    // Remove the second rule (which sets msg.payload to "0")
    if (node.rules && node.rules.length > 1) {
      console.log(`Modifying node rules for: ${node.id}`);
      node.rules = [node.rules[0]];
    }
  }
}

// Helper to generate a new unique inject node for specific activity codes
function createInjectNode(machineNum, code, name, y, zTab = "oee_sim_tab") {
  const mId = `m${machineNum}`;
  return {
    id: `${mId}_inject_${code.replace(".", "_")}`,
    type: "inject",
    z: zTab,
    name: `STOP: ${name} (${code})`,
    props: [
      {
        p: "payload"
      }
    ],
    repeat: "",
    crontab: "",
    once: false,
    onceDelay: 0.1,
    topic: "",
    payload: code,
    payloadType: "str",
    x: 160,
    y: y,
    wires: [
      [
        `${mId}_set_stop`
      ]
    ]
  };
}

// 2. Define specific downtime inject nodes for each machine
const m1Downtimes = [
  { code: "br.1", name: "Conveyor Jam" },
  { code: "br.3", name: "Air Pressure Drop" },
  { code: "ot.1", name: "Wait Material" }
];

const m2Downtimes = [
  { code: "se.2", name: "Tool Chuck Change" },
  { code: "br.3", name: "Air Pressure Drop" },
  { code: "br.1", name: "Conveyor Jam" }
];

const m3Downtimes = [
  { code: "br.1", name: "Conveyor Jam" },
  { code: "br.2", name: "Sensor Fault" }
];

const m4Downtimes = [
  { code: "br.4", name: "Label Jammed" },
  { code: "br.2", name: "Sensor Fault" }
];

const machineDowntimes = [
  { num: 1, list: m1Downtimes, yBase: 100 },
  { num: 2, list: m2Downtimes, yBase: 400 },
  { num: 3, list: m3Downtimes, yBase: 700 },
  { num: 4, list: m4Downtimes, yBase: 1000 }
];

// 3. Add the inject nodes to the flow
for (const md of machineDowntimes) {
  md.list.forEach((dt, idx) => {
    const yPos = md.yBase + 220 + (idx * 30);
    const node = createInjectNode(md.num, dt.code, dt.name, yPos);
    console.log(`Adding inject node for M${md.num}: ${dt.name} (${dt.code}) at y: ${yPos}`);
    flow.push(node);
  });
}

// 4. Save the modified flow back to disk
fs.writeFileSync(flowPath, JSON.stringify(flow, null, 2), "utf-8");
console.log("Successfully updated Node-RED flow configuration file!");
