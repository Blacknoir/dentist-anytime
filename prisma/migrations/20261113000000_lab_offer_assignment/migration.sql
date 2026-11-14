-- AlterTable
ALTER TABLE "LabCase" ADD COLUMN     "requestedDesignerId" TEXT,
ADD COLUMN     "clientRequestId" TEXT;

-- AlterTable
ALTER TABLE "LabOffer" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'DESIGNER';

-- CreateIndex
CREATE UNIQUE INDEX "LabCase_requestedDesignerId_idx" ON "LabCase"("requestedDesignerId");

-- CreateIndex
CREATE UNIQUE INDEX "LabCase_clientRequestId_key" ON "LabCase"("clientRequestId");

-- CreateIndex
CREATE INDEX "LabOffer_designerProfileId_idx" ON "LabOffer"("designerProfileId");

-- AddForeignKey
ALTER TABLE "LabCase" ADD CONSTRAINT "LabCase_requestedDesignerId_fkey" FOREIGN KEY ("requestedDesignerId") REFERENCES "DesignerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
