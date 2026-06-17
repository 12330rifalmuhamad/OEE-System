const fs = require("fs");
const path = require("path");

function generateFlow() {
  const flow = [];

  // 1. Add workspace tab
  flow.push({
    id: "oee_sim_tab",
    type: "tab",
    label: "OEE 5-Machine Line Simulation",
    disabled: false,
    info: "Simulasi 5 Mesin pada Lini Produksi A4 dengan keluaran Status (1/0) dan Counter (1)."
  });

  // 2. Add broker configuration node
  flow.push({
    id: "mqtt_local_broker",
    type: "mqtt-broker",
    name: "HiveMQ Public Broker",
    broker: "broker.hivemq.com",
    port: "1883",
    clientid: "",
    autoConnect: true,
    usetls: false,
    protocolVersion: "4",
    keepalive: "60",
    cleansession: true,
    birthTopic: "",
    birthQos: "0",
    birthPayload: "",
    closeTopic: "",
    closeQos: "0",
    closePayload: "",
    willTopic: "",
    willQos: "0",
    willPayload: ""
  });

  // 3. Generate nodes for 5 machines
  const machines = [
    { num: 1, name: "Filling Machine (M1)", code: "machine1" },
    { num: 2, name: "Seaming Machine (M2)", code: "machine2" },
    { num: 3, name: "Cartooning Machine (M3)", code: "machine3" },
    { num: 4, name: "Labeling Machine (M4)", code: "machine4" },
    { num: 5, name: "Packing Machine (M5)", code: "machine5" }
  ];

  machines.forEach((m, index) => {
    const yBase = 100 + index * 300;

    // Auto status generator (ticks every 30s + random delay)
    flow.push({
      id: `m${m.num}_auto_status`,
      type: "inject",
      z: "oee_sim_tab",
      name: `${m.name} Auto Status`,
      props: [{ p: "payload" }],
      repeat: "30",
      crontab: "",
      once: true,
      onceDelay: `${1 + index * 2}`,
      topic: "",
      payloadType: "date",
      x: 160,
      y: yBase,
      wires: [[`m${m.num}_status_func`]]
    });

    // Random status decider function
    flow.push({
      id: `m${m.num}_status_func`,
      type: "function",
      z: "oee_sim_tab",
      name: `Status Decider`,
      func: `let currentStatus = flow.get('m${m.num}_status') !== undefined ? flow.get('m${m.num}_status') : 1;\n// 10% chance to toggle state\nif (Math.random() < 0.10) {\n    currentStatus = currentStatus === 1 ? 0 : 1;\n}\nflow.set('m${m.num}_status', currentStatus);\nmsg.payload = currentStatus;\nreturn msg;`,
      outputs: 1,
      noerr: 0,
      initialize: "",
      finalize: "",
      libs: [],
      x: 410,
      y: yBase,
      wires: [[`m${m.num}_mqtt_status`, `m${m.num}_debug`]]
    });

    // Manual RUN injector
    flow.push({
      id: `m${m.num}_inject_run`,
      type: "inject",
      z: "oee_sim_tab",
      name: `RUN (1)`,
      props: [{ p: "payload" }],
      repeat: "",
      crontab: "",
      once: false,
      onceDelay: 0.1,
      topic: "",
      payload: "1",
      payloadType: "num",
      x: 160,
      y: yBase + 60,
      wires: [[`m${m.num}_set_run`]]
    });

    // Set RUN value
    flow.push({
      id: `m${m.num}_set_run`,
      type: "change",
      z: "oee_sim_tab",
      name: `Set Status = 1`,
      rules: [
        { t: "set", p: `m${m.num}_status`, pt: "flow", to: "1", tot: "num" },
        { t: "set", p: "payload", pt: "msg", to: "1", tot: "num" }
      ],
      action: "",
      property: "",
      from: "",
      to: "",
      reg: false,
      x: 410,
      y: yBase + 60,
      wires: [[`m${m.num}_mqtt_status`, `m${m.num}_debug`]]
    });

    // Manual STOP injector
    flow.push({
      id: `m${m.num}_inject_stop`,
      type: "inject",
      z: "oee_sim_tab",
      name: `STOP (0)`,
      props: [{ p: "payload" }],
      repeat: "",
      crontab: "",
      once: false,
      onceDelay: 0.1,
      topic: "",
      payload: "0",
      payloadType: "num",
      x: 160,
      y: yBase + 120,
      wires: [[`m${m.num}_set_stop`]]
    });

    // Set STOP value
    flow.push({
      id: `m${m.num}_set_stop`,
      type: "change",
      z: "oee_sim_tab",
      name: `Set Status = 0`,
      rules: [
        { t: "set", p: `m${m.num}_status`, pt: "flow", to: "0", tot: "num" },
        { t: "set", p: "payload", pt: "msg", to: "0", tot: "num" }
      ],
      action: "",
      property: "",
      from: "",
      to: "",
      reg: false,
      x: 410,
      y: yBase + 120,
      wires: [[`m${m.num}_mqtt_status`, `m${m.num}_debug`]]
    });

    // MQTT Status Output
    flow.push({
      id: `m${m.num}_mqtt_status`,
      type: "mqtt out",
      z: "oee_sim_tab",
      name: `MQTT Status`,
      topic: `kmi/rifdiansyah_oee/lineA4/${m.code}/status`,
      qos: "0",
      retain: "false",
      respTopic: "",
      contentType: "",
      userProps: "",
      correl: "",
      expiry: "",
      broker: "mqtt_local_broker",
      x: 690,
      y: yBase + 60,
      wires: []
    });

    // Production counter trigger (inject pulse every 2.5s)
    flow.push({
      id: `m${m.num}_counter_trigger`,
      type: "inject",
      z: "oee_sim_tab",
      name: `Auto Production Pulse`,
      props: [{ p: "payload" }],
      repeat: "2.5",
      crontab: "",
      once: false,
      onceDelay: 0.1,
      topic: "",
      payloadType: "date",
      x: 170,
      y: yBase + 180,
      wires: [[`m${m.num}_counter_gate`]]
    });

    // Allow counter increment if status is RUN (1)
    flow.push({
      id: `m${m.num}_counter_gate`,
      type: "function",
      z: "oee_sim_tab",
      name: `Allow if RUN`,
      func: `const status = flow.get('m${m.num}_status') !== undefined ? flow.get('m${m.num}_status') : 1;\nif (status === 1) {\n    msg.payload = 1; // Counter increment by 1\n    return msg;\n}\nreturn null; // Block if STOP (0)`,
      outputs: 1,
      noerr: 0,
      initialize: "",
      finalize: "",
      libs: [],
      x: 410,
      y: yBase + 180,
      wires: [[`m${m.num}_mqtt_counter`, `m${m.num}_debug`]]
    });

    // MQTT Counter Output
    flow.push({
      id: `m${m.num}_mqtt_counter`,
      type: "mqtt out",
      z: "oee_sim_tab",
      name: `MQTT Counter`,
      topic: `kmi/rifdiansyah_oee/lineA4/${m.code}/counter`,
      qos: "0",
      retain: "false",
      respTopic: "",
      contentType: "",
      userProps: "",
      correl: "",
      expiry: "",
      broker: "mqtt_local_broker",
      x: 690,
      y: yBase + 180,
      wires: []
    });

    // Debug node
    flow.push({
      id: `m${m.num}_debug`,
      type: "debug",
      z: "oee_sim_tab",
      name: `Debug`,
      active: false,
      tosidebar: true,
      console: false,
      tostatus: false,
      complete: "payload",
      targetType: "msg",
      statusVal: "",
      statusType: "auto",
      x: 680,
      y: yBase,
      wires: []
    });
  });

  // 4. Add OKP Line Initiation API trigger flow at the bottom (yBase = 1600)
  const yApi = 1650;
  
  // Common HTTP Request node
  flow.push({
    id: "okp_initiate_http_request",
    type: "http request",
    z: "oee_sim_tab",
    name: "Call Initiate API",
    method: "POST",
    ret: "obj",
    url: "http://localhost:5001/api/transactions/okp/initiate",
    tls: "",
    persist: false,
    proxy: "",
    insecureHTTPParser: false,
    authType: "",
    x: 410,
    y: yApi,
    wires: [["okp_initiate_debug"]]
  });

  // Common Debug node
  flow.push({
    id: "okp_initiate_debug",
    type: "debug",
    z: "oee_sim_tab",
    name: "API Response",
    active: true,
    tosidebar: true,
    console: false,
    tostatus: false,
    complete: "payload",
    targetType: "msg",
    statusVal: "",
    statusType: "auto",
    x: 690,
    y: yApi,
    wires: []
  });

  // 5 Inject Nodes for each machine
  const machineFullNames = [
    "Filling Line A4",
    "Seaming Line A4",
    "Cartooning Line A4",
    "Labeling Line A4",
    "Packing Line A4"
  ];

  machines.forEach((m, index) => {
    const payloadObj = {
      okpNumber: `OKP-NODERED-M${m.num}`,
      machineName: machineFullNames[index],
      productCode: "CHIL-KID-800",
      shift: 1,
      groupLeader: "Yusuf NR",
      operator: "Suparno NR",
      helper: "Eko NR",
      loadingTime: 480.0
    };

    flow.push({
      id: `m${m.num}_initiate_inject`,
      type: "inject",
      z: "oee_sim_tab",
      name: `Initiate ${m.name} OKP`,
      props: [{ p: "payload", v: JSON.stringify(payloadObj), vt: "json" }],
      repeat: "",
      crontab: "",
      once: false,
      onceDelay: 0.1,
      topic: "",
      x: 160,
      y: yApi - 120 + index * 60,
      wires: [["okp_initiate_http_request"]]
    });
  });

  const outputPath = path.join(__dirname, "..", "oee_node_red_flow.json");
  fs.writeFileSync(outputPath, JSON.stringify(flow, null, 2), "utf8");
  console.log(`✅ Flow JSON successfully written to: ${outputPath}`);
}

generateFlow();
