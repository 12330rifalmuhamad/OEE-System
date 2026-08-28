async function testInitiate() {
  console.log("Sending POST request to initiate new OKP on Filling Line A4...");
  const payload = {
    okpNumber: "OKP-SIMULATED-API-A4",
    machineName: "Filling Line A4",
    productCode: "CHIL-KID-800",
    shift: 2,
    groupLeader: "Handoko Wibowo (API)",
    operator: "Sigit Purnomo (API)",
    helper: "Mamat (API)",
    loadingTime: 480.0
  };

  try {
    const res = await fetch("http://localhost:5001/api/transactions/okp/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Response Status:", res.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));

    if (res.status === 201) {
      console.log("\n✅ Success! OKP Line Initiation endpoint works perfectly.");
      console.log("Verify in the dashboard http://localhost:3000 to see 'OKP-SIMULATED-API-A4' active on Filling Line A4.");
    } else {
      console.error("\n❌ Failed to initiate OKP via API.");
    }

  } catch (err) {
    console.error("❌ Network or request error:", err.message);
  }
}

testInitiate();
