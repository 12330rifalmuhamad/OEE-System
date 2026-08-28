const { db } = require("../lib/db");

async function main() {
  const line = await db.lineProcess.findFirst({
    where: { name: { contains: "A4", mode: "insensitive" } },
    include: {
      machines: true
    }
  });

  if (!line) {
    console.log("Line not found");
    process.exit(0);
  }

  console.log(`LINE: ${line.name} (id: ${line.id})`);
  console.log("MACHINES:");
  line.machines.forEach(m => {
    console.log({
      id: m.id,
      name: m.name,
      code: m.code,
    });
  });
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
