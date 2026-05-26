import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Ambil seluruh daftar karyawan (user) di dalam Company
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const employees = await db.user.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { email: "asc" },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("GET Employees Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data karyawan." }, { status: 500 });
  }
}

// POST: Daftarkan karyawan baru di bawah Company (Hanya OWNER / MANAGER)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Hanya OWNER atau MANAGER yang diizinkan." }, { status: 403 });
    }

    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Email, password, dan role wajib diisi." }, { status: 400 });
    }

    const roleUpper = role.toUpperCase();
    if (roleUpper !== "OWNER" && roleUpper !== "MANAGER" && roleUpper !== "OPERATOR") {
      return NextResponse.json({ error: "Role tidak valid. Gunakan OWNER, MANAGER, atau OPERATOR." }, { status: 400 });
    }

    // Cek apakah email sudah digunakan
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const employee = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        role: roleUpper,
        companyId: user.companyId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ message: "Karyawan berhasil didaftarkan.", employee }, { status: 201 });
  } catch (error) {
    console.error("POST Employee Error:", error);
    return NextResponse.json({ error: "Gagal mendaftarkan karyawan." }, { status: 500 });
  }
}
