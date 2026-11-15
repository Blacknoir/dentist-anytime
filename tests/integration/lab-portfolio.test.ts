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

async function createDesigner(email: string) {
    const user = await prisma.user.create({
        data: { email, name: email, role: "DESIGNER" },
    })
    const profile = await prisma.designerProfile.create({
        data: { userId: user.id, headline: "CAD Designer" },
    })
    return { user, profile }
}

async function createLab(email: string) {
    const user = await prisma.user.create({
        data: { email, name: email, role: "LAB" },
    })
    const profile = await prisma.labProfile.create({
        data: { userId: user.id, labName: "Εργαστήριο" },
    })
    return { user, profile }
}

async function createUser(role: string, email: string) {
    return prisma.user.create({
        data: { email, name: email, role },
    })
}

describe("the portfolio of a designer", () => {
    beforeEach(async () => {
        await prisma.portfolioItem.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.labProfile.deleteMany()
        await prisma.user.deleteMany()
    })

    it("stores an image and shows it in the list of the owner", async () => {
        const { user, profile } = await createDesigner("designer@dentora.gr")
        session.userId = user.id

        const { listOwnPortfolio, updatePortfolioItem, setPortfolioCover, reorderPortfolioItems } =
            await import("@/app/actions/lab-portfolio")

        const item = await prisma.portfolioItem.create({
            data: {
                ownerType: "DESIGNER",
                designerProfileId: profile.id,
                title: "Κορώνα ζιρκονίας",
                description: "Πρώτη δουλειά",
                category: "Κορώνες",
                fileName: "crown.jpg",
                mimeType: "image/jpeg",
                fileSize: 1000,
                storagePath: "pending",
                storageProvider: "db",
            },
        })

        const list = await listOwnPortfolio("DESIGNER")
        expect(list).toHaveLength(1)
        expect(list[0].id).toBe(item.id)

        await updatePortfolioItem({
            id: item.id,
            title: "Κορώνα ζιρκονίας A2",
            description: "Με επεξεργασία ορθοδοντικής επιφάνειας",
            category: "Κορώνες",
        })

        const updated = await prisma.portfolioItem.findUnique({ where: { id: item.id } })
        expect(updated?.title).toBe("Κορώνα ζιρκονίας A2")
        expect(updated?.description).toContain("ορθοδοντικής")

        // only one cover image
        const second = await prisma.portfolioItem.create({
            data: {
                ownerType: "DESIGNER",
                designerProfileId: profile.id,
                title: "Εμφύτεμα",
                fileName: "implant.jpg",
                mimeType: "image/jpeg",
                fileSize: 900,
                storagePath: "pending",
                storageProvider: "db",
            },
        })

        await setPortfolioCover(second.id)
        const covers = await prisma.portfolioItem.count({
            where: { designerProfileId: profile.id, isCover: true },
        })
        expect(covers).toBe(1)

        // the order can be changed
        await reorderPortfolioItems({ ownerType: "DESIGNER", ids: [second.id, item.id] })
        const ordered = await listOwnPortfolio("DESIGNER")
        expect(ordered[0].id).toBe(second.id)
    })

    it("does not let another user change an item", async () => {
        const { profile } = await createDesigner("designer@dentora.gr")
        const other = await createDesigner("other@dentora.gr")
        session.userId = other.user.id

        const { updatePortfolioItem, deletePortfolioItem, setPortfolioCover } = await import(
            "@/app/actions/lab-portfolio"
        )

        const item = await prisma.portfolioItem.create({
            data: {
                ownerType: "DESIGNER",
                designerProfileId: profile.id,
                title: "Κορώνα",
                fileName: "crown.jpg",
                mimeType: "image/jpeg",
                fileSize: 1000,
                storagePath: "pending",
                storageProvider: "db",
            },
        })

        await expect(updatePortfolioItem({ id: item.id, title: "Κλοπή" })).rejects.toMatchObject({
            code: "FORBIDDEN",
        })
        await expect(deletePortfolioItem(item.id)).rejects.toMatchObject({ code: "FORBIDDEN" })
        await expect(setPortfolioCover(item.id)).rejects.toMatchObject({ code: "FORBIDDEN" })

        // nothing changed
        const unchanged = await prisma.portfolioItem.findUnique({ where: { id: item.id } })
        expect(unchanged?.title).toBe("Κορώνα")
    })

    it("validates the texts of an item", async () => {
        const { user, profile } = await createDesigner("designer@dentora.gr")
        session.userId = user.id

        const { updatePortfolioItem } = await import("@/app/actions/lab-portfolio")

        const item = await prisma.portfolioItem.create({
            data: {
                ownerType: "DESIGNER",
                designerProfileId: profile.id,
                title: "Κορώνα",
                fileName: "crown.jpg",
                mimeType: "image/jpeg",
                fileSize: 1000,
                storagePath: "pending",
                storageProvider: "db",
            },
        })

        await expect(updatePortfolioItem({ id: item.id, title: "  " })).rejects.toMatchObject({
            code: "VALIDATION",
        })
        await expect(
            updatePortfolioItem({ id: item.id, title: "x".repeat(200) })
        ).rejects.toMatchObject({ code: "VALIDATION" })
        await expect(
            updatePortfolioItem({ id: item.id, category: "Κάτι άγνωστο" })
        ).rejects.toMatchObject({ code: "VALIDATION" })
    })

    it("keeps the portfolio of a lab separate from the one of a designer", async () => {
        const designer = await createDesigner("designer@dentora.gr")
        const lab = await createLab("lab@dentora.gr")

        await prisma.portfolioItem.create({
            data: {
                ownerType: "DESIGNER",
                designerProfileId: designer.profile.id,
                title: "Σχέδιο",
                fileName: "a.jpg",
                mimeType: "image/jpeg",
                fileSize: 100,
                storagePath: "pending",
                storageProvider: "db",
            },
        })
        await prisma.portfolioItem.create({
            data: {
                ownerType: "LAB",
                labProfileId: lab.profile.id,
                title: "Εργαστήριο",
                fileName: "b.jpg",
                mimeType: "image/jpeg",
                fileSize: 100,
                storagePath: "pending",
                storageProvider: "db",
            },
        })

        session.userId = lab.user.id
        const { listOwnPortfolio } = await import("@/app/actions/lab-portfolio")
        const labItems = await listOwnPortfolio("LAB")
        expect(labItems).toHaveLength(1)
        expect(labItems[0].title).toBe("Εργαστήριο")
    })

    it("serves the image of a portfolio item in the public profile", async () => {
        const { profile } = await createDesigner("designer@dentora.gr")
        const content = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])

        const item = await prisma.portfolioItem.create({
            data: {
                ownerType: "DESIGNER",
                designerProfileId: profile.id,
                title: "Κορώνα ζιρκονίας",
                category: "Κορώνες",
                fileName: "crown.jpg",
                mimeType: "image/jpeg",
                fileSize: content.length,
                width: 800,
                height: 600,
                storagePath: "db:test-item",
                storageProvider: "db",
                content,
            },
        })

        const { GET } = await import("@/app/api/lab/portfolio/[id]/image/route")
        const res = await GET(new Request("https://www.dentora.gr/"), {
            params: Promise.resolve({ id: item.id }),
        })

        expect(res.status).toBe(200)
        expect(res.headers.get("content-type")).toBe("image/jpeg")
        const body = Buffer.from(await res.arrayBuffer())
        expect(body.equals(content)).toBe(true)
    })

    it("never publishes the private files of a work", async () => {
        const { user } = await createDesigner("designer@dentora.gr")
        const dentist = await createUser("DENTIST", "dentist@dentora.gr")

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

        await prisma.labCaseFile.create({
            data: {
                caseId: labCase.id,
                kind: "OUTPUT_STL",
                fileName: "crown_final.stl",
                fileSize: 1234,
                storagePath: "db:secret-file",
                storageProvider: "db",
                uploadedById: user.id,
                uploaderRole: "DESIGNER",
                content: Buffer.from("private stl data"),
            },
        })

        session.userId = user.id
        const { listOwnPortfolio } = await import("@/app/actions/lab-portfolio")
        const items = await listOwnPortfolio("DESIGNER")

        // The file of the work is not part of the portfolio.
        expect(items).toHaveLength(0)
        expect(
            await prisma.portfolioItem.count({ where: { fileName: "crown_final.stl" } })
        ).toBe(0)

        // The private file is not served by the public route of the portfolio.
        const { GET } = await import("@/app/api/lab/portfolio/[id]/image/route")
        const file = await prisma.labCaseFile.findFirstOrThrow()
        const res = await GET(new Request("https://www.dentora.gr/"), {
            params: Promise.resolve({ id: file.id }),
        })
        expect(res.status).toBe(404)
    })
})
