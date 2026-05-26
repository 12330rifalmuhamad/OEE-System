import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set({
      name: "auth_token",
      value: "",
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });

    return NextResponse.json({
      message: "Logout berhasil.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
