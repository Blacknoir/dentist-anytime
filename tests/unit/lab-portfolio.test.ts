import { describe, expect, it } from "vitest"
import {
    MAX_PORTFOLIO_IMAGE_BYTES,
    readImageDimensions,
    sniffImageType,
    validatePortfolioImage,
} from "@/lib/lab-portfolio"

/** A minimal valid PNG (1x1, transparent). */
function pngBytes(width = 1, height = 1) {
    const header = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // signature
        0x00, 0x00, 0x00, 0x0d, // length of the IHDR chunk
        0x49, 0x48, 0x44, 0x52, // "IHDR"
    ])
    const size = Buffer.alloc(8)
    size.writeUInt32BE(width, 0)
    size.writeUInt32BE(height, 4)
    return Buffer.concat([header, size, Buffer.alloc(16)])
}

/** A minimal JPEG header with the dimensions of the SOF0 marker. */
function jpegBytes(width = 800, height = 600) {
    // APP0 segment (JFIF) with its payload
    const app0 = Buffer.concat([
        Buffer.from([0xff, 0xe0, 0x00, 0x10]),
        Buffer.from("JFIF\0", "ascii"),
        Buffer.alloc(8),
    ])
    const sof = Buffer.from([
        0xff, 0xc0, 0x00, 0x11, 0x08, // marker + length + precision
        (height >> 8) & 0xff, height & 0xff, // height
        (width >> 8) & 0xff, width & 0xff, // width
        0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    ])
    return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof])
}

describe("the type of the image", () => {
    it("is read from the magic bytes and not from the name", () => {
        expect(sniffImageType(pngBytes())?.contentType).toBe("image/png")
        expect(sniffImageType(jpegBytes())?.contentType).toBe("image/jpeg")
        // a file that only pretends to be an image
        expect(sniffImageType(Buffer.from("<?php echo 'x'; ?>"))).toBeNull()
    })

    it("reads the dimensions of a PNG and of a JPEG", () => {
        expect(readImageDimensions(pngBytes(1024, 768), "image/png")).toEqual({
            width: 1024,
            height: 768,
        })
        expect(readImageDimensions(jpegBytes(800, 600), "image/jpeg")).toEqual({
            width: 800,
            height: 600,
        })
    })
})

describe("the validation of a portfolio image", () => {
    it("accepts a real image", () => {
        const result = validatePortfolioImage(jpegBytes(1200, 900))
        expect(result.contentType).toBe("image/jpeg")
        expect(result.dimensions).toEqual({ width: 1200, height: 900 })
    })

    it("refuses a file that is not an image", () => {
        expect(() => validatePortfolioImage(Buffer.from("not an image at all"))).toThrowError(
            /έγκυρη εικόνα/
        )
    })

    it("refuses an empty file", () => {
        expect(() => validatePortfolioImage(Buffer.alloc(0))).toThrowError(/κενή/)
    })

    it("refuses an image that is too small", () => {
        expect(() => validatePortfolioImage(pngBytes(100, 100))).toThrowError(/πολύ μικρή/)
    })

    it("refuses an image that is too large", () => {
        expect(() => validatePortfolioImage(Buffer.alloc(MAX_PORTFOLIO_IMAGE_BYTES + 1))).toThrowError(
            /ξεπερνά/
        )
    })
})
