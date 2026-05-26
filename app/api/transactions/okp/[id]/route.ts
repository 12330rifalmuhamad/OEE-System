import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Ambil detail lengkap transaksi OKP berdasarkan ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { id } = await params;

    const okpLog = await db.okpLog.findFirst({
      where: { id: parseInt(id, 10), companyId: user.companyId },
      include: {
        machine: true,
        product: true,
        activities: {
          include: {
            activityCode: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!okpLog) {
      return NextResponse.json({ error: "Transaksi OKP tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ okpLog });
  } catch (error) {
    console.error("GET OKP Log Detail Error:", error);
    return NextResponse.json({ error: "Gagal mengambil detail transaksi OKP." }, { status: 500 });
  }
}
