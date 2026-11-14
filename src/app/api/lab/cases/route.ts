import { NextResponse } from "next/server"
import { createLabCase } from "@/app/actions/lab"

// Endpoint that creates a work.
//
// Two ways are supported:
//  - application/json: the work is created and the files are uploaded
//    afterwards in chunks (the path used by the form, because a single
//    request cannot carry a big STL).
//  - multipart/form-data: the work and its files arrive in one request (kept
//    for small files and for API clients).
export async function POST(request: Request) {
    try {
        const contentType = request.headers.get("content-type") || ""

        if (contentType.includes("application/json")) {
            const body = await request.json()
            const formData = new FormData()
            for (const [key, value] of Object.entries(body ?? {})) {
                if (value === null || value === undefined) continue
                formData.append(key, String(value))
            }
            const result = await createLabCase(formData)
            return NextResponse.json(result)
        }

        const formData = await request.formData()
        const result = await createLabCase(formData)
        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[lab] Case creation failed:", error)
        return NextResponse.json(
            { error: error?.message || "Η δημιουργία της εργασίας απέτυχε." },
            { status: error?.status || 400 }
        )
    }
}
