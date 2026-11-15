import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/prisma"
import { createStripeTestDouble } from "../mocks/stripe-strict"

// The session of the current user is mocked: the actions read the user from
// the session.
const session = { userId: "" }
const stripeDouble = createStripeTestDouble()

vi.mock("@/auth", () => ({
    auth: async () => ({ user: { id: session.userId, email: "test@dentora.gr" } }),
}))

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }))

vi.mock("@/lib/stripe", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/stripe")>()
    vi.spyOn(actual.stripe.accountLinks, "create").mockImplementation(
        async (params) => {
            const link = await stripeDouble.api.accountLinks.create({ ...params })
            return {
                object: "account_link",
                url: link.url,
                expires_at: link.expires_at,
                created: Math.floor(Date.now() / 1000),
                lastResponse: { headers: {}, requestId: "req_test", statusCode: 200 },
            }
        }
    )
    return { ...actual, stripe: stripeDouble.api }
})

async function createUser(role: string, email: string) {
    return prisma.user.create({
        data: { email, name: email, role, publicCode: `${role}-${email.slice(0, 4)}` },
    })
}

async function createDesigner(userId: string, price = 100) {
    const profile = await prisma.designerProfile.create({
        data: { userId, headline: "CAD Designer" },
    })
    await prisma.designerService.create({
        data: { designerProfileId: profile.id, name: "Κορώνα", price },
    })
    return profile
}

async function grantConsents(userId: string) {
    const documents = await prisma.legalDocument.findMany()
    if (documents.length === 0) {
        await prisma.legalDocument.create({
            data: { key: "TERMS", title: "Όροι", version: "1.0", body: "όροι", contentHash: "hash-terms" },
        })
        await prisma.legalDocument.create({
            data: { key: "DPA", title: "DPA", version: "1.0", body: "dpa", contentHash: "hash-dpa" },
        })
        await prisma.legalDocument.create({
            data: {
                key: "PRIVACY",
                title: "Απορρήτου",
                version: "1.0",
                body: "privacy",
                contentHash: "hash-privacy",
            },
        })
    }

    const current = await prisma.legalDocument.findMany()
    for (const document of current) {
        await prisma.documentConsent.create({
            data: {
                userId,
                documentKey: document.key,
                documentVersion: document.version,
                documentHash: document.contentHash,
                scope: "LAB",
                evidenceId: `EV_${document.key}_${userId}`,
                ipAddress: "127.0.0.1",
                userAgent: "vitest",
            },
        })
    }
}

async function createCase(customerId: string) {
    return prisma.labCase.create({
        data: {
            code: `LAB-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
            title: "Κορώνα",
            type: "Crown",
            material: "Zirconia",
            description: "Μονοκόρωνη κορώνα",
            customerId,
            customerType: "DENTIST",
            status: "OPEN",
        },
    })
}

async function importActions() {
    return await import("@/app/actions/lab")
}

describe("the offers of the Lab", () => {
    beforeEach(async () => {
        await prisma.labCaseFile.deleteMany()
        await prisma.labOffer.deleteMany()
        await prisma.labCase.deleteMany()
        await prisma.documentConsent.deleteMany()
        await prisma.legalDocument.deleteMany()
        await prisma.designerService.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.user.deleteMany()
    })

    it("rejects an offer of a designer without the mandatory consents", async () => {
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")
        const designer = await createUser("DESIGNER", "designer@dentora.gr")
        await createDesigner(designer.id)
        const labCase = await createCase(dentist.id)

        session.userId = designer.id
        const { submitLabOffer } = await importActions()

        await expect(
            submitLabOffer({ caseId: labCase.id, price: 120, leadTimeDays: 3 })
        ).resolves.toMatchObject({ ok: false, code: "CONSENTS_MISSING", message: expect.any(String) })
        expect(await prisma.labOffer.count({ where: { caseId: labCase.id } })).toBe(0)
    })

    it("accepts an offer when the consents are given and moves the work to QUOTED", async () => {
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")
        const designer = await createUser("DESIGNER", "designer@dentora.gr")
        await createDesigner(designer.id)
        await grantConsents(designer.id)
        const labCase = await createCase(dentist.id)

        session.userId = designer.id
        const { submitLabOffer } = await importActions()
        const result = await submitLabOffer({
            caseId: labCase.id,
            price: 120,
            leadTimeDays: 4,
            message: "Χρόνος 4 ημέρες",
        })
        expect(result.ok).toBe(true)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.status).toBe("QUOTED")
        // The work is not assigned before the customer accepts.
        expect(updated?.assignedDesignerId).toBeNull()

        const offers = await prisma.labOffer.findMany({ where: { caseId: labCase.id } })
        expect(offers).toHaveLength(1)
        expect(offers[0].status).toBe("PENDING")
        expect(offers[0].price).toBe(120)
        expect(offers[0].leadTimeDays).toBe(4)
    })

    it("does not create a second offer when the designer sends it twice", async () => {
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")
        const designer = await createUser("DESIGNER", "designer@dentora.gr")
        await createDesigner(designer.id)
        await grantConsents(designer.id)
        const labCase = await createCase(dentist.id)

        session.userId = designer.id
        const { submitLabOffer } = await importActions()

        await submitLabOffer({ caseId: labCase.id, price: 120, leadTimeDays: 3 })
        await submitLabOffer({ caseId: labCase.id, price: 130, leadTimeDays: 5 })

        const offers = await prisma.labOffer.findMany({ where: { caseId: labCase.id } })
        expect(offers).toHaveLength(1)
        expect(offers[0].price).toBe(130)
        expect(offers[0].leadTimeDays).toBe(5)
    })

    it("refuses an offer of a designer on a work that is already assigned", async () => {
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")
        const designer = await createUser("DESIGNER", "designer@dentora.gr")
        const other = await createUser("DESIGNER", "other@dentora.gr")
        const designerProfile = await createDesigner(designer.id)
        await createDesigner(other.id)
        await grantConsents(other.id)
        const labCase = await createCase(dentist.id)
        await prisma.labCase.update({
            where: { id: labCase.id },
            data: { status: "ASSIGNED", assignedDesignerId: designerProfile.id },
        })

        session.userId = other.id
        const { submitLabOffer } = await importActions()

        await expect(
            submitLabOffer({ caseId: labCase.id, price: 100, leadTimeDays: 3 })
        ).resolves.toMatchObject({ ok: false, code: "CASE_ASSIGNED" })
    })

    it("shows offers only for work the signed-in designer can bid on", async () => {
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")
        const designer = await createUser("DESIGNER", "designer@dentora.gr")
        const other = await createUser("DESIGNER", "other@dentora.gr")
        const ownProfile = await createDesigner(designer.id)
        const otherProfile = await createDesigner(other.id)
        const ownCase = await createCase(designer.id)
        const open = await createCase(dentist.id)
        const requested = await createCase(dentist.id)
        const privateCase = await createCase(dentist.id)
        await prisma.labCase.update({ where: { id: requested.id }, data: { requestedDesignerId: ownProfile.id } })
        await prisma.labCase.update({ where: { id: privateCase.id }, data: { requestedDesignerId: otherProfile.id } })

        session.userId = designer.id
        const { getDesignerDashboard } = await import("@/app/actions/lab-designer")
        const dashboard = await getDesignerDashboard()
        expect(dashboard?.openCases.map((work) => work.id).sort()).toEqual([open.id, requested.id].sort())

        await grantConsents(designer.id)
        const { submitLabOffer } = await importActions()
        expect(await submitLabOffer({ caseId: ownCase.id, price: 120, leadTimeDays: 3 })).toMatchObject({
            ok: false, code: "FORBIDDEN",
        })
    })

    it("returns an onboarding URL and reuses the account when Stripe requires both capabilities", async () => {
        const designer = await createUser("DESIGNER", "onboarding@dentora.gr")
        const profile = await createDesigner(designer.id)
        session.userId = designer.id
        const buildAccount = vi.spyOn(stripeDouble.api.accounts, "create").mockRejectedValueOnce(Object.assign(
            new Error("Your platform needs approval for accounts to have requested the `transfers` capability without the `card_payments` capability."),
            { type: "StripeInvalidRequestError" }
        ))
        const createLink = vi.spyOn(stripeDouble.api.accountLinks, "create")
        const { startDesignerStripeOnboarding, getDesignerStripeStatus } = await import("@/app/actions/lab-designer")
        try {
            expect(await startDesignerStripeOnboarding()).toEqual({ ok: true, url: expect.stringMatching(/^https:\/\/connect.stripe.test\//) })
            const saved = await prisma.designerProfile.findUniqueOrThrow({ where: { id: profile.id } })
            expect(saved.stripeAccountId).toBeTruthy()
            expect(buildAccount).toHaveBeenCalledTimes(2)
            expect(buildAccount.mock.calls[1][0].capabilities).toEqual({
                card_payments: { requested: true }, transfers: { requested: true },
            })
            expect(await startDesignerStripeOnboarding()).toMatchObject({ ok: true })
            expect(buildAccount).toHaveBeenCalledTimes(2)
            expect(createLink).toHaveBeenLastCalledWith({
                account: saved.stripeAccountId,
                refresh_url: "http://localhost:3000/lab/designer?stripe=refresh",
                return_url: "http://localhost:3000/lab/designer?stripe=return",
                type: "account_onboarding",
            })
            expect(await getDesignerStripeStatus()).toMatchObject({ state: "CAN_RECEIVE_PAYMENTS", isConnected: true })
        } finally {
            buildAccount.mockRestore()
            createLink.mockRestore()
        }
    })

    it("returns a safe error if Stripe rejects onboarding, without retrying unrelated failures", async () => {
        const designer = await createUser("DESIGNER", "onboarding-error@dentora.gr")
        const profile = await createDesigner(designer.id)
        session.userId = designer.id
        const buildAccount = vi.spyOn(stripeDouble.api.accounts, "create").mockRejectedValueOnce(new Error("stripe debug details"))
        const logger = vi.spyOn(console, "error").mockImplementation(() => {})
        try {
            const { startDesignerStripeOnboarding } = await import("@/app/actions/lab-designer")
            const result = await startDesignerStripeOnboarding()
            expect(result).toMatchObject({ ok: false, message: expect.any(String) })
            expect(JSON.stringify(result)).not.toContain("stripe debug details")
            expect(buildAccount).toHaveBeenCalledTimes(1)
            const saved = await prisma.designerProfile.findUniqueOrThrow({ where: { id: profile.id } })
            expect(saved.stripeAccountId).toBeNull()
        } finally {
            buildAccount.mockRestore()
            logger.mockRestore()
        }
    })

    it("accepts one offer only: two parallel acceptances, only one wins", async () => {
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")
        const designerA = await createUser("DESIGNER", "a@dentora.gr")
        const designerB = await createUser("DESIGNER", "b@dentora.gr")
        await createDesigner(designerA.id, 100)
        await createDesigner(designerB.id, 200)
        await grantConsents(designerA.id)
        await grantConsents(designerB.id)
        const labCase = await createCase(dentist.id)

        session.userId = designerA.id
        const { submitLabOffer } = await importActions()
        await submitLabOffer({ caseId: labCase.id, price: 100, leadTimeDays: 3 })

        session.userId = designerB.id
        await submitLabOffer({ caseId: labCase.id, price: 200, leadTimeDays: 3 })

        const offers = await prisma.labOffer.findMany({
            where: { caseId: labCase.id },
            orderBy: { price: "asc" },
        })
        expect(offers).toHaveLength(2)

        session.userId = dentist.id
        const { acceptLabOffer } = await importActions()

        const results = await Promise.allSettled([
            acceptLabOffer(labCase.id, offers[0].id),
            acceptLabOffer(labCase.id, offers[1].id),
        ])

        const fulfilled = results.filter((r) => r.status === "fulfilled")
        expect(fulfilled).toHaveLength(1)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.status).toBe("ASSIGNED")
        expect(updated?.assignedDesignerId).not.toBeNull()

        // only one offer is accepted, the other one is rejected
        const after = await prisma.labOffer.findMany({ where: { caseId: labCase.id } })
        const accepted = after.filter((offer) => offer.status === "ACCEPTED")
        expect(accepted).toHaveLength(1)
        expect(after.filter((offer) => offer.status === "REJECTED")).toHaveLength(1)

        // the assignment belongs to the designer of the accepted offer
        expect(updated?.assignedDesignerId).toBe(accepted[0].designerProfileId)
        expect(updated?.agreedPrice).toBe(accepted[0].price)
    })

    it("does not reset a paid work when another offer is accepted", async () => {
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")
        const designer = await createUser("DESIGNER", "designer@dentora.gr")
        await createDesigner(designer.id)
        const labCase = await createCase(dentist.id)

        const offer = await prisma.labOffer.create({
            data: {
                caseId: labCase.id,
                designerProfileId: (await prisma.designerProfile.findFirstOrThrow()).id,
                price: 120,
                status: "PENDING",
            },
        })
        await prisma.labCase.update({
            where: { id: labCase.id },
            data: { status: "OPEN", paymentStatus: "HELD", stripePaymentIntentId: "pi_1" },
        })

        session.userId = dentist.id
        const { acceptLabOffer } = await importActions()
        await acceptLabOffer(labCase.id, offer.id)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("HELD")
        expect(updated?.stripePaymentIntentId).toBe("pi_1")
    })

    it("rejects an offer that was already handled", async () => {
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")
        const designer = await createUser("DESIGNER", "designer@dentora.gr")
        await createDesigner(designer.id)
        const labCase = await createCase(dentist.id)
        const offer = await prisma.labOffer.create({
            data: {
                caseId: labCase.id,
                designerProfileId: (await prisma.designerProfile.findFirstOrThrow()).id,
                price: 120,
                status: "REJECTED",
            },
        })

        session.userId = dentist.id
        const { acceptLabOffer } = await importActions()

        await expect(acceptLabOffer(labCase.id, offer.id)).rejects.toMatchObject({
            code: "OFFER_NOT_PENDING",
        })
    })

    it("lets only the owner of the work accept an offer", async () => {
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")
        const other = await createUser("DENTIST", "other@dentora.gr")
        const designer = await createUser("DESIGNER", "designer@dentora.gr")
        await createDesigner(designer.id)
        const labCase = await createCase(dentist.id)
        const offer = await prisma.labOffer.create({
            data: {
                caseId: labCase.id,
                designerProfileId: (await prisma.designerProfile.findFirstOrThrow()).id,
                price: 120,
                status: "PENDING",
            },
        })

        session.userId = other.id
        const { acceptLabOffer } = await importActions()

        await expect(acceptLabOffer(labCase.id, offer.id)).rejects.toMatchObject({
            code: "FORBIDDEN",
        })
    })
})

describe("the request to a specific designer", () => {
    beforeEach(async () => {
        await prisma.labCaseFile.deleteMany()
        await prisma.labOffer.deleteMany()
        await prisma.labCase.deleteMany()
        await prisma.documentConsent.deleteMany()
        await prisma.legalDocument.deleteMany()
        await prisma.designerService.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.user.deleteMany()
    })

    it("is only a request: the work stays open until the designer answers", async () => {
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")
        const designer = await createUser("DESIGNER", "designer@dentora.gr")
        const designerProfile = await createDesigner(designer.id, 140)
        await grantConsents(dentist.id)

        session.userId = dentist.id
        const { createLabCase } = await importActions()

        const formData = new FormData()
        formData.set("type", "Crown")
        formData.set("material", "Zirconia")
        formData.set("description", "Μονοκόρωνη κορώνα")
        formData.set("designerId", designerProfile.id)
        formData.set("clientRequestId", "req-1")

        const created = await createLabCase(formData)

        const labCase = await prisma.labCase.findUnique({
            where: { id: created.id },
            include: { offers: true },
        })

        // The work is not assigned and no price is agreed yet.
        expect(labCase?.status).toBe("OPEN")
        expect(labCase?.assignedDesignerId).toBeNull()
        expect(labCase?.agreedPrice).toBeNull()
        expect(labCase?.requestedDesignerId).toBe(designerProfile.id)
        expect(labCase?.offers).toHaveLength(1)
        expect(labCase?.offers[0].source).toBe("CUSTOMER_REQUEST")
        expect(labCase?.offers[0].status).toBe("PENDING")
        expect(labCase?.offers[0].price).toBe(140)
    })

    it("does not create a second work when the same submit is repeated", async () => {
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")
        await grantConsents(dentist.id)

        session.userId = dentist.id
        const { createLabCase } = await importActions()

        const build = () => {
            const formData = new FormData()
            formData.set("type", "Crown")
            formData.set("material", "Zirconia")
            formData.set("description", "Μονοκόρωνη κορώνα")
            formData.set("clientRequestId", "req-duplicate")
            return formData
        }

        const first = await createLabCase(build())
        const second = await createLabCase(build())

        expect(second.id).toBe(first.id)
        expect(second.reused).toBe(true)
        expect(await prisma.labCase.count()).toBe(1)
    })
})
