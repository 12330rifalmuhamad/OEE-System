-- CreateTable
CREATE TABLE "mleveloees" (
    "intidlevel" SERIAL NOT NULL,
    "txtnamalevel" TEXT NOT NULL,

    CONSTRAINT "mleveloees_pkey" PRIMARY KEY ("intidlevel")
);

-- CreateTable
CREATE TABLE "mroleoees" (
    "intidrole" SERIAL NOT NULL,
    "intiduser" INTEGER NOT NULL,
    "intidlevel" INTEGER NOT NULL,

    CONSTRAINT "mroleoees_pkey" PRIMARY KEY ("intidrole")
);

-- CreateTable
CREATE TABLE "mmenuoees" (
    "intidmenu" SERIAL NOT NULL,
    "txtnamamenu" TEXT NOT NULL,
    "txticon" TEXT,
    "intisactivemenu" INTEGER NOT NULL DEFAULT 1,
    "intsortermenu" INTEGER NOT NULL,

    CONSTRAINT "mmenuoees_pkey" PRIMARY KEY ("intidmenu")
);

-- CreateTable
CREATE TABLE "msubmenuoees" (
    "intidsubmenu" SERIAL NOT NULL,
    "intidmenu" INTEGER NOT NULL,
    "txtnamasubmenu" TEXT NOT NULL,
    "txturl" TEXT,
    "txtroute" TEXT,
    "txticonsubmenu" TEXT,
    "intisactivesubmenu" INTEGER NOT NULL DEFAULT 1,
    "intsortersubmenu" INTEGER NOT NULL,

    CONSTRAINT "msubmenuoees_pkey" PRIMARY KEY ("intidsubmenu")
);

-- CreateTable
CREATE TABLE "maccessmenuoees" (
    "intidaccessmenu" SERIAL NOT NULL,
    "intidlevel" INTEGER NOT NULL,
    "intidmenu" INTEGER NOT NULL,

    CONSTRAINT "maccessmenuoees_pkey" PRIMARY KEY ("intidaccessmenu")
);

-- AddForeignKey
ALTER TABLE "mroleoees" ADD CONSTRAINT "mroleoees_intidlevel_fkey" FOREIGN KEY ("intidlevel") REFERENCES "mleveloees"("intidlevel") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "msubmenuoees" ADD CONSTRAINT "msubmenuoees_intidmenu_fkey" FOREIGN KEY ("intidmenu") REFERENCES "mmenuoees"("intidmenu") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maccessmenuoees" ADD CONSTRAINT "maccessmenuoees_intidlevel_fkey" FOREIGN KEY ("intidlevel") REFERENCES "mleveloees"("intidlevel") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maccessmenuoees" ADD CONSTRAINT "maccessmenuoees_intidmenu_fkey" FOREIGN KEY ("intidmenu") REFERENCES "mmenuoees"("intidmenu") ON DELETE CASCADE ON UPDATE CASCADE;
