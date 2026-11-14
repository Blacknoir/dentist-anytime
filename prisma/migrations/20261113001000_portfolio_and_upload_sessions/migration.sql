-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "designerProfileId" TEXT,
    "labProfileId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT '',
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "storagePath" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'db',
    "content" BYTEA,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabUploadSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT,
    "kind" TEXT,
    "receivedBytes" INTEGER NOT NULL DEFAULT 0,
    "checksum" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabUploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabUploadChunk" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabUploadChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabWebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabWebhookEvent_type_idx" ON "LabWebhookEvent"("type");

-- CreateIndex
CREATE INDEX "PortfolioItem_designerProfileId_idx" ON "PortfolioItem"("designerProfileId");

-- CreateIndex
CREATE INDEX "PortfolioItem_labProfileId_idx" ON "PortfolioItem"("labProfileId");

-- CreateIndex
CREATE INDEX "LabUploadSession_userId_idx" ON "LabUploadSession"("userId");

-- CreateIndex
CREATE INDEX "LabUploadSession_status_idx" ON "LabUploadSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LabUploadChunk_sessionId_index_key" ON "LabUploadChunk"("sessionId", "index");

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_designerProfileId_fkey" FOREIGN KEY ("designerProfileId") REFERENCES "DesignerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_labProfileId_fkey" FOREIGN KEY ("labProfileId") REFERENCES "LabProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabUploadSession" ADD CONSTRAINT "LabUploadSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabUploadSession" ADD CONSTRAINT "LabUploadSession_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "LabCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabUploadChunk" ADD CONSTRAINT "LabUploadChunk_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LabUploadSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
