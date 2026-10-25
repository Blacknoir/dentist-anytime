import crypto from "crypto"

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

export function generateBase32Secret(length = 20) {
    const bytes = crypto.randomBytes(length)
    let output = ""
    let bits = 0
    let value = 0

    for (const byte of bytes) {
        value = (value << 8) | byte
        bits += 8
        while (bits >= 5) {
            output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
            bits -= 5
        }
    }
    if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
    return output
}

function base32Decode(input: string) {
    const cleaned = input.replace(/=+$/, "").toUpperCase().replace(/\s/g, "")
    let bits = 0
    let value = 0
    const bytes: number[] = []

    for (const char of cleaned) {
        const index = BASE32_ALPHABET.indexOf(char)
        if (index === -1) continue
        value = (value << 5) | index
        bits += 5
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 255)
            bits -= 8
        }
    }
    return Buffer.from(bytes)
}

export function generateTotp(secret: string, counter: number) {
    const key = base32Decode(secret)
    const buffer = Buffer.alloc(8)
    buffer.writeBigUInt64BE(BigInt(counter))
    const digest = crypto.createHmac("sha1", key).update(buffer).digest()
    const offset = digest[digest.length - 1] & 0x0f
    const code =
        ((digest[offset] & 0x7f) << 24) |
        ((digest[offset + 1] & 0xff) << 16) |
        ((digest[offset + 2] & 0xff) << 8) |
        (digest[offset + 3] & 0xff)
    return String(code % 1000000).padStart(6, "0")
}

export function verifyTotp(secret: string, token: string, window = 1) {
    const cleaned = (token || "").replace(/\s/g, "")
    if (!/^\d{6}$/.test(cleaned)) return false
    const counter = Math.floor(Date.now() / 1000 / 30)
    for (let drift = -window; drift <= window; drift++) {
        if (generateTotp(secret, counter + drift) === cleaned) return true
    }
    return false
}

export function buildOtpAuthUrl(issuer: string, email: string, secret: string) {
    const label = encodeURIComponent(`${issuer}:${email}`)
    return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}

export function generateRecoveryCodes(count = 6) {
    const codes: string[] = []
    for (let index = 0; index < count; index++) {
        codes.push(crypto.randomBytes(5).toString("hex").toUpperCase())
    }
    return codes
}
