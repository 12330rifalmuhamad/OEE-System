const { db } = require("../lib/db");

async function checkProducts() {
  const products = await db.product.findMany({
    include: {
      machineSpeeds: {
        include: {
          machine: {
            include: {
              lineProcess: true
            }
          }
        }
      }
    }
  });

  console.log("=== PRODUCTS DATA ===");
  console.log(JSON.stringify(products, null, 2));

  const lines = await db.lineProcess.findMany({
    include: {
      machines: true
    }
  });
  console.log("=== LINES DATA ===");
  console.log(JSON.stringify(lines, null, 2));
}

checkProducts().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
