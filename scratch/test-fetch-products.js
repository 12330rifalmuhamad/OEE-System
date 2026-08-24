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
      console.log("Login Response Status:", res.statusCode);
      let token = null;
      if (setCookieHeader && setCookieHeader.length > 0) {
        const match = setCookieHeader[0].match(/auth_token=([^;]+)/);
        if (match) token = match[1];
      }
      if (token) {
        console.log("Got Token from Cookie! Fetching Products...");
        getProducts(token);
      } else {
        console.log("No token in cookie. Set-Cookie:", setCookieHeader);
      }
    });
  });

  req.write(data);
  req.end();
}

function getProducts(token) {
  const options = {
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/master/products',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/json'
    }
  };

  const req = http.request(options, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      console.log("Get Products Status:", res.statusCode);
      try {
        const json = JSON.parse(body);
        console.log("Products Count:", json.products ? json.products.length : 0);
        if (json.products && json.products.length > 0) {
          console.log("Sample First Product:", JSON.stringify(json.products[0], null, 2));
        }
      } catch (e) {
        console.error(e, body);
      }
    });
  });

  req.end();
}

postLogin();
