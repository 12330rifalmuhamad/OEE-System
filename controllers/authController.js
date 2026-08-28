const { db } = require("../lib/db");
const { hashPassword, comparePassword, signToken } = require("../lib/auth");

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    // Find User
    const user = await db.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      return res.status(400).json({ error: "Email atau password salah." });
    }

    // Verify Password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Email atau password salah." });
    }

    // Sign JWT Token
    const token = signToken({
      userId: user.id,
      role: user.role,
      companyId: user.companyId,
    });

    // Set cookie (Express maxAge is in milliseconds)
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: "Login berhasil.",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan internal server." });
  }
}

async function register(req, res) {
  try {
    const { email, password, role, companyName, subscription } = req.body;

    if (!email || !password || !role || !companyName) {
      return res.status(400).json({ error: "Semua field (email, password, role, companyName) wajib diisi." });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email sudah terdaftar." });
    }

    // Create Company and User in a transaction
    const hashedPassword = await hashPassword(password);
    
    const result = await db.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          name: companyName,
          subscription: subscription || "FREE",
        },
      });

      // 2. Create User linked to the Company
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role.toUpperCase(), // SUPERVISOR, OPERATOR
          companyId: company.id,
        },
      });

      return { user, company };
    });

    return res.status(201).json({
      message: "Registrasi berhasil.",
      userId: result.user.id,
      companyId: result.company.id,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan internal server." });
  }
}

async function me(req, res) {
  try {
    if (!req.user) {
      return res.json({ user: null });
    }
    const { password: _, ...userWithoutPassword } = req.user;
    return res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan internal server." });
  }
}


async function logout(req, res) {
  try {
    res.clearCookie("auth_token", { path: "/" });
    return res.json({ message: "Logout berhasil." });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan internal server." });
  }
}

module.exports = {
  login,
  register,
  me,
  logout,
};
