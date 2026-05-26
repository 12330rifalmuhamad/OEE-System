import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT: Perbarui data karyawan (Edit Role / Ganti Password)
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
    const { email, password, role } = await request.json();

    // Pastikan karyawan milik company user
    const existingEmployee = await db.user.findFirst({
      where: { id: idInt, companyId: user.companyId },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan." }, { status: 404 });
    }

    // Jika OWNER mencoba mengedit dirinya sendiri atau sesama, pastikan data valid
    let roleUpper = existingEmployee.role;
    if (role) {
      roleUpper = role.toUpperCase();
      if (roleUpper !== "OWNER" && roleUpper !== "MANAGER" && roleUpper !== "OPERATOR") {
        return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
      }
    }

    const updateData: any = {
      role: roleUpper,
    };

    if (email) {
      // Cek duplikasi email jika diganti
      if (email !== existingEmployee.email) {
        const emailExists = await db.user.findUnique({ where: { email } });
        if (emailExists) {
          return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });
        }
        updateData.email = email;
      }
    }

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const updatedEmployee = await db.user.update({
      where: { id: idInt },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ message: "Karyawan berhasil diperbarui.", employee: updatedEmployee });
  } catch (error) {
    console.error("PUT Employee Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui data karyawan." }, { status: 500 });
  }
}

// DELETE: Hapus karyawan
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

    // Pastikan milik company user
    const existingEmployee = await db.user.findFirst({
      where: { id: idInt, companyId: user.companyId },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan." }, { status: 404 });
    }

    // Mencegah OWNER menghapus dirinya sendiri
    if (existingEmployee.id === user.id) {
      return NextResponse.json({ error: "Anda tidak dapat menghapus akun Anda sendiri." }, { status: 400 });
    }

    await db.user.delete({
      where: { id: idInt },
    });

    return NextResponse.json({ message: "Karyawan berhasil dihapus." });
  } catch (error) {
    console.error("DELETE Employee Error:", error);
    return NextResponse.json({ error: "Gagal menghapus karyawan. Kemungkinan akun ini memiliki keterkaitan relasi database lain." }, { status: 500 });
  }
}
