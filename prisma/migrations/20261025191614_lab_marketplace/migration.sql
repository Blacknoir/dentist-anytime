-- CreateTable
CREATE TABLE "DesignerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT 'CAD Designer',
    "bio" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'GR',
    "avatarUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "stripeAccountId" TEXT,
    "isStripeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "completedCases" INTEGER NOT NULL DEFAULT 0,
    "avgLeadTimeDays" INTEGER NOT NULL DEFAULT 3,
    "earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignerService" (
    "id" TEXT NOT NULL,
    "designerProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "minUnits" INTEGER NOT NULL DEFAULT 1,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignerService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "labName" TEXT NOT NULL,
    "city" TEXT,
    "about" TEXT,
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabCase" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "shade" TEXT,
    "units" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'STANDARD',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "customerId" TEXT NOT NULL,
    "customerType" TEXT NOT NULL DEFAULT 'DENTIST',
    "assignedDesignerId" TEXT,
    "agreedPrice" INTEGER,
    "platformFee" INTEGER,
    "designerPayout" INTEGER,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "stripePaymentIntentId" TEXT,
    "stripeTransferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabCaseFile" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT,
    "storagePath" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'blob',
    "uploadedById" TEXT NOT NULL,
    "uploaderRole" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabCaseFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabOffer" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "designerProfileId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 3,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseRevision" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "designerProfileId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "CaseRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignerProfile_userId_key" ON "DesignerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LabProfile_userId_key" ON "LabProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LabCase_code_key" ON "LabCase"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LabCase_stripePaymentIntentId_key" ON "LabCase"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "LabCase_status_idx" ON "LabCase"("status");

-- CreateIndex
CREATE INDEX "LabCase_customerId_idx" ON "LabCase"("customerId");

-- CreateIndex
CREATE INDEX "LabCase_assignedDesignerId_idx" ON "LabCase"("assignedDesignerId");

-- CreateIndex
CREATE INDEX "LabCaseFile_caseId_idx" ON "LabCaseFile"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "LabOffer_caseId_designerProfileId_key" ON "LabOffer"("caseId", "designerProfileId");

-- CreateIndex
CREATE INDEX "CaseRevision_caseId_idx" ON "CaseRevision"("caseId");

-- AddForeignKey
ALTER TABLE "DesignerProfile" ADD CONSTRAINT "DesignerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerService" ADD CONSTRAINT "DesignerService_designerProfileId_fkey" FOREIGN KEY ("designerProfileId") REFERENCES "DesignerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabProfile" ADD CONSTRAINT "LabProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabCase" ADD CONSTRAINT "LabCase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabCase" ADD CONSTRAINT "LabCase_assignedDesignerId_fkey" FOREIGN KEY ("assignedDesignerId") REFERENCES "DesignerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabCaseFile" ADD CONSTRAINT "LabCaseFile_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "LabCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabCaseFile" ADD CONSTRAINT "LabCaseFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOffer" ADD CONSTRAINT "LabOffer_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "LabCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOffer" ADD CONSTRAINT "LabOffer_designerProfileId_fkey" FOREIGN KEY ("designerProfileId") REFERENCES "DesignerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRevision" ADD CONSTRAINT "CaseRevision_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "LabCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRevision" ADD CONSTRAINT "CaseRevision_designerProfileId_fkey" FOREIGN KEY ("designerProfileId") REFERENCES "DesignerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRevision" ADD CONSTRAINT "CaseRevision_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
