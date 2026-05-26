import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT: Perbarui data produk
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Hanya OWNER atau MANAGER yang diizinkan." }, { status: 403 });
    }

    const { id } = await params;
    const idInt = parseInt(id, 10);
    const { productCode, name, size, standarSpeed } = await request.json();

    // Pastikan produk milik company user
    const existingProduct = await db.product.findFirst({
      where: { id: idInt, companyId: user.companyId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    const updatedProduct = await db.product.update({
      where: { id: idInt },
      data: {
        productCode: productCode !== undefined ? productCode : existingProduct.productCode,
        name: name !== undefined ? name : existingProduct.name,
        size: size !== undefined ? size : existingProduct.size,
        standarSpeed: standarSpeed !== undefined ? parseFloat(standarSpeed) : existingProduct.standarSpeed,
      },
    });

    return NextResponse.json({ message: "Produk berhasil diperbarui.", product: updatedProduct });
  } catch (error) {
    console.error("PUT Product Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui produk." }, { status: 500 });
  }
}

// DELETE: Hapus produk
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Hanya OWNER atau MANAGER yang diizinkan." }, { status: 403 });
    }

    const { id } = await params;
    const idInt = parseInt(id, 10);

    // Pastikan produk milik company user
    const existingProduct = await db.product.findFirst({
      where: { id: idInt, companyId: user.companyId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    await db.product.delete({
      where: { id: idInt },
    });

    return NextResponse.json({ message: "Produk berhasil dihapus." });
  } catch (error) {
    console.error("DELETE Product Error:", error);
    return NextResponse.json({ error: "Gagal menghapus produk. Kemungkinan data produk ini masih direferensikan oleh tabel transaksi lain." }, { status: 500 });
  }
}
