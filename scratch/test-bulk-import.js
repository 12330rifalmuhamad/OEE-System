const http = require('http');

async function testBulkImport() {
  const loginData = JSON.stringify({
    email: 'supervisor@kalbe.co.id',
    password: 'admin123'
  });

  const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  }, (res) => {
    let cookie = res.headers['set-cookie'];
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      let token = null;
      try { token = JSON.parse(data).token; } catch(e) {}
      if (!token && cookie && cookie.length > 0) {
        const match = cookie[0].match(/auth_token=([^;]+)/);
        if (match) token = match[1];
      }

      // Generate 160 products
      const testProducts = [];
      for (let i = 1; i <= 160; i++) {
        testProducts.push({
          txtArtCode: i % 3 === 0 ? "-" : `ART-${1000 + i}`,
          txtProductName: `Produk Simulasi Bulk ${i}`,
          txtProductCode: i % 2 === 0 ? `PRD-CODE-${i}` : "",
          floatBatchSizeBin: `${1000 + (i * 5)} kg`,
          intQtyPcsCarton: `${12 + (i % 12)}`,
          intNetFill: `${200 + (i * 10)}g`,
          floatStdSpeedFilling: `${100 + (i % 50)}`
        });
      }

      const bulkPayload = JSON.stringify({ products: testProducts });

      const bulkReq = http.request({
        hostname: 'localhost',
        port: 5001,
        path: '/api/master/products/bulk',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bulkPayload),
          'Authorization': `Bearer ${token}`,
          'Cookie': `auth_token=${token}`
        }
      }, (bulkRes) => {
        let bulkResultData = '';
        bulkRes.on('data', chunk => bulkResultData += chunk);
        bulkRes.on('end', () => {
          console.log('Bulk Response Status:', bulkRes.statusCode);
          console.log('Bulk Response Body:', bulkResultData);
        });
      });

      bulkReq.write(bulkPayload);
      bulkReq.end();
    });
  });

  req.write(loginData);
  req.end();
}

testBulkImport();
