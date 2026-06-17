-- CreateTable
CREATE TABLE "mCompany" (
    "intCompany_ID" SERIAL NOT NULL,
    "txtCompanyName" TEXT NOT NULL,
    "txtSubscription" TEXT NOT NULL,
    "dtmCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdatedAt" TIMESTAMP(3) NOT NULL,
    "txtCreatedBy" TEXT DEFAULT 'SYSTEM',
    "txtUpdatedBy" TEXT DEFAULT 'SYSTEM',

    CONSTRAINT "mCompany_pkey" PRIMARY KEY ("intCompany_ID")
);

-- CreateTable
CREATE TABLE "mUser" (
    "intUser_ID" SERIAL NOT NULL,
    "txtEmail" TEXT NOT NULL,
    "txtPassword" TEXT NOT NULL,
    "txtRole" TEXT NOT NULL,
    "intCompany_ID" INTEGER NOT NULL,
    "dtmCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdatedAt" TIMESTAMP(3) NOT NULL,
    "txtCreatedBy" TEXT DEFAULT 'SYSTEM',
    "txtUpdatedBy" TEXT DEFAULT 'SYSTEM',

    CONSTRAINT "mUser_pkey" PRIMARY KEY ("intUser_ID")
);

-- CreateTable
CREATE TABLE "mActivityCategory" (
    "intActivityCategory_ID" SERIAL NOT NULL,
    "txtCode" TEXT NOT NULL,
    "txtName" TEXT NOT NULL,
    "dtmCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdatedAt" TIMESTAMP(3) NOT NULL,
    "txtCreatedBy" TEXT DEFAULT 'SYSTEM',
    "txtUpdatedBy" TEXT DEFAULT 'SYSTEM',

    CONSTRAINT "mActivityCategory_pkey" PRIMARY KEY ("intActivityCategory_ID")
);

-- CreateTable
CREATE TABLE "mActivityCode" (
    "intActivityCode_ID" SERIAL NOT NULL,
    "intCompany_ID" INTEGER NOT NULL,
    "intActivityCategory_ID" INTEGER NOT NULL,
    "txtCode" TEXT NOT NULL,
    "txtMainActivity" TEXT,
    "txtSubActivity" TEXT,
    "txtFullDescription" TEXT NOT NULL,
    "dtmCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdatedAt" TIMESTAMP(3) NOT NULL,
    "txtCreatedBy" TEXT DEFAULT 'SYSTEM',
    "txtUpdatedBy" TEXT DEFAULT 'SYSTEM',

    CONSTRAINT "mActivityCode_pkey" PRIMARY KEY ("intActivityCode_ID")
);

-- CreateTable
CREATE TABLE "mMachine" (
    "intMachine_ID" SERIAL NOT NULL,
    "intCompany_ID" INTEGER NOT NULL,
    "txtMachineName" TEXT NOT NULL,
    "intLineProcess_ID" INTEGER,
    "dtmCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdatedAt" TIMESTAMP(3) NOT NULL,
    "txtCreatedBy" TEXT DEFAULT 'SYSTEM',
    "txtUpdatedBy" TEXT DEFAULT 'SYSTEM',

    CONSTRAINT "mMachine_pkey" PRIMARY KEY ("intMachine_ID")
);

-- CreateTable
CREATE TABLE "mProduct" (
    "intProduct_ID" SERIAL NOT NULL,
    "intCompany_ID" INTEGER NOT NULL,
    "txtProductCode" TEXT,
    "txtProductName" TEXT NOT NULL,
    "txtProductSize" TEXT,
    "fltStandardSpeed" DOUBLE PRECISION NOT NULL,
    "dtmCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdatedAt" TIMESTAMP(3) NOT NULL,
    "txtCreatedBy" TEXT DEFAULT 'SYSTEM',
    "txtUpdatedBy" TEXT DEFAULT 'SYSTEM',

    CONSTRAINT "mProduct_pkey" PRIMARY KEY ("intProduct_ID")
);

-- CreateTable
CREATE TABLE "trOkpLog" (
    "intOkpLog_ID" SERIAL NOT NULL,
    "intCompany_ID" INTEGER NOT NULL,
    "txtOkpNumber" TEXT NOT NULL,
    "dtmDate" TIMESTAMP(3) NOT NULL,
    "intShift" INTEGER NOT NULL,
    "intMachine_ID" INTEGER NOT NULL,
    "intProduct_ID" INTEGER NOT NULL,
    "txtGroupLeader" TEXT,
    "txtOperator" TEXT,
    "txtHelper" TEXT,
    "fltLoadingTime" DOUBLE PRECISION NOT NULL,
    "fltTotalOutput" DOUBLE PRECISION NOT NULL,
    "fltRework" DOUBLE PRECISION NOT NULL,
    "fltReject" DOUBLE PRECISION NOT NULL,
    "fltSampleQc" DOUBLE PRECISION,
    "decAvailability" DOUBLE PRECISION,
    "decPerformance" DOUBLE PRECISION,
    "decQuality" DOUBLE PRECISION,
    "decOEE" DOUBLE PRECISION,
    "decDowntime" DOUBLE PRECISION,
    "decMI" DOUBLE PRECISION,
    "dtmCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdatedAt" TIMESTAMP(3) NOT NULL,
    "txtCreatedBy" TEXT DEFAULT 'SYSTEM',
    "txtUpdatedBy" TEXT DEFAULT 'SYSTEM',

    CONSTRAINT "trOkpLog_pkey" PRIMARY KEY ("intOkpLog_ID")
);

-- CreateTable
CREATE TABLE "trActivityLog" (
    "intActivityLog_ID" SERIAL NOT NULL,
    "intOkpLog_ID" INTEGER NOT NULL,
    "intActivityCode_ID" INTEGER NOT NULL,
    "fltDuration" DOUBLE PRECISION NOT NULL,
    "dtmStartTime" TIMESTAMP(3),
    "dtmEndTime" TIMESTAMP(3),
    "txtBrRootCause" TEXT,
    "fltBrMtdtWaiting" DOUBLE PRECISION,
    "fltBrMtdtRepair" DOUBLE PRECISION,
    "fltBrMtdtStartup" DOUBLE PRECISION,
    "dtmCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdatedAt" TIMESTAMP(3) NOT NULL,
    "txtCreatedBy" TEXT DEFAULT 'SYSTEM',
    "txtUpdatedBy" TEXT DEFAULT 'SYSTEM',

    CONSTRAINT "trActivityLog_pkey" PRIMARY KEY ("intActivityLog_ID")
);

-- CreateTable
CREATE TABLE "mKpiTarget" (
    "intKpiTarget_ID" SERIAL NOT NULL,
    "intCompany_ID" INTEGER NOT NULL,
    "fltOeeTarget" DOUBLE PRECISION NOT NULL DEFAULT 85.0,
    "fltAvailTarget" DOUBLE PRECISION NOT NULL DEFAULT 90.0,
    "fltPerfTarget" DOUBLE PRECISION NOT NULL DEFAULT 95.0,
    "fltQualTarget" DOUBLE PRECISION NOT NULL DEFAULT 99.0,
    "dtmCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdatedAt" TIMESTAMP(3) NOT NULL,
    "txtCreatedBy" TEXT DEFAULT 'SYSTEM',
    "txtUpdatedBy" TEXT DEFAULT 'SYSTEM',

    CONSTRAINT "mKpiTarget_pkey" PRIMARY KEY ("intKpiTarget_ID")
);

-- CreateTable
CREATE TABLE "trDmsAction" (
    "intDmsAction_ID" SERIAL NOT NULL,
    "intCompany_ID" INTEGER NOT NULL,
    "intOkpLog_ID" INTEGER,
    "txtDowntimeCode" TEXT NOT NULL,
    "txtActionPlan" TEXT NOT NULL,
    "txtPic" TEXT NOT NULL,
    "dtmTargetDate" TIMESTAMP(3),
    "txtStatus" TEXT NOT NULL DEFAULT 'OPEN',
    "dtmCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdatedAt" TIMESTAMP(3) NOT NULL,
    "txtCreatedBy" TEXT DEFAULT 'SYSTEM',
    "txtUpdatedBy" TEXT DEFAULT 'SYSTEM',

    CONSTRAINT "trDmsAction_pkey" PRIMARY KEY ("intDmsAction_ID")
);

-- CreateTable
CREATE TABLE "mMqttConfig" (
    "intMqttConfig_ID" SERIAL NOT NULL,
    "intCompany_ID" INTEGER NOT NULL,
    "intMachine_ID" INTEGER NOT NULL,
    "txtBrokerUrl" TEXT NOT NULL DEFAULT 'mqtt://127.0.0.1:1883',
    "txtClientId" TEXT,
    "txtUsername" TEXT,
    "txtPassword" TEXT,
    "txtCounterTopic" TEXT,
    "txtCounterJsonPath" TEXT,
    "txtStatusTopic" TEXT,
    "txtStatusJsonPath" TEXT,
    "txtStatusRunValue" TEXT NOT NULL DEFAULT 'RUN',
    "txtStatusStopValue" TEXT NOT NULL DEFAULT 'STOP',
    "dtmCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdatedAt" TIMESTAMP(3) NOT NULL,
    "txtCreatedBy" TEXT DEFAULT 'SYSTEM',
    "txtUpdatedBy" TEXT DEFAULT 'SYSTEM',

    CONSTRAINT "mMqttConfig_pkey" PRIMARY KEY ("intMqttConfig_ID")
);

-- CreateTable
CREATE TABLE "mLineProcess" (
    "intLineProcess_ID" SERIAL NOT NULL,
    "intCompany_ID" INTEGER NOT NULL,
    "txtLineProcessName" TEXT NOT NULL,
    "dtmCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdatedAt" TIMESTAMP(3) NOT NULL,
    "txtCreatedBy" TEXT DEFAULT 'SYSTEM',
    "txtUpdatedBy" TEXT DEFAULT 'SYSTEM',

    CONSTRAINT "mLineProcess_pkey" PRIMARY KEY ("intLineProcess_ID")
);

-- CreateIndex
CREATE UNIQUE INDEX "mUser_txtEmail_key" ON "mUser"("txtEmail");

-- CreateIndex
CREATE UNIQUE INDEX "mActivityCategory_txtCode_key" ON "mActivityCategory"("txtCode");

-- CreateIndex
CREATE UNIQUE INDEX "trOkpLog_intCompany_ID_txtOkpNumber_key" ON "trOkpLog"("intCompany_ID", "txtOkpNumber");

-- CreateIndex
CREATE UNIQUE INDEX "mKpiTarget_intCompany_ID_key" ON "mKpiTarget"("intCompany_ID");

-- CreateIndex
CREATE UNIQUE INDEX "mMqttConfig_intMachine_ID_key" ON "mMqttConfig"("intMachine_ID");

-- AddForeignKey
ALTER TABLE "mUser" ADD CONSTRAINT "mUser_intCompany_ID_fkey" FOREIGN KEY ("intCompany_ID") REFERENCES "mCompany"("intCompany_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mActivityCode" ADD CONSTRAINT "mActivityCode_intCompany_ID_fkey" FOREIGN KEY ("intCompany_ID") REFERENCES "mCompany"("intCompany_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mActivityCode" ADD CONSTRAINT "mActivityCode_intActivityCategory_ID_fkey" FOREIGN KEY ("intActivityCategory_ID") REFERENCES "mActivityCategory"("intActivityCategory_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mMachine" ADD CONSTRAINT "mMachine_intCompany_ID_fkey" FOREIGN KEY ("intCompany_ID") REFERENCES "mCompany"("intCompany_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mMachine" ADD CONSTRAINT "mMachine_intLineProcess_ID_fkey" FOREIGN KEY ("intLineProcess_ID") REFERENCES "mLineProcess"("intLineProcess_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mProduct" ADD CONSTRAINT "mProduct_intCompany_ID_fkey" FOREIGN KEY ("intCompany_ID") REFERENCES "mCompany"("intCompany_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trOkpLog" ADD CONSTRAINT "trOkpLog_intCompany_ID_fkey" FOREIGN KEY ("intCompany_ID") REFERENCES "mCompany"("intCompany_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trOkpLog" ADD CONSTRAINT "trOkpLog_intMachine_ID_fkey" FOREIGN KEY ("intMachine_ID") REFERENCES "mMachine"("intMachine_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trOkpLog" ADD CONSTRAINT "trOkpLog_intProduct_ID_fkey" FOREIGN KEY ("intProduct_ID") REFERENCES "mProduct"("intProduct_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trActivityLog" ADD CONSTRAINT "trActivityLog_intOkpLog_ID_fkey" FOREIGN KEY ("intOkpLog_ID") REFERENCES "trOkpLog"("intOkpLog_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trActivityLog" ADD CONSTRAINT "trActivityLog_intActivityCode_ID_fkey" FOREIGN KEY ("intActivityCode_ID") REFERENCES "mActivityCode"("intActivityCode_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mKpiTarget" ADD CONSTRAINT "mKpiTarget_intCompany_ID_fkey" FOREIGN KEY ("intCompany_ID") REFERENCES "mCompany"("intCompany_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trDmsAction" ADD CONSTRAINT "trDmsAction_intCompany_ID_fkey" FOREIGN KEY ("intCompany_ID") REFERENCES "mCompany"("intCompany_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trDmsAction" ADD CONSTRAINT "trDmsAction_intOkpLog_ID_fkey" FOREIGN KEY ("intOkpLog_ID") REFERENCES "trOkpLog"("intOkpLog_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mMqttConfig" ADD CONSTRAINT "mMqttConfig_intCompany_ID_fkey" FOREIGN KEY ("intCompany_ID") REFERENCES "mCompany"("intCompany_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mMqttConfig" ADD CONSTRAINT "mMqttConfig_intMachine_ID_fkey" FOREIGN KEY ("intMachine_ID") REFERENCES "mMachine"("intMachine_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mLineProcess" ADD CONSTRAINT "mLineProcess_intCompany_ID_fkey" FOREIGN KEY ("intCompany_ID") REFERENCES "mCompany"("intCompany_ID") ON DELETE CASCADE ON UPDATE CASCADE;
