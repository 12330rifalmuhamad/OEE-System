import { PrismaClient } from "@prisma/client";
import { initMqttListeners } from "./mqttListener";

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
  mqttInitialized: boolean | undefined;
};

// Jika client di memori global tidak memiliki model 'mqttConfig' karena cache Next.js, 
// paksa buat instance PrismaClient baru agar skema baru terbaca secara instan!
const isCachedClientValid = globalForPrisma.prisma && ("mqttConfig" in globalForPrisma.prisma);

export const db: PrismaClient = (isCachedClientValid ? globalForPrisma.prisma : null) ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Jalankan listener latar belakang MQTT saat Next.js pertama kali memuat database client
if (typeof window === "undefined" && !globalForPrisma.mqttInitialized) {
  globalForPrisma.mqttInitialized = true;
  initMqttListeners().catch((err) => {
    console.error("[MQTT-BOOT] Failed to boot background listeners:", err);
  });
}
