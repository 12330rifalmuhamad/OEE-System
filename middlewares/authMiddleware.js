const jwt = require("jsonwebtoken");
const { db } = require("../lib/db");
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

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true },
    });

    if (!user) {
      return res.status(401).json({ error: "User tidak ditemukan." });
    }

    req.user = user;
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

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true },
    });

    req.user = user || null;
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
