async function testFinishEndpoint() {
  try {
    const res = await fetch("http://localhost:5001/api/transactions/okp/308/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    console.log("Status:", res.status);
    const body = await res.text();
    console.log("Response:", body);
  } catch (err) {
    console.error("Error:", err);
  }
}
testFinishEndpoint();
