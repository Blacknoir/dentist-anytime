ALTER TABLE "LabWebhookEvent" ADD COLUMN "completedAt" TIMESTAMP(3);

ALTER TABLE "LabCaseFile" ADD COLUMN "submittedAt" TIMESTAMP(3);

UPDATE "LabCaseFile" AS file
SET "submittedAt" = file."createdAt"
FROM "LabCase" AS work
WHERE file."caseId" = work."id"
  AND file."uploaderRole" = 'DESIGNER'
  AND file."storagePath" <> 'pending'
  AND (
    work."status" IN ('DELIVERED', 'COMPLETED')
    OR EXISTS (
      SELECT 1 FROM "CaseRevision" AS revision
      WHERE revision."caseId" = work."id" AND revision."createdAt" >= file."createdAt"
    )
  );
