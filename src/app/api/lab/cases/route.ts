import { NextResponse } from "next/server"
import { createLabCase } from "@/app/actions/lab"

// Multipart endpoint so the client can show upload progress for large STL files.
export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const result = await createLabCase(formData)
        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[lab] Case creation failed:", error)
        return NextResponse.json(
            { error: error?.message || "Η δημιουργία της εργασίας απέτυχε." },
            { status: 400 }
        )
    }
}
