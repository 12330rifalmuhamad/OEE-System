const http = require('http');

function postLogin() {
  const data = JSON.stringify({
    email: "supervisor@kalbe.co.id",
    password: "admin123"
  });

  const options = {
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, res => {
    let body = '';
    const setCookieHeader = res.headers['set-cookie'];
    res.on('data', d => body += d);
    res.on('end', () => {
      let token = null;
      if (setCookieHeader && setCookieHeader.length > 0) {
        const match = setCookieHeader[0].match(/auth_token=([^;]+)/);
        if (match) token = match[1];
      }
      if (token) {
        testBulkImport(token);
      }
    });
  });

  req.write(data);
  req.end();
}

function testBulkImport(token) {
  const payload = JSON.stringify({
    products: [
      {
        lineProcessName: "Line A",
        articleCode: "ART-BULK-01",
        name: "Test Bulk Product 1",
        productCode: "PRD-BULK-01",
        lineCode: "LINE-A1",
        batchSizeKg: "1000",
        pcsPerCarton: "24",
        netFill: "800",
        stdSpeedFilling: "130"
      },
      {
        lineProcessName: "Line D",
        articleCode: "ART-BULK-02",
        name: "Test Bulk Product 2",
        productCode: "PRD-BULK-02",
        lineCode: "LINE-D1",
        batchSizeKg: "800",
        pcsPerCarton: "12",
        netFill: "400",
        stdSpeedFilling: "145"
      }
    ]
  });

  const options = {
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/master/products/bulk',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = http.request(options, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      console.log("Bulk Import Status:", res.statusCode);
      console.log("Bulk Import Result:", body);
    });
  });

  req.write(payload);
  req.end();
}

postLogin();
