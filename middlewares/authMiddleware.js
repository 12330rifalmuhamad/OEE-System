const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../lib/auth");

async function authMiddleware(req, res, next) {
  try {
    let token = req.cookies.auth_token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Tidak terautentikasi." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ error: "Token tidak valid." });
    }

    // Set data user secara stateless dari payload token JWT
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId,
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ error: "Tidak terautentikasi." });
  }
}

async function optionalAuth(req, res, next) {
  try {
    let token = req.cookies.auth_token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      req.user = null;
      return next();
    }

    // Set data user secara stateless dari payload token JWT
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId,
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

module.exports = {
  authMiddleware,
  optionalAuth,
};
