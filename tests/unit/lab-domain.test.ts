import { describe, expect, it } from "vitest"
import { computeSplit, euros, formatBytes, formatDate, formatDateTime, redactContactDetails, uploadSizeError } from "@/lib/lab"
import { sanitizeRedirectUrl } from "@/lib/auth-redirect"
import { decryptBuffer, encryptBuffer, isEncryptedPayload, sha256 } from "@/lib/lab-crypto"
import {
    effectiveMaxFileSize,
    getUploadLimits,
    isAllowedUploadKind,
} from "@/lib/lab-uploads"

describe("split of the agreed price", () => {
    it("keeps the platform fee and the payout consistent", () => {
        expect(computeSplit(100)).toEqual({ fee: 10, payout: 90, feeRate: 10 })
        expect(computeSplit(0)).toEqual({ fee: 0, payout: 0, feeRate: 10 })
        // the payout is what is left, the fee is a part of the price
        const split = computeSplit(120)
        expect(split.fee + split.payout).toBeCloseTo(120, 5)
    })
})

describe("euro amounts", () => {
    it("uses the Greek decimal separator", () => {
        const formatted = euros(1234.5)
        expect(formatted).toContain("1.234")
        expect(formatted).toContain(",50")
        expect(formatted).not.toContain("1234.5")
    })

    it("shows whole amounts without decimals", () => {
        expect(euros(120)).not.toContain(",00")
    })
})

describe("dates", () => {
    it("formats in a fixed timezone so that the server and the browser agree", () => {
        const date = new Date("2026-03-01T10:30:00.000Z")
        expect(formatDate(date)).toBe("01 Μαρ 2026")
        expect(formatDateTime(date)).toContain("2026")
        // The same moment must always produce the same string, no matter in
        // which timezone the code runs (this was the hydration error #441).
        expect(formatDate(date)).toBe(formatDate(new Date(date.toISOString())))
        // 23:30 UTC is already the next day in Athens.
        expect(formatDate(new Date("2026-03-01T23:30:00.000Z"))).toBe("02 Μαρ 2026")
    })
})

describe("anonymity of the messages", () => {
    it("removes e-mail addresses and phone numbers", () => {
        const message = "Κάλεσέ με στο 6944 123456 ή στο john@example.com"
        const clean = redactContactDetails(message)
        expect(clean).not.toContain("john@example.com")
        expect(clean).not.toContain("6944 123456")
    })
})

describe("redirect url of the sign-in", () => {
    it("keeps the redirect inside the site", () => {
        expect(sanitizeRedirectUrl("/dashboard", "https://www.dentora.gr")).toBe("/dashboard")
        expect(sanitizeRedirectUrl("https://evil.example.com/x", "https://www.dentora.gr")).toBe(
            "https://www.dentora.gr"
        )
    })

    it("never grows: the nested callback url is removed and the length is capped", () => {
        const nested =
            "https://www.dentora.gr/dashboard?callbackUrl=https%3A%2F%2Fwww.dentora.gr%2Fdashboard%3FcallbackUrl%3Dx"
        const result = sanitizeRedirectUrl(nested, "https://www.dentora.gr")
        expect(result).toBe("/dashboard")
        expect(result.length).toBeLessThanOrEqual(300)
    })

    it("caps a very long redirect", () => {
        const long = `/${"a".repeat(1000)}`
        expect(sanitizeRedirectUrl(long, "https://www.dentora.gr").length).toBeLessThanOrEqual(300)
    })
})

describe("encryption of the files", () => {
    it("round trips a buffer and hides the content", () => {
        const original = Buffer.from("solid crown\n facet normal 0 0 0")
        const encrypted = encryptBuffer(original)
        expect(isEncryptedPayload(encrypted)).toBe(true)
        expect(encrypted.includes(original)).toBe(false)
        expect(decryptBuffer(encrypted).equals(original)).toBe(true)
    })

    it("computes a stable sha256", () => {
        expect(sha256("abc")).toBe(sha256(Buffer.from("abc")))
        expect(sha256("abc")).not.toBe(sha256("abd"))
    })
})

describe("limits of the upload", () => {
    it("accepts a 32 KB STL and reports its size in KB", () => {
        expect(uploadSizeError("small.stl", 32 * 1024, 25 * 1024 * 1024)).toBeNull()
        expect(formatBytes(32 * 1024)).toBe("32.0 KB")
        expect(uploadSizeError("exact-limit.stl", 25 * 1024 * 1024, 25 * 1024 * 1024)).toBeNull()
    })

    it("identifies the actual oversized file and byte count", () => {
        const size = 32 * 1024 * 1024
        const error = uploadSizeError("large.stl", size, 25 * 1024 * 1024)
        expect(error).toContain("large.stl")
        expect(error).toContain("32.0 MB")
        expect(error).toContain(size.toLocaleString("el-GR") + " bytes")
        expect(error).toContain("25.0 MB")
    })

    it("uses the smaller limit when the storage is the database", () => {
        const limits = getUploadLimits()
        expect(limits.chunkSize).toBeGreaterThan(0)
        expect(effectiveMaxFileSize("db")).toBeLessThan(effectiveMaxFileSize("blob"))
        expect(effectiveMaxFileSize("db")).toBe(25 * 1024 * 1024)
    })

    it("only accepts the known file kinds", () => {
        expect(isAllowedUploadKind("INPUT_STL")).toBe(true)
        expect(isAllowedUploadKind("OUTPUT_STL")).toBe(true)
        expect(isAllowedUploadKind("PORTFOLIO")).toBe(true)
        expect(isAllowedUploadKind("SOMETHING_ELSE")).toBe(false)
    })
})
