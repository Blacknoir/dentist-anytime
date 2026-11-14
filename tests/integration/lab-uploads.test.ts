import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/prisma"
import { sha256 } from "@/lib/lab-crypto"

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

async function createCase(status = "ASSIGNED") {
    const customer = await prisma.user.create({
        data: { email: `customer-${Math.random()}@dentora.gr`, name: "Customer", role: "DENTIST" },
    })
    const designerUser = await prisma.user.create({
        data: { email: `designer-${Math.random()}@dentora.gr`, name: "Designer", role: "DESIGNER" },
    })
    const designer = await prisma.designerProfile.create({
        data: { userId: designerUser.id, headline: "CAD Designer" },
    })
    const labCase = await prisma.labCase.create({
        data: {
            code: `LAB-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
            title: "Κορώνα",
            type: "Crown",
            material: "Zirconia",
            description: "Μονοκόρωνη κορώνα",
            customerId: customer.id,
            customerType: "DENTIST",
            status,
            assignedDesignerId: designer.id,
        },
    })
    return { customer, designerUser, designer, labCase }
}

/** An ASCII STL file. */
function stl(name = "crown") {
    return Buffer.from(
        `solid ${name}\nfacet normal 0 0 0\n  outer loop\n    vertex 0 0 0\n    vertex 1 0 0\n    vertex 0 1 0\n  endloop\nendfacet\nendsolid ${name}\n`
    )
}

describe("the chunked upload", () => {
    beforeEach(async () => {
        await prisma.labUploadChunk.deleteMany()
        await prisma.labUploadSession.deleteMany()
        await prisma.labCaseFile.deleteMany()
        await prisma.labCase.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.user.deleteMany()
    })

    it("stores a file after the chunks and verifies the checksum", async () => {
        const { customer, labCase } = await createCase()
        session.userId = customer.id

        const { createUploadSession, appendUploadChunk, completeUploadSession } = await import(
            "@/lib/lab-uploads"
        )

        const body = stl()
        const created = await createUploadSession({
            userId: customer.id,
            caseId: labCase.id,
            fileName: "scan.stl",
            fileSize: body.length,
            mimeType: "model/stl",
            kind: "INPUT_STL",
        })

        expect(created.chunkSize).toBeGreaterThan(0)

        await appendUploadChunk({
            sessionId: created.sessionId,
            userId: customer.id,
            index: 0,
            data: body,
        })

        const completed = await completeUploadSession({
            sessionId: created.sessionId,
            userId: customer.id,
            checksum: sha256(body),
            uploaderRole: "CUSTOMER",
            kind: "INPUT_STL",
            caseId: labCase.id,
        })

        expect(completed.fileId).toBeTruthy()

        const file = await prisma.labCaseFile.findUnique({ where: { id: completed.fileId } })
        expect(file?.fileName).toBe("scan.stl")
        expect(file?.storageProvider).toBe("db")
        expect(file?.content).toBeTruthy()

        // the stored content is encrypted and decrypts to the original file
        const { readLabFile } = await import("@/lib/lab-storage")
        const read = await readLabFile(
            file!.storagePath,
            file!.storageProvider as "blob" | "local" | "db",
            file!.id
        )
        expect(sha256(read.body)).toBe(sha256(body))
    })

    it("rejects an incomplete upload", async () => {
        const { customer, labCase } = await createCase()
        session.userId = customer.id

        const { createUploadSession, completeUploadSession } = await import("@/lib/lab-uploads")

        const body = stl("big")
        const created = await createUploadSession({
            userId: customer.id,
            caseId: labCase.id,
            fileName: "big.stl",
            fileSize: body.length,
            mimeType: "model/stl",
            kind: "INPUT_STL",
        })

        await expect(
            completeUploadSession({
                sessionId: created.sessionId,
                userId: customer.id,
                checksum: sha256(body),
                uploaderRole: "CUSTOMER",
                kind: "INPUT_STL",
                caseId: labCase.id,
            })
        ).rejects.toMatchObject({ code: "INCOMPLETE" })
    })

    it("rejects a file whose checksum does not match", async () => {
        const { customer, labCase } = await createCase()
        session.userId = customer.id

        const { createUploadSession, appendUploadChunk, completeUploadSession } = await import(
            "@/lib/lab-uploads"
        )

        const body = stl()
        const created = await createUploadSession({
            userId: customer.id,
            caseId: labCase.id,
            fileName: "scan.stl",
            fileSize: body.length,
            mimeType: "model/stl",
            kind: "INPUT_STL",
        })

        await appendUploadChunk({
            sessionId: created.sessionId,
            userId: customer.id,
            index: 0,
            data: body,
        })

        await expect(
            completeUploadSession({
                sessionId: created.sessionId,
                userId: customer.id,
                checksum: sha256(Buffer.from("something else")),
                uploaderRole: "CUSTOMER",
                kind: "INPUT_STL",
                caseId: labCase.id,
            })
        ).rejects.toMatchObject({ code: "CHECKSUM_MISMATCH" })

        // the file was not stored
        expect(await prisma.labCaseFile.count({ where: { caseId: labCase.id } })).toBe(0)
    })

    it("refuses a chunk of another user", async () => {
        const { customer, labCase } = await createCase()
        session.userId = customer.id

        const { createUploadSession, appendUploadChunk } = await import("@/lib/lab-uploads")

        const body = stl()
        const created = await createUploadSession({
            userId: customer.id,
            caseId: labCase.id,
            fileName: "scan.stl",
            fileSize: body.length,
            mimeType: "model/stl",
            kind: "INPUT_STL",
        })

        await expect(
            appendUploadChunk({
                sessionId: created.sessionId,
                userId: "another-user",
                index: 0,
                data: body,
            })
        ).rejects.toMatchObject({ code: "FORBIDDEN" })
    })

    it("refuses an empty file and a file that is too big", async () => {
        const { customer, labCase } = await createCase()
        session.userId = customer.id

        const { createUploadSession } = await import("@/lib/lab-uploads")

        await expect(
            createUploadSession({
                userId: customer.id,
                caseId: labCase.id,
                fileName: "empty.stl",
                fileSize: 0,
                kind: "INPUT_STL",
            })
        ).rejects.toMatchObject({ code: "VALIDATION" })

        await expect(
            createUploadSession({
                userId: customer.id,
                caseId: labCase.id,
                fileName: "huge.stl",
                fileSize: 500 * 1024 * 1024,
                kind: "INPUT_STL",
            })
        ).rejects.toMatchObject({ code: "FILE_TOO_LARGE" })
    })
})

describe("the deliverable of the designer", () => {
    beforeEach(async () => {
        await prisma.labUploadChunk.deleteMany()
        await prisma.labUploadSession.deleteMany()
        await prisma.labCaseFile.deleteMany()
        await prisma.labCase.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.user.deleteMany()
    })

    it("moves the work to delivered only when a file was really stored", async () => {
        const { designerUser, labCase } = await createCase("ASSIGNED")
        session.userId = designerUser.id

        const { uploadDesignerFiles } = await import("@/app/actions/lab")

        // no file at all: the work must not be marked as delivered
        const empty = new FormData()
        await expect(uploadDesignerFiles(labCase.id, empty)).rejects.toMatchObject({
            code: "NO_FILE_STORED",
        })

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.status).toBe("ASSIGNED")
    })

    it("does not let the customer deliver the files of the work", async () => {
        const { customer, labCase } = await createCase("ASSIGNED")
        session.userId = customer.id

        const { uploadDesignerFiles } = await import("@/app/actions/lab")

        const formData = new FormData()
        formData.append("kind", "OUTPUT_STL")
        formData.append(
            "files",
            new File([stl()], "deliverable.stl", { type: "model/stl" })
        )

        await expect(uploadDesignerFiles(labCase.id, formData)).rejects.toMatchObject({
            code: "FORBIDDEN",
        })
    })

    it("does not let a designer deliver files for a work of another designer", async () => {
        const { labCase } = await createCase("ASSIGNED")
        const otherDesigner = await prisma.user.create({
            data: { email: "other-designer@dentora.gr", name: "Other", role: "DESIGNER" },
        })
        await prisma.designerProfile.create({
            data: { userId: otherDesigner.id, headline: "CAD Designer" },
        })
        session.userId = otherDesigner.id

        const { uploadDesignerFiles } = await import("@/app/actions/lab")

        const formData = new FormData()
        formData.append("kind", "OUTPUT_STL")
        formData.append(
            "files",
            new File([stl()], "deliverable.stl", { type: "model/stl" })
        )

        await expect(uploadDesignerFiles(labCase.id, formData)).rejects.toMatchObject({
            code: "FORBIDDEN",
        })
    })
})
