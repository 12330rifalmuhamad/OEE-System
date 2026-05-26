import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { initMqttListeners } from "@/lib/mqttListener";

// GET: Ambil semua konfigurasi MQTT milik Company user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const configs = await db.mqttConfig.findMany({
      where: { companyId: user.companyId },
      include: {
        machine: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ mqttConfigs: configs });
  } catch (error) {
    console.error("GET MQTT Configs Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data konfigurasi MQTT." }, { status: 500 });
  }
}

// POST: Upsert (Simpan / Perbarui) Konfigurasi MQTT per Mesin
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Hanya OWNER atau MANAGER yang diizinkan." }, { status: 403 });
    }

    const body = await request.json();
    const {
      machineId,
      brokerUrl,
      clientId,
      username,
      password,
      counterTopic,
      counterJsonPath,
      statusTopic,
      statusJsonPath,
      statusRunValue,
      statusStopValue,
    } = body;

    if (!machineId || !brokerUrl) {
      return NextResponse.json({ error: "Machine ID dan Broker URL wajib diisi." }, { status: 400 });
    }

    const machineIdInt = parseInt(machineId, 10);

    // Pastikan mesin yang dikonfigurasi milik company user
    const machine = await db.machine.findFirst({
      where: { id: machineIdInt, companyId: user.companyId },
    });

    if (!machine) {
      return NextResponse.json({ error: "Mesin tidak ditemukan." }, { status: 404 });
    }

    const mqttConfig = await db.mqttConfig.upsert({
      where: { machineId: machineIdInt },
      update: {
        brokerUrl: brokerUrl.trim(),
        clientId: clientId ? clientId.trim() : null,
        username: username ? username.trim() : null,
        password: password ? password.trim() : null,
        counterTopic: counterTopic ? counterTopic.trim() : null,
        counterJsonPath: counterJsonPath ? counterJsonPath.trim() : null,
        statusTopic: statusTopic ? statusTopic.trim() : null,
        statusJsonPath: statusJsonPath ? statusJsonPath.trim() : null,
        statusRunValue: statusRunValue ? statusRunValue.trim() : "RUN",
        statusStopValue: statusStopValue ? statusStopValue.trim() : "STOP",
      },
      create: {
        companyId: user.companyId,
        machineId: machineIdInt,
        brokerUrl: brokerUrl.trim(),
        clientId: clientId ? clientId.trim() : null,
        username: username ? username.trim() : null,
        password: password ? password.trim() : null,
        counterTopic: counterTopic ? counterTopic.trim() : null,
        counterJsonPath: counterJsonPath ? counterJsonPath.trim() : null,
        statusTopic: statusTopic ? statusTopic.trim() : null,
        statusJsonPath: statusJsonPath ? statusJsonPath.trim() : null,
        statusRunValue: statusRunValue ? statusRunValue.trim() : "RUN",
        statusStopValue: statusStopValue ? statusStopValue.trim() : "STOP",
      },
    });

    // Hot-reload background listeners synchronously so that connections update instantly
    initMqttListeners().catch((err) => {
      console.error("[MQTT-HOTRELOAD] Failed to reload listeners:", err);
    });

    return NextResponse.json({
      message: "Konfigurasi MQTT berhasil disimpan.",
      mqttConfig,
    });
  } catch (error) {
    console.error("POST MQTT Config Error:", error);
    return NextResponse.json({ error: "Gagal menyimpan konfigurasi MQTT." }, { status: 500 });
  }
}
