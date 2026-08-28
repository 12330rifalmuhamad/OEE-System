const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("=== DB DIAGNOSTIC ===");
    
    // Companies
    const companies = await prisma.company.findMany();
    console.log(`Total Companies: ${companies.length}`);
    companies.forEach(c => {
      console.log(`- Company ID: ${c.id}, Name: ${c.name}`);
    });

    // Users
    const users = await prisma.user.findMany();
    console.log(`Total Users: ${users.length}`);
    users.forEach(u => {
      console.log(`- User ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, CompanyID: ${u.companyId}`);
    });

    // Machines
    const machines = await prisma.machine.findMany();
    console.log(`Total Machines: ${machines.length}`);
    const machineCompanyIds = [...new Set(machines.map(m => m.companyId))];
    console.log(`- Unique Company IDs in Machine: ${machineCompanyIds.join(", ")}`);
    if (machines.length > 0) {
      console.log(`- Sample Machine: ${machines[0].name} (Company ID: ${machines[0].companyId})`);
    }

    // Products
    const products = await prisma.product.findMany();
    console.log(`Total Products: ${products.length}`);
    const productCompanyIds = [...new Set(products.map(p => p.companyId))];
    console.log(`- Unique Company IDs in Product: ${productCompanyIds.join(", ")}`);
    if (products.length > 0) {
      console.log(`- Sample Product: ${products[0].name} (Company ID: ${products[0].companyId})`);
    }

    // Line Processes
    const lineProcesses = await prisma.lineProcess.findMany();
    console.log(`Total Line Processes: ${lineProcesses.length}`);
    const lpCompanyIds = [...new Set(lineProcesses.map(l => l.companyId))];
    console.log(`- Unique Company IDs in LineProcess: ${lpCompanyIds.join(", ")}`);

    // MQTT Configs
    const mqttConfigs = await prisma.mqttConfig.findMany();
    console.log(`Total MQTT Configs: ${mqttConfigs.length}`);
    const mqttCompanyIds = [...new Set(mqttConfigs.map(m => m.companyId))];
    console.log(`- Unique Company IDs in MQTT Config: ${mqttCompanyIds.join(", ")}`);

    // Activity Codes
    const activityCodes = await prisma.activityCode.findMany();
    console.log(`Total Activity Codes: ${activityCodes.length}`);
    const acCompanyIds = [...new Set(activityCodes.map(a => a.companyId))];
    console.log(`- Unique Company IDs in Activity Codes: ${acCompanyIds.join(", ")}`);

  } catch (error) {
    console.error("Diagnostic Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
