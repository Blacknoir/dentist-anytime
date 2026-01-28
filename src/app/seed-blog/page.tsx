"use client"

import { seedBlogPosts } from "@/app/actions/seed"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function SeedPage() {
    const [status, setStatus] = useState("")

    const handleSeed = async () => {
        setStatus("Seeding...")
        try {
            const res = await seedBlogPosts()
            if (res.success) {
                setStatus(`Success! Seeded ${res.count} posts.`)
            } else {
                setStatus(`Error: ${res.error}`)
            }
        } catch (err: any) {
            setStatus(`Error: ${err.message}`)
        }
    }

    return (
        <div className="p-20 text-center">
            <h1 className="mb-10 text-2xl font-bold">Seed Blog Posts</h1>
            <Button onClick={handleSeed}>Run Seed</Button>
            <p className="mt-5">{status}</p>
        </div>
    )
}
