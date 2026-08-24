const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Inserting sample product data...");

  // Find company
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error("❌ No company found!");
    return;
  }

  // Get line processes
  const lineProcesses = await prisma.lineProcess.findMany({
    where: { companyId: company.id }
  });

  const lineMap = {};
  lineProcesses.forEach(lp => {
    lineMap[lp.name] = lp.id;
  });

  const defaultLineId = lineProcesses.length > 0 ? lineProcesses[0].id : null;

  // Sample Product List
  const sampleProducts = [
    {
      companyId: company.id,
      lineProcessId: lineMap["Line A"] || defaultLineId,
      articleCode: "ART-4001",
      productCode: "PRD-CHILKID-800",
      name: "Chil Kid Platinum Vanilla 800g",
      lineCode: "LINE-A1",
      size: "800g",
      sizeGram: 800.0,
      batchSizeKg: 1200.0,
      pcsPerCarton: 24.0,
      netFill: 800.0,
      processCategory: "Powder Packaging",
      focusCategory: "Main Product",
      productCategory: "Growing Up Milk",
      stdSpeedFbMin: 120.0,
      stdSpeedFilling: 120.0,
      stdSpeedCbMin: 5.0,
      stdSpeedBinShift: 4.0,
      stdBatchCb: 50.0,
      stdBatchMin: 240.0,
      standarSpeed: 120.0,
      speedCasepackerCb: 5.0,
      jumlahManpower: 6,
      totalBinPerShift: 4.0,
      remarks: "Sample produk Chil Kid Platinum 800g"
    },
    {
      companyId: company.id,
      lineProcessId: lineMap["Line D"] || defaultLineId,
      articleCode: "ART-4002",
      productCode: "PRD-BMTGOLD-400",
      name: "Morinaga BMT Gold Regular 400g",
      lineCode: "LINE-D1",
      size: "400g",
      sizeGram: 400.0,
      batchSizeKg: 1000.0,
      pcsPerCarton: 12.0,
      netFill: 400.0,
      processCategory: "Powder Packaging",
      focusCategory: "Infant Formula",
      productCategory: "Starter Formula",
      stdSpeedFbMin: 140.0,
      stdSpeedFilling: 140.0,
      stdSpeedCbMin: 11.6,
      stdSpeedBinShift: 6.0,
      stdBatchCb: 83.3,
      stdBatchMin: 180.0,
      standarSpeed: 140.0,
      speedCasepackerCb: 11.6,
      jumlahManpower: 5,
      totalBinPerShift: 6.0,
      remarks: "Sample produk BMT Gold 400g"
    },
    {
      companyId: company.id,
      lineProcessId: lineMap["Line E"] || defaultLineId,
      articleCode: "ART-4003",
      productCode: "PRD-CHILMIL-800",
      name: "Chil Mil Regular Honey 800g",
      lineCode: "LINE-E2",
      size: "800g",
      sizeGram: 800.0,
      batchSizeKg: 1500.0,
      pcsPerCarton: 24.0,
      netFill: 800.0,
      processCategory: "Powder Packaging",
      focusCategory: "Follow-up Formula",
      productCategory: "Growing Up Milk",
      stdSpeedFbMin: 110.0,
      stdSpeedFilling: 110.0,
      stdSpeedCbMin: 4.58,
      stdSpeedBinShift: 5.0,
      stdBatchCb: 62.5,
      stdBatchMin: 320.0,
      standarSpeed: 110.0,
      speedCasepackerCb: 4.58,
      jumlahManpower: 6,
      totalBinPerShift: 5.0,
      remarks: "Sample produk Chil Mil Honey 800g"
    },
    {
      companyId: company.id,
      lineProcessId: lineMap["Line F"] || defaultLineId,
      articleCode: "ART-4004",
      productCode: "PRD-ZEEK-350",
      name: "Morinaga Zee Krunchy Chocolate 350g",
      lineCode: "LINE-F1",
      size: "350g",
      sizeGram: 350.0,
      batchSizeKg: 800.0,
      pcsPerCarton: 36.0,
      netFill: 350.0,
      processCategory: "Dry Mixing",
      focusCategory: "Kids Milk",
      productCategory: "Flavored Milk",
      stdSpeedFbMin: 150.0,
      stdSpeedFilling: 150.0,
      stdSpeedCbMin: 4.16,
      stdSpeedBinShift: 8.0,
      stdBatchCb: 63.5,
      stdBatchMin: 190.0,
      standarSpeed: 150.0,
      speedCasepackerCb: 4.16,
      jumlahManpower: 4,
      totalBinPerShift: 8.0,
      remarks: "Sample produk Zee Krunchy 350g"
    },
    {
      companyId: company.id,
      lineProcessId: lineMap["Canning"] || defaultLineId,
      articleCode: "ART-4005",
      productCode: "PRD-DIVA-200",
      name: "Morinaga Diva Beauty Drink 200g",
      lineCode: "LINE-CAN1",
      size: "200g",
      sizeGram: 200.0,
      batchSizeKg: 500.0,
      pcsPerCarton: 48.0,
      netFill: 200.0,
      processCategory: "Canning",
      focusCategory: "Specialty Nutrition",
      productCategory: "Adult Milk",
      stdSpeedFbMin: 160.0,
      stdSpeedFilling: 160.0,
      stdSpeedCbMin: 3.33,
      stdSpeedBinShift: 10.0,
      stdBatchCb: 52.0,
      stdBatchMin: 150.0,
      standarSpeed: 160.0,
      speedCasepackerCb: 3.33,
      jumlahManpower: 4,
      totalBinPerShift: 10.0,
      remarks: "Sample produk Diva Beauty Drink 200g"
    }
  ];

  for (const item of sampleProducts) {
    const existing = await prisma.product.findFirst({
      where: { companyId: company.id, productCode: item.productCode }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: item
      });
      console.log(`✅ Updated sample product: ${item.name}`);
    } else {
      await prisma.product.create({
        data: item
      });
      console.log(`✅ Created sample product: ${item.name}`);
    }
  }

  console.log("🎉 Sample products successfully created!");
}

main()
  .catch(e => {
    console.error("❌ Error seeding sample products:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
