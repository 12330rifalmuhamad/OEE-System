import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, role, companyName, subscription } = await request.json();

    if (!email || !password || !role || !companyName) {
      return NextResponse.json(
        { error: "Semua field (email, password, role, companyName) wajib diisi." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 400 }
      );
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
          role: role.toUpperCase(), // OWNER, MANAGER, OPERATOR
          companyId: company.id,
        },
      });

      return { user, company };
    });

    return NextResponse.json({
      message: "Registrasi berhasil.",
      userId: result.user.id,
      companyId: result.company.id,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
