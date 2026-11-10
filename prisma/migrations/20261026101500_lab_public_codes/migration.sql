-- AlterTable
ALTER TABLE "User" ADD COLUMN     "publicCode" TEXT;

-- Backfill an anonymous marketplace code for every existing account.
WITH numbered AS (
    SELECT id, role, ROW_NUMBER() OVER (ORDER BY id ASC) AS rn
    FROM "User"
)
UPDATE "User" u
SET "publicCode" = (CASE u.role
        WHEN 'DENTIST' THEN 'DN-'
        WHEN 'LAB' THEN 'LB-'
        WHEN 'DESIGNER' THEN 'CD-'
        WHEN 'ADMIN' THEN 'AD-'
        ELSE 'PT-'
    END) || LPAD(n.rn::text, 4, '0')
FROM numbered n
WHERE u.id = n.id;

-- CreateIndex
CREATE UNIQUE INDEX "User_publicCode_key" ON "User"("publicCode");
