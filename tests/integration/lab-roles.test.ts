import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/prisma"

const session = { userId: "" }

vi.mock("@/auth", () => ({
    auth: async () => ({ user: { id: session.userId, email: "test@dentora.gr" } }),
}))

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }))

vi.mock("@/lib/stripe", () => ({
    stripe: {
        paymentIntents: { create: vi.fn() },
        transfers: { create: vi.fn() },
        refunds: { create: vi.fn() },
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

/** The mandatory documents of the Lab. */
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

describe("the role of an account", () => {
    beforeEach(async () => {
        await prisma.documentConsent.deleteMany()
        await prisma.legalDocument.deleteMany()
        await prisma.dentistProfile.deleteMany()
        await prisma.labProfile.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.labCase.deleteMany()
        await prisma.user.deleteMany()
    })

    it("keeps the role of an account that already exists", async () => {
        const { keepRoleOnSignIn } = await import("@/lib/lab-role-profiles")
        const designer = await createUser("DESIGNER", "designer@dentora.gr")

        // The sign in form asks for a dentist, the account is a designer.
        const role = await keepRoleOnSignIn(designer.id)

        expect(role).toBe("DESIGNER")
        const updated = await prisma.user.findUnique({ where: { id: designer.id } })
        expect(updated?.role).toBe("DESIGNER")
    })

    it("never gives the ADMIN role, not even if the browser asks for it", async () => {
        const { applyRoleOnAccountCreation } = await import("@/lib/lab-role-profiles")
        const user = await createUser("PATIENT", "patient@dentora.gr")

        // A client that sends the cookie "ADMIN".
        const role = await applyRoleOnAccountCreation(user.id, "ADMIN")

        expect(role).not.toBe("ADMIN")
        const updated = await prisma.user.findUnique({ where: { id: user.id } })
        expect(updated?.role).not.toBe("ADMIN")
    })

    it("gives the professional role of the form to a new account", async () => {
        const { applyRoleOnAccountCreation } = await import("@/lib/lab-role-profiles")
        const user = await createUser("PATIENT", "new@dentora.gr")

        const role = await applyRoleOnAccountCreation(user.id, "DENTIST")

        expect(role).toBe("DENTIST")
        const updated = await prisma.user.findUnique({ where: { id: user.id } })
        expect(updated?.role).toBe("DENTIST")

        // The profile of the role is created (once).
        const profiles = await prisma.dentistProfile.findMany({ where: { userId: user.id } })
        expect(profiles).toHaveLength(1)

        // A second sign in does not create a second profile.
        await applyRoleOnAccountCreation(user.id, "DENTIST")
        expect(await prisma.dentistProfile.count({ where: { userId: user.id } })).toBe(1)
    })

    it("creates the profile of the designer and of the lab", async () => {
        const { applyRoleOnAccountCreation } = await import("@/lib/lab-role-profiles")

        const designerUser = await createUser("PATIENT", "d@dentora.gr")
        await applyRoleOnAccountCreation(designerUser.id, "DESIGNER")
        expect(
            await prisma.designerProfile.count({ where: { userId: designerUser.id } })
        ).toBe(1)

        const labUser = await createUser("PATIENT", "l@dentora.gr")
        await applyRoleOnAccountCreation(labUser.id, "LAB")
        expect(await prisma.labProfile.count({ where: { userId: labUser.id } })).toBe(1)
    })
})

describe("the professional registration of the Lab", () => {
    beforeEach(async () => {
        await prisma.dentistProfile.deleteMany()
        await prisma.labProfile.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.labCase.deleteMany()
        await prisma.user.deleteMany()
    })

    it("creates the profile of a patient that joins as a dentist", async () => {
        const patient = await createUser("PATIENT", "patient@dentora.gr")
        session.userId = patient.id

        const { joinLabRole } = await import("@/app/actions/lab-auth")
        const result = await joinLabRole("DENTIST")

        expect(result.ok).toBe(true)
        expect(result.alreadyRegistered).toBe(false)

        const updated = await prisma.user.findUnique({ where: { id: patient.id } })
        expect(updated?.role).toBe("DENTIST")
        expect(
            await prisma.dentistProfile.count({ where: { userId: patient.id } })
        ).toBe(1)
    })

    it("is idempotent", async () => {
        const patient = await createUser("PATIENT", "patient2@dentora.gr")
        session.userId = patient.id

        const { joinLabRole } = await import("@/app/actions/lab-auth")
        await joinLabRole("LAB")
        const second = await joinLabRole("LAB")

        expect(second.alreadyRegistered).toBe(true)
        expect(await prisma.labProfile.count({ where: { userId: patient.id } })).toBe(1)
    })

    it("refuses a role that is not a professional role of the Lab", async () => {
        const patient = await createUser("PATIENT", "patient3@dentora.gr")
        session.userId = patient.id

        const { joinLabRole } = await import("@/app/actions/lab-auth")
        await expect(joinLabRole("ADMIN" as unknown as "DENTIST")).rejects.toMatchObject({
            code: "VALIDATION",
        })

        const updated = await prisma.user.findUnique({ where: { id: patient.id } })
        expect(updated?.role).toBe("PATIENT")
    })

    it("does not change the profession of a professional of the Lab", async () => {
        const designer = await createUser("DESIGNER", "designer2@dentora.gr")
        await prisma.designerProfile.create({
            data: { userId: designer.id, headline: "CAD Designer" },
        })
        session.userId = designer.id

        const { joinLabRole } = await import("@/app/actions/lab-auth")
        await expect(joinLabRole("DENTIST")).rejects.toMatchObject({
            code: "ROLE_LOCKED",
        })

        const updated = await prisma.user.findUnique({ where: { id: designer.id } })
        expect(updated?.role).toBe("DESIGNER")
    })

    it("refuses the admin of the platform", async () => {
        const admin = await createUser("ADMIN", "admin@dentora.gr")
        session.userId = admin.id

        const { joinLabRole } = await import("@/app/actions/lab-auth")
        await expect(joinLabRole("DENTIST")).rejects.toMatchObject({
            code: "FORBIDDEN",
        })
    })

    it("needs a session", async () => {
        session.userId = ""
        const { joinLabRole } = await import("@/app/actions/lab-auth")
        await expect(joinLabRole("DENTIST")).rejects.toMatchObject({
            code: "UNAUTHENTICATED",
        })
    })
})

describe("the permissions of the Lab at runtime", () => {
    beforeEach(async () => {
        await prisma.labCaseFile.deleteMany()
        await prisma.labOffer.deleteMany()
        await prisma.labCase.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.dentistProfile.deleteMany()
        await prisma.user.deleteMany()
    })

    it("does not let a patient create a work", async () => {
        const patient = await createUser("PATIENT", "patient4@dentora.gr")
        session.userId = patient.id

        const { createLabCase } = await import("@/app/actions/lab")
        const formData = new FormData()
        formData.set("type", "Crown")
        formData.set("material", "Zirconia")
        formData.set("description", "Μονοκόρωνη κορώνα")

        await expect(createLabCase(formData)).rejects.toMatchObject({
            code: "FORBIDDEN",
        })
        expect(await prisma.labCase.count()).toBe(0)
    })

    it("lets a dentist create a work", async () => {
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")
        await grantConsents(dentist.id)
        session.userId = dentist.id

        const { createLabCase } = await import("@/app/actions/lab")
        const formData = new FormData()
        formData.set("type", "Crown")
        formData.set("material", "Zirconia")
        formData.set("description", "Μονοκόρωνη κορώνα")

        const created = await createLabCase(formData)
        expect(created.code).toBeTruthy()
        expect(await prisma.labCase.count()).toBe(1)
    })

    it("does not let a patient send an offer", async () => {
        const patient = await createUser("PATIENT", "patient5@dentora.gr")
        const dentist = await createUser("DENTIST", "dentist2@dentora.gr")
        const labCase = await prisma.labCase.create({
            data: {
                code: `LAB-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
                title: "Κορώνα",
                type: "Crown",
                material: "Zirconia",
                description: "Μονοκόρωνη κορώνα",
                customerId: dentist.id,
                customerType: "DENTIST",
            },
        })
        session.userId = patient.id

        const { submitLabOffer } = await import("@/app/actions/lab")
        await expect(
            submitLabOffer({ caseId: labCase.id, price: 100, leadTimeDays: 3 })
        ).rejects.toMatchObject({ code: "FORBIDDEN" })
    })
})
