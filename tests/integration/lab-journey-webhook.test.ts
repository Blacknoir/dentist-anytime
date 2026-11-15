import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/prisma"
import { sha256 } from "@/lib/lab-crypto"
import { createStripeTestDouble } from "../mocks/stripe-strict"

// The whole journey of a work, through the real webhook route with a real
// signature (the payload is signed with the Stripe SDK and verified by it).
// Only the API calls are the double.

const WEBHOOK_SECRET = "whsec_test_secret_for_the_lab"
const stripeDouble = createStripeTestDouble()

const session = { userId: "" }

vi.mock("@/auth", () => ({
    auth: async () => ({ user: { id: session.userId, email: "test@dentora.gr" } }),
}))

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }))

vi.mock("@/lib/stripe", async () => {
    const actual = await vi.importActual<typeof import("@/lib/stripe")>("@/lib/stripe")
    return {
        ...actual,
        stripe: {
            ...stripeDouble.api,
            webhooks: (actual.stripe as unknown as { webhooks: unknown }).webhooks,
        },
    }
})

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

function must<T>(value: T | undefined): T {
    if (value === undefined) throw new Error("missing value")
    return value
}

function binaryStl() {
    const header = Buffer.alloc(80)
    header.write("binary stl for the tests", 0)
    const triangles = Buffer.alloc(12 * 20)
    const count = Buffer.alloc(4)
    count.writeUInt32LE(20, 0)
    return Buffer.concat([header, count, triangles])
}

async function postSignedEvent(event: unknown) {
    const { stripe } = await import("@/lib/stripe")
    const payload = JSON.stringify(event)
    const webhooks = (
        stripe as unknown as {
            webhooks: { generateTestHeaderString: (opts: { payload: string; secret: string }) => string }
        }
    ).webhooks
    const header = webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET })

    const { POST } = await import("@/app/api/lab/webhook/route")
    const request = new Request("https://www.dentora.gr/api/lab/webhook", {
        method: "POST",
        headers: { "content-type": "application/json", "stripe-signature": header },
        body: payload,
    })
    return POST(request)
}

describe("the journey of a work with the real webhook", () => {
    beforeEach(async () => {
        process.env.STRIPE_LAB_WEBHOOK_SECRET = WEBHOOK_SECRET
        stripeDouble.paymentIntents.clear()
        stripeDouble.charges.clear()
        stripeDouble.transfers.clear()
        stripeDouble.refunds.clear()
        stripeDouble.accounts.clear()
        stripeDouble.idempotency.clear()
        await prisma.labWebhookEvent.deleteMany()
        await prisma.labUploadChunk.deleteMany()
        await prisma.labUploadSession.deleteMany()
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

    it("goes from the dentist to the designer and pays exactly once", async () => {
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")
        const designerUser = await createUser("DESIGNER", "designer@dentora.gr")
        const designer = await prisma.designerProfile.create({
            data: { userId: designerUser.id, headline: "CAD Designer" },
        })
        await prisma.designerService.create({
            data: { designerProfileId: designer.id, name: "Κορώνα", price: 120 },
        })
        await grantConsents(dentist.id)
        await grantConsents(designerUser.id)

        // The designer connects Stripe (the account can receive transfers).
        const account = must(
            await stripeDouble.api.accounts.create({
                type: "express",
                country: "GR",
                capabilities: { transfers: { requested: true } },
            })
        )
        await prisma.designerProfile.update({
            where: { id: designer.id },
            data: { stripeAccountId: account.id },
        })

        const { createLabCase, submitLabOffer, acceptLabOffer, createCasePaymentIntent } =
            await import("@/app/actions/lab")
        const { approveDelivery, startProduction, submitLabDelivery } = await import(
            "@/app/actions/lab"
        )
        const { createUploadSession, appendUploadChunk, completeUploadSession } = await import(
            "@/lib/lab-uploads"
        )

        // 1. the dentist creates the work and uploads the scan
        const formData = new FormData()
        formData.set("type", "Crown")
        formData.set("material", "Zirconia")
        formData.set("description", "Μονοκόρωνη κορώνα")
        formData.set("clientRequestId", "journey-webhook-1")
        session.userId = dentist.id
        const created = await createLabCase(formData)

        const scan = binaryStl()
        const upload = await createUploadSession({
            userId: dentist.id,
            caseId: created.id,
            fileName: "scan.stl",
            fileSize: scan.length,
            mimeType: "model/stl",
            kind: "INPUT_STL",
        })
        await appendUploadChunk({
            sessionId: upload.sessionId,
            userId: dentist.id,
            index: 0,
            data: scan,
        })
        await completeUploadSession({
            sessionId: upload.sessionId,
            userId: dentist.id,
            checksum: sha256(scan),
            uploaderRole: "CUSTOMER",
            kind: "INPUT_STL",
            caseId: created.id,
        })

        // 2. the designer answers with a price, the dentist accepts
        session.userId = designerUser.id
        await submitLabOffer({ caseId: created.id, price: 120, leadTimeDays: 3 })
        const offer = await prisma.labOffer.findFirstOrThrow({ where: { caseId: created.id } })
        session.userId = dentist.id
        await acceptLabOffer(created.id, offer.id)

        const assigned = await prisma.labCase.findUnique({ where: { id: created.id } })
        expect(assigned?.status).toBe("ASSIGNED")
        expect(assigned?.agreedPrice).toBe(120)

        // 3. the dentist pays
        const payment = await createCasePaymentIntent(created.id)
        expect("clientSecret" in payment).toBe(true)
        const intent = must(stripeDouble.paymentIntents.get((payment as { id: string }).id))
        expect(intent.amount).toBe(12000)
        expect(intent.currency).toBe("eur")
        expect(intent.latest_charge?.startsWith("ch_")).toBe(true)

        // 4. the webhook (signed) marks the payment as held
        const res = await postSignedEvent({
            id: "evt_journey",
            object: "event",
            type: "payment_intent.succeeded",
            data: {
                object: {
                    object: "payment_intent",
                    id: intent.id,
                    amount: intent.amount,
                    currency: intent.currency,
                    metadata: intent.metadata,
                    latest_charge: intent.latest_charge,
                },
            },
        })
        expect(res.status).toBe(200)

        const held = await prisma.labCase.findUnique({ where: { id: created.id } })
        expect(held?.paymentStatus).toBe("HELD")
        expect(held?.stripeChargeId).toBe(intent.latest_charge)

        // 5. the designer produces and delivers
        session.userId = designerUser.id
        await startProduction(created.id)
        expect(await submitLabDelivery(created.id)).toMatchObject({ error: expect.any(String) })
        const { POST: finishUpload } = await import("@/app/api/lab/uploads/[id]/route")
        for (const fileName of ["crown_final.stl", "crown_support.stl"]) {
            const file = binaryStl()
            const pending = await createUploadSession({
                userId: designerUser.id, caseId: created.id, fileName,
                fileSize: file.length, kind: "OUTPUT_STL",
            })
            await appendUploadChunk({
                sessionId: pending.sessionId, userId: designerUser.id, index: 0, data: file,
            })
            const finish = () => finishUpload(new Request("https://www.dentora.gr/api/lab/uploads", {
                method: "POST",
                body: JSON.stringify({ caseId: created.id, kind: "OUTPUT_STL", checksum: sha256(file) }),
            }), { params: Promise.resolve({ id: pending.sessionId }) })
            const response = await finish()
            expect(response.status).toBe(200)
            const result = await response.json()
            expect(await (await finish()).json()).toEqual(result)
        }
        const draft = await prisma.labCase.findUnique({
            where: { id: created.id },
            select: { status: true, files: { where: { uploaderRole: "DESIGNER" } } },
        })
        expect(draft?.status).toBe("IN_PRODUCTION")
        expect(draft?.files).toHaveLength(2)
        expect(draft?.files[0]?.submittedAt).toBeNull()
        session.userId = dentist.id
        expect(await submitLabDelivery(created.id)).toMatchObject({ error: expect.any(String) })
        await expect(approveDelivery(created.id)).rejects.toMatchObject({ code: "CASE_NOT_DELIVERED" })
        session.userId = designerUser.id
        expect(await submitLabDelivery(created.id)).toEqual({ ok: true })
        expect(await prisma.labCaseFile.count({ where: {
            caseId: created.id, uploaderRole: "DESIGNER", submittedAt: { not: null },
        } })).toBe(2)

        // 6. the dentist approves the delivery: the money goes to the designer
        session.userId = dentist.id
        const approval = await approveDelivery(created.id)
        expect(approval.ok).toBe(true)
        expect(approval.released).toBe(true)

        const completed = await prisma.labCase.findUnique({ where: { id: created.id } })
        expect(completed?.status).toBe("COMPLETED")
        expect(completed?.paymentStatus).toBe("RELEASED")

        // 7. exactly one transfer, from the charge of the payment
        expect(stripeDouble.transfers.size).toBe(1)
        const transfer = [...stripeDouble.transfers.values()][0]
        expect(transfer.source_transaction).toBe(intent.latest_charge)
        expect(transfer.source_transaction?.startsWith("ch_")).toBe(true)
        expect(transfer.amount).toBe(10800)
        expect(transfer.destination).toBe(account.id)

        // 8. the earnings of the designer
        const profile = await prisma.designerProfile.findUnique({ where: { id: designer.id } })
        expect(profile?.earnings).toBe(108)
        expect(profile?.completedCases).toBe(1)

        // 9. a second approval does not pay again
        await approveDelivery(created.id).catch(() => undefined)
        expect(stripeDouble.transfers.size).toBe(1)
        const after = await prisma.designerProfile.findUnique({ where: { id: designer.id } })
        expect(after?.earnings).toBe(108)
        expect(after?.completedCases).toBe(1)
    })
})
