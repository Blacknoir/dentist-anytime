import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const HEADER = Buffer.from("LABENC1")

function getEncryptionKey() {
    const material = process.env.LAB_FILE_ENCRYPTION_KEY || process.env.AUTH_SECRET
    if (!material) throw new Error("LAB_FILE_ENCRYPTION_KEY or AUTH_SECRET is required")
    return crypto.createHash("sha256").update(material).digest()
}

export function encryptBuffer(data: Buffer) {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv)
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([HEADER, iv, tag, encrypted])
}

export function decryptBuffer(payload: Buffer) {
    if (payload.length < HEADER.length + 12 + 16 || !payload.subarray(0, HEADER.length).equals(HEADER)) {
        throw new Error("Το αρχείο δεν είναι κρυπτογραφημένο με το αναμενόμενο μοτίβο.")
    }
    const iv = payload.subarray(HEADER.length, HEADER.length + 12)
    const tag = payload.subarray(HEADER.length + 12, HEADER.length + 28)
    const data = payload.subarray(HEADER.length + 28)
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()])
}

export function isEncryptedPayload(payload: Buffer) {
    return payload.length >= HEADER.length && payload.subarray(0, HEADER.length).equals(HEADER)
}

export function sha256(value: string | Buffer) {
    return crypto.createHash("sha256").update(value).digest("hex")
}

export function signPayload(value: string) {
    const secret = process.env.LAB_EVIDENCE_SECRET || process.env.AUTH_SECRET || ""
    return crypto.createHmac("sha256", secret).update(value).digest("hex")
}

export function verifySignature(value: string, signature: string) {
    const expected = signPayload(value)
    if (expected.length !== signature.length) return false
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export function randomId(prefix: string) {
    return `${prefix}_${crypto.randomBytes(9).toString("hex").toUpperCase()}`
}

export function randomToken(bytes = 16) {
    return crypto.randomBytes(bytes).toString("hex")
}
