import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/prisma"
import { sha256 } from "@/lib/lab-crypto"

const session = { userId: "" }

vi.mock("@/auth", () => ({
    auth: async () => ({ user: { id: session.userId, email: "test@dentora.gr" } }),
}))

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }))

const transfers = vi.fn(async (...args: unknown[]) => ({ id: "tr_test", args }))

vi.mock("@/lib/stripe", () => ({
    stripe: {
        paymentIntents: {
            create: vi.fn(async (...args: unknown[]) => ({
                id: "pi_test",
                client_secret: "secret_test",
                args,
            })),
        },
        transfers: { create: transfers },
        refunds: { create: vi.fn(async () => ({ id: "re_test" })) },
        accounts: { retrieve: vi.fn(), create: vi.fn() },
        accountLinks: { create: vi.fn() },
        webhooks: { constructEvent: vi.fn() },
    },
}))

async function createUser(role: string, email: string) {
    return prisma.user.create({
        data: { email, name: email, role, publicCode: `${role}-${email.slice(0, 4)}` },
    })
}

async function grantConsents(userId: string) {
    const documents = [
        { key: "TERMS", hash: "hash-terms" },
        { key: "DPA", hash: "hash-dpa" },
        { key: "PRIVACY", hash: "hash-privacy" },
    ]
    for (const document of documents) {
        const existing = await prisma.legalDocument.findFirst({
            where: { key: document.key },
        })
        const row =
            existing ??
            (await prisma.legalDocument.create({
                data: {
                    key: document.key,
                    title: document.key,
                    version: "1.0",
                    body: document.key,
                    contentHash: document.hash,
                },
            }))
        await prisma.documentConsent.create({
            data: {
                userId,
                documentKey: row.key,
                documentVersion: row.version,
                documentHash: row.contentHash,
                scope: "LAB",
                evidenceId: `EV_${document.key}_${userId}`,
                ipAddress: "127.0.0.1",
                userAgent: "vitest",
            },
        })
    }
}

/** A binary STL (80 byte header + triangle count + triangles). */
function binaryStl() {
    const header = Buffer.alloc(80)
    header.write("binary stl for the tests", 0)
    const triangles = Buffer.alloc(12 * 20)
    for (let i = 0; i < 20; i++) {
        triangles.writeUInt32LE(i, i * 12)
    }
    const count = Buffer.alloc(4)
    count.writeUInt32LE(20, 0)
    return Buffer.concat([header, count, triangles])
}

describe("the whole journey of a work", () => {
    beforeEach(async () => {
        transfers.mockClear()
        await prisma.labUploadChunk.deleteMany()
        await prisma.labUploadSession.deleteMany()
        await prisma.portfolioItem.deleteMany()
        await prisma.labCaseFile.deleteMany()
        await prisma.caseRevision.deleteMany()
        await prisma.labOffer.deleteMany()
        await prisma.labCase.deleteMany()
        await prisma.documentConsent.deleteMany()
        await prisma.legalDocument.deleteMany()
        await prisma.designerService.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.user.deleteMany()
    })

    it("goes from the customer to the designer and pays exactly once", async () => {
        const customer = await createUser("DENTIST", "customer@dentora.gr")
        const designerUser = await createUser("DESIGNER", "designer@dentora.gr")
        const designerProfile = await prisma.designerProfile.create({
            data: { userId: designerUser.id, headline: "CAD Designer", stripeAccountId: "acct_test" },
        })
        await prisma.designerService.create({
            data: { designerProfileId: designerProfile.id, name: "Κορώνα", price: 120 },
        })
        await grantConsents(designerUser.id)
        await grantConsents(customer.id)

        const { createLabCase, submitLabOffer, acceptLabOffer, createCasePaymentIntent } =
            await import("@/app/actions/lab")
        const { createUploadSession, appendUploadChunk, completeUploadSession } = await import(
            "@/lib/lab-uploads"
        )
        const { markCasePaymentHeldInternal, releaseCasePaymentInternal } = await import(
            "@/lib/lab-payments"
        )
        const { uploadDesignerFiles, approveDelivery, startProduction } = await import(
            "@/app/actions/lab"
        )

        // 1. the customer creates the work and uploads the scan
        session.userId = customer.id
        const formData = new FormData()
        formData.set("type", "Crown")
        formData.set("material", "Zirconia")
        formData.set("description", "Μονοκόρωνη κορώνα")
        formData.set("clientRequestId", "journey-1")

        const created = await createLabCase(formData)
        expect(created.code).toBeTruthy()

        const scan = binaryStl()
        const upload = await createUploadSession({
            userId: customer.id,
            caseId: created.id,
            fileName: "scan.stl",
            fileSize: scan.length,
            mimeType: "model/stl",
            kind: "INPUT_STL",
        })
        await appendUploadChunk({
            sessionId: upload.sessionId,
            userId: customer.id,
            index: 0,
            data: scan,
        })
        const uploaded = await completeUploadSession({
            sessionId: upload.sessionId,
            userId: customer.id,
            checksum: sha256(scan),
            uploaderRole: "CUSTOMER",
            kind: "INPUT_STL",
            caseId: created.id,
        })

        // the binary file is stored encrypted and comes back unchanged
        const { readLabFile } = await import("@/lib/lab-storage")
        const stored = await prisma.labCaseFile.findUnique({ where: { id: uploaded.fileId } })
        const read = await readLabFile(
            stored!.storagePath,
            stored!.storageProvider as "blob" | "local" | "db",
            stored!.id
        )
        expect(sha256(read.body)).toBe(sha256(scan))

        // 2. the designer answers with a price
        session.userId = designerUser.id
        await submitLabOffer({ caseId: created.id, price: 120, leadTimeDays: 3 })

        // 3. the customer accepts the offer
        session.userId = customer.id
        const offer = await prisma.labOffer.findFirstOrThrow({ where: { caseId: created.id } })
        await acceptLabOffer(created.id, offer.id)

        const assigned = await prisma.labCase.findUnique({ where: { id: created.id } })
        expect(assigned?.status).toBe("ASSIGNED")
        expect(assigned?.agreedPrice).toBe(120)
        expect(assigned?.paymentStatus).toBe("UNPAID")

        // 4. the customer pays (test mode, the Stripe call is mocked)
        const payment = await createCasePaymentIntent(created.id)
        expect("clientSecret" in payment).toBe(true)

        // 5. the webhook marks the payment as held
        const held = await markCasePaymentHeldInternal(created.id, "pi_test", 12000)
        expect(held.applied).toBe(true)

        // 6. the designer starts the production and delivers the file
        session.userId = designerUser.id
        await startProduction(created.id)
        const deliverable = new FormData()
        deliverable.append("kind", "OUTPUT_STL")
        deliverable.append(
            "files",
            new File([binaryStl()], "crown_final.stl", { type: "model/stl" })
        )
        const delivery = await uploadDesignerFiles(created.id, deliverable)
        expect(delivery.uploaded.length).toBe(1)

        const delivered = await prisma.labCase.findUnique({ where: { id: created.id } })
        expect(delivered?.status).toBe("DELIVERED")

        // 7. the customer approves the delivery
        session.userId = customer.id
        const approval = await approveDelivery(created.id)
        expect(approval.ok).toBe(true)
        expect(approval.released).toBe(true)

        const completed = await prisma.labCase.findUnique({ where: { id: created.id } })
        expect(completed?.status).toBe("COMPLETED")
        expect(completed?.paymentStatus).toBe("RELEASED")

        // 8. exactly one transfer to the designer
        expect(transfers).toHaveBeenCalledTimes(1)
        const profile = await prisma.designerProfile.findUnique({ where: { id: designerProfile.id } })
        expect(profile?.earnings).toBe(108)
        expect(profile?.completedCases).toBe(1)

        // 9. a second release does not pay again
        const second = await releaseCasePaymentInternal(created.id)
        expect(second.released).toBe(true)
        expect(transfers).toHaveBeenCalledTimes(1)
        const after = await prisma.designerProfile.findUnique({ where: { id: designerProfile.id } })
        expect(after?.earnings).toBe(108)
    })
})
