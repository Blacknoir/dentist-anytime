import { afterAll, beforeAll, vi } from "vitest"
import { prisma } from "@/lib/prisma"

// The session of next-auth cannot run outside of a request. The tests that
// need a session mock the module themselves.
vi.mock("@/auth", () => ({
    auth: async () => null,
    handlers: {},
    signIn: async () => undefined,
    signOut: async () => undefined,
}))

// Every test starts with an empty database and leaves it empty again.
beforeAll(async () => {
    await prisma.labWebhookEvent.deleteMany()
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
    await prisma.labProfile.deleteMany()
    await prisma.account.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()
})

afterAll(async () => {
    await prisma.labWebhookEvent.deleteMany()
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
    await prisma.labProfile.deleteMany()
    await prisma.account.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
})
