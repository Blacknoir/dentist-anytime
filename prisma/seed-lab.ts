/**
 * Demo data for the Dentora Lab marketplace.
 *
 * Creates a realistic scenario (dentist + CAD designer + lab, a case with real
 * STL files, an accepted offer, a revision request, approvals and the required
 * GDPR consents) so the lab can be tested end to end with real data.
 *
 * Usage: npm run seed:lab
 * The script is idempotent: re-running it recreates only the demo case.
 */

import "./load-env"
import { prisma } from "../src/lib/prisma"
import { storeLabFile } from "../src/lib/lab-storage"
import { randomId, sha256 } from "../src/lib/lab-crypto"
import { LAB_LEGAL_DOCUMENTS } from "../src/lib/lab-legal"

const DEMO_DENTIST_EMAIL = "dentist@demo.dentora.gr"
const DEMO_DESIGNER_EMAIL = "designer@demo.dentora.gr"
const DEMO_LAB_EMAIL = "lab@demo.dentora.gr"

type Vec = [number, number, number]

function cross(a: Vec, b: Vec): Vec {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function normalize(v: Vec): Vec {
    const length = Math.hypot(v[0], v[1], v[2]) || 1
    return [v[0] / length, v[1] / length, v[2] / length]
}

function facet(a: Vec, b: Vec, c: Vec): string {
    const normal = normalize(cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]]))
    const format = (v: number) => v.toFixed(6)
    return `  facet normal ${format(normal[0])} ${format(normal[1])} ${format(normal[2])}\n    outer loop\n      vertex ${format(a[0])} ${format(a[1])} ${format(a[2])}\n      vertex ${format(b[0])} ${format(b[1])} ${format(b[2])}\n      vertex ${format(c[0])} ${format(c[1])} ${format(c[2])}\n    endloop\n  endfacet\n`
}

/**
 * Builds a closed solid of revolution that approximates a dental crown:
 * a rounded profile with occlusal anatomy on top.
 */
function buildCrownStl(options: { segments: number; height: number; radius: number; grooves: boolean; name: string }) {
    const { segments, height, radius, grooves, name } = options
    const profile: { r: number; z: number }[] = [
        { r: radius * 0.62, z: 0 },
        { r: radius * 0.86, z: height * 0.12 },
        { r: radius * 0.97, z: height * 0.32 },
        { r: radius, z: height * 0.55 },
        { r: radius * 0.96, z: height * 0.74 },
        { r: radius * 0.86, z: height * 0.88 },
        { r: radius * 0.7, z: height * 0.96 },
        { r: radius * 0.34, z: height },
    ]

    const vertices: Vec[][] = profile.map((ring, ringIndex) => {
        const points: Vec[] = []
        for (let segment = 0; segment < segments; segment += 1) {
            const angle = (segment / segments) * Math.PI * 2
            const wave = grooves ? 1 + 0.06 * Math.sin(segment * 2.5) * (ringIndex / profile.length) : 1
            const r = ring.r * wave
            points.push([Math.cos(angle) * r, Math.sin(angle) * r, ring.z])
        }
        return points
    })

    let stl = `solid ${name}\n`

    // Side walls
    for (let ringIndex = 0; ringIndex < vertices.length - 1; ringIndex += 1) {
        const lower = vertices[ringIndex]
        const upper = vertices[ringIndex + 1]
        for (let segment = 0; segment < segments; segment += 1) {
            const next = (segment + 1) % segments
            stl += facet(lower[segment], lower[next], upper[next])
            stl += facet(lower[segment], upper[next], upper[segment])
        }
    }

    // Bottom cap
    const bottomCentre: Vec = [0, 0, 0]
    for (let segment = 0; segment < segments; segment += 1) {
        const next = (segment + 1) % segments
        stl += facet(bottomCentre, vertices[0][next], vertices[0][segment])
    }

    // Top cap
    const topCentre: Vec = [0, 0, height]
    const top = vertices[vertices.length - 1]
    for (let segment = 0; segment < segments; segment += 1) {
        const next = (segment + 1) % segments
        stl += facet(topCentre, top[segment], top[next])
    }

    stl += `endsolid ${name}\n`
    return Buffer.from(stl, "utf8")
}

const INSTRUCTION_TEXT = `ΟΔΗΓΙΕΣ ΠΑΡΑΓΩΓΗΣ - Μονοκόρωνη κορώνα ζιρκονίας #26

Υλικό: Ζιρκονία (3Y-TZP), σκιά A2
Προετοιμασία: Φαντακιακό μέγεθος 20, φύλλο 0.5mm
Ψηφιακό σύστημα: 3Shape

1. Έλεγχος margin line και εξομάλυνση 0.3mm.
2. Αποφυγή υπερχείλισης: occlusal clearance 1.5mm σε σύγκλιση.
3. Καμπύλες επαφής: ελαχιστή ακτίνα 3mm στην περιοχή επαφής.
4. Χρώμα: A2, translucency 2 (αυξημένη).
5. Έλεγχος μοντέλου σε articulator, επαλήθευση επαφών.

Παρακαλώ επιστρέψτε το τελικό STL μαζί με ένα PDF render για έλεγχο.
`

async function upsertUser(email: string, name: string, role: string) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        await prisma.user.update({
            where: { email },
            data: { name, role, publicCode: existing.publicCode || (await nextPublicCode(role)) },
        })
        return prisma.user.findUniqueOrThrow({ where: { email } })
    }
    return prisma.user.create({
        data: { email, name, role, publicCode: await nextPublicCode(role) },
    })
}

/** Generates the next free anonymous marketplace code for a role. */
async function nextPublicCode(role: string) {
    const prefix = role === "DENTIST" ? "DN" : role === "LAB" ? "LB" : role === "DESIGNER" ? "CD" : "PT"
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`
        const existing = await prisma.user.findUnique({
            where: { publicCode: code },
            select: { id: true },
        })
        if (!existing) return code
    }
    return `${prefix}-${Date.now().toString().slice(-4)}`
}

async function ensureLegalDocuments() {
    for (const definition of LAB_LEGAL_DOCUMENTS) {
        await prisma.legalDocument.upsert({
            where: { key_version: { key: definition.key, version: definition.version } },
            update: { body: definition.body, title: definition.title, contentHash: sha256(definition.body) },
            create: {
                key: definition.key,
                title: definition.title,
                version: definition.version,
                body: definition.body,
                contentHash: sha256(definition.body),
                isRequired: true,
            },
        })
    }
}

async function ensureConsents(userId: string) {
    const documents = await prisma.legalDocument.findMany()
    for (const document of documents) {
        const existing = await prisma.documentConsent.findFirst({
            where: {
                userId,
                documentKey: document.key,
                documentVersion: document.version,
                documentHash: document.contentHash,
                scope: "LAB",
            },
        })
        if (existing) continue

        await prisma.documentConsent.create({
            data: {
                evidenceId: randomId("EV"),
                userId,
                documentKey: document.key,
                documentVersion: document.version,
                documentHash: document.contentHash,
                scope: "LAB",
                ipAddress: "127.0.0.1",
                userAgent: "dentora-seed-script",
            },
        })
    }
}

async function main() {
    console.log("Seeding lab demo data...")

    const dentist = await upsertUser(DEMO_DENTIST_EMAIL, "Δρ. Μαρία Παπαδοπούλου", "DENTIST")
    const designerUser = await upsertUser(DEMO_DESIGNER_EMAIL, "Νίκος Αθανασίου · CAD Studio", "DESIGNER")
    const labUser = await upsertUser(DEMO_LAB_EMAIL, "Οδοντοτεχνικό Εργαστήριο Αιγαίου", "LAB")
    await upsertUser("admin@dentistanytime.com", "Platform Admin", "ADMIN")

    await prisma.dentistProfile.upsert({
        where: { userId: dentist.id },
        update: {
            specialty: "Προσθετική",
            location: "Αθήνα",
            city: "Αθήνα",
            experienceYears: 12,
            about: "Οδοντίατρος προσθετικός με ειδικότητα στην ψηφιακή προσθετική και τις ψηφιακές αποτυπώσεις.",
            priceFrom: 60,
            isVerified: true,
        },
        create: {
            userId: dentist.id,
            specialty: "Προσθετική",
            location: "Αθήνα",
            city: "Αθήνα",
            experienceYears: 12,
            about: "Οδοντίατρος προσθετικός με ειδικότητα στην ψηφιακή προσθετική και τις ψηφιακές αποτυπώσεις.",
            priceFrom: 60,
            isVerified: true,
        },
    })

    const designer = await prisma.designerProfile.upsert({
        where: { userId: designerUser.id },
        update: {
            headline: "CAD designer για κορώνες & γέφυρες ζιρκονίας",
            bio: "12 χρόνια εμπειρία σε ψηφιακό σχεδιασμό οδοντικών κατασκευών. Δουλεύω με 3Shape, exocad και Blender.",
            city: "Αθήνα",
            country: "GR",
            isVerified: true,
            rating: 4.9,
            reviewCount: 37,
            completedCases: 128,
            avgLeadTimeDays: 3,
        },
        create: {
            userId: designerUser.id,
            headline: "CAD designer για κορώνες & γέφυρες ζιρκονίας",
            bio: "12 χρόνια εμπειρία σε ψηφιακό σχεδιασμό οδοντικών κατασκευών. Δουλεύω με 3Shape, exocad και Blender.",
            city: "Αθήνα",
            country: "GR",
            isVerified: true,
            rating: 4.9,
            reviewCount: 37,
            completedCases: 128,
            avgLeadTimeDays: 3,
        },
    })

    await prisma.designerService.deleteMany({ where: { designerProfileId: designer.id } })
    await prisma.designerService.createMany({
        data: [
            {
                designerProfileId: designer.id,
                name: "Μονοκόρωνη κορώνα ζιρκονίας",
                description: "CAD design για μονοκόρωνη κορώνα από ψηφιακή αποτύπωση, με margin check.",
                price: 120,
                leadTimeDays: 3,
            },
            {
                designerProfileId: designer.id,
                name: "Τριγωνη γέφυρα ζιρκονίας (3 μονάδες)",
                description: "Γέφυρα 3 μονάδων με anatomically shaped φύλλα.",
                price: 340,
                leadTimeDays: 5,
            },
            {
                designerProfileId: designer.id,
                name: "Night guard (splaint)",
                description: "Προστατευτικό νυχτέριο σε δύο χρώματα.",
                price: 90,
                leadTimeDays: 2,
            },
        ],
    })

    await prisma.labProfile.upsert({
        where: { userId: labUser.id },
        update: {
            labName: "Οδοντοτεχνικό Εργαστήριο Αιγαίου",
            city: "Θεσσαλονίκη",
            about: "Ψηφιακό εργαστήριο με scanner, φρέζα 5 αξόνων και σύστημα υπαγωγής ζιρκονίας.",
            equipment: ["Scanner 3Shape", "Φρέζα 5 αξόνων", "Κάψιμο ζιρκονίας"],
            materials: ["Ζιρκονία", "IPS e.max", "Μέταλλο"],
            isVerified: true,
        },
        create: {
            userId: labUser.id,
            labName: "Οδοντοτεχνικό Εργαστήριο Αιγαίου",
            city: "Θεσσαλονίκη",
            about: "Ψηφιακό εργαστήριο με scanner, φρέζα 5 αξόνων και σύστημα υπαγωγής ζιρκονίας.",
            equipment: ["Scanner 3Shape", "Φρέζα 5 αξόνων", "Κάψιμο ζιρκονίας"],
            materials: ["Ζιρκονία", "IPS e.max", "Μέταλλο"],
            isVerified: true,
        },
    })

    await ensureLegalDocuments()
    for (const user of [dentist, designerUser, labUser]) {
        await ensureConsents(user.id)
    }

    // Recreate the demo case so the script can be re-run safely.
    const previous = await prisma.labCase.findMany({
        where: { customerId: dentist.id },
        select: { id: true, files: { select: { id: true, storagePath: true, storageProvider: true } } },
    })
    for (const item of previous) {
        for (const file of item.files) {
            const { deleteLabFile } = await import("../src/lib/lab-storage")
            await deleteLabFile(file.storagePath, file.storageProvider as "blob" | "local")
        }
    }
    await prisma.labCase.deleteMany({ where: { customerId: dentist.id } })

    const code = `LAB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`
    const labCase = await prisma.labCase.create({
        data: {
            code,
            title: "Μονοκόρωνη κορώνα ζιρκονίας #26",
            type: "Crown",
            material: "Zirconia",
            shade: "A2",
            units: 1,
            description:
                "Μονοκόρωνη κορώνα για το δόντι 26. Αποτύπωση scanner, margin line καθαρή, ζητείται translucency 2 και αποφυγή υπερχείλισης στην ουραία επαφή.",
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            priority: "EXPRESS",
            status: "IN_PRODUCTION",
            customerId: dentist.id,
            customerType: "DENTIST",
            assignedDesignerId: designer.id,
            agreedPrice: 120,
            platformFee: 12,
            designerPayout: 108,
            paymentStatus: "HELD",
        },
    })

    const scan = buildCrownStl({ segments: 48, height: 9, radius: 5.2, grooves: false, name: "scan_26" })
    const design = buildCrownStl({ segments: 56, height: 11, radius: 5.8, grooves: true, name: "crown_26_final" })

    const scanFile = await storeLabFile({ caseId: labCase.id, fileName: "scan_26.stl", body: scan })
    const instructionFile = await storeLabFile({
        caseId: labCase.id,
        fileName: "instructions_26.txt",
        body: Buffer.from(INSTRUCTION_TEXT, "utf8"),
        contentType: "text/plain",
    })
    const designFile = await storeLabFile({ caseId: labCase.id, fileName: "crown_26_final.stl", body: design })

    await prisma.labCaseFile.createMany({
        data: [
            {
                caseId: labCase.id,
                kind: "INPUT_STL",
                fileName: "scan_26.stl",
                fileSize: scan.length,
                mimeType: "model/stl",
                storagePath: scanFile.storagePath,
                storageProvider: scanFile.storageProvider,
                uploadedById: dentist.id,
                uploaderRole: "CUSTOMER",
            },
            {
                caseId: labCase.id,
                kind: "INPUT_INSTRUCTION",
                fileName: "instructions_26.txt",
                fileSize: Buffer.byteLength(INSTRUCTION_TEXT),
                mimeType: "text/plain",
                storagePath: instructionFile.storagePath,
                storageProvider: instructionFile.storageProvider,
                uploadedById: dentist.id,
                uploaderRole: "CUSTOMER",
            },
            {
                caseId: labCase.id,
                kind: "OUTPUT_STL",
                fileName: "crown_26_final.stl",
                fileSize: design.length,
                mimeType: "model/stl",
                storagePath: designFile.storagePath,
                storageProvider: designFile.storageProvider,
                uploadedById: designerUser.id,
                uploaderRole: "DESIGNER",
            },
        ],
    })

    await prisma.labOffer.create({
        data: {
            caseId: labCase.id,
            designerProfileId: designer.id,
            price: 120,
            leadTimeDays: 3,
            message:
                "Καλημέρα, δέχομαι την εργασία. Θα στείλω το design σε 24 ώρες με margin check και έλεγχο επαφών σε articulator.",
            status: "ACCEPTED",
        },
    })

    await prisma.caseRevision.create({
        data: {
            caseId: labCase.id,
            designerProfileId: designer.id,
            requestedById: dentist.id,
            message: "Παρακαλώ τσίμπησε λίγο τη γλώσσα στην ουραία πλευρά, φαίνεται επαφή στη βαση.",
            status: "DELIVERED",
            resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
    })

    await prisma.verificationRequest.deleteMany({ where: { userId: { in: [dentist.id, designerUser.id] } } })
    await prisma.verificationRequest.createMany({
        data: [
            {
                userId: dentist.id,
                subjectType: "DENTIST",
                status: "APPROVED",
                documentName: "Άδεια ασκήσεως",
                reviewNotes: "Επαλήθευση Αριθμού Μητρώου Οδοντιάτρων.",
                reviewedById: (await prisma.user.findUnique({ where: { email: "admin@dentistanytime.com" } }))!.id,
                reviewedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            },
            {
                userId: designerUser.id,
                subjectType: "DESIGNER",
                status: "APPROVED",
                documentName: "Πτυχίο CAD / portfolio",
                reviewNotes: "Επιβεβαίωση portfolio και εμπειρίας σε ψηφιακό σχεδιασμό.",
                reviewedById: (await prisma.user.findUnique({ where: { email: "admin@dentistanytime.com" } }))!.id,
                reviewedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            },
        ],
    })

    await prisma.auditEvent.create({
        data: {
            actorUserId: dentist.id,
            action: "CASE_CREATED",
            entity: "LabCase",
            entityId: labCase.id,
            metadata: JSON.stringify({ code, seed: true }),
            ipAddress: "127.0.0.1",
            userAgent: "dentora-seed-script",
        },
    })

    console.log(
        JSON.stringify(
            {
                case: { id: labCase.id, code, files: 3 },
                accounts: [DEMO_DENTIST_EMAIL, DEMO_DESIGNER_EMAIL, DEMO_LAB_EMAIL],
                password: "dentora-dev (dev only)",
            },
            null,
            2
        )
    )
}

main()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
