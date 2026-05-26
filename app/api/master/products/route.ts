import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Ambil seluruh data produk dalam Company user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const products = await db.product.findMany({
      where: { companyId: user.companyId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET Products Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data produk." }, { status: 500 });
  }
}

// POST: Tambah produk baru (Hanya OWNER / MANAGER)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Hanya OWNER atau MANAGER yang diizinkan." }, { status: 403 });
    }

    const { productCode, name, size, standarSpeed } = await request.json();

    if (!name || standarSpeed === undefined) {
      return NextResponse.json({ error: "Nama produk dan standar speed wajib diisi." }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        companyId: user.companyId,
        productCode: productCode || null,
        name,
        size: size || null,
        standarSpeed: parseFloat(standarSpeed),
      },
    });

    return NextResponse.json({ message: "Produk berhasil ditambahkan.", product }, { status: 201 });
  } catch (error) {
    console.error("POST Product Error:", error);
    return NextResponse.json({ error: "Gagal menambahkan produk." }, { status: 500 });
  }
}
