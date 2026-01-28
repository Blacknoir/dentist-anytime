import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { getDentistById } from "@/app/actions/dentists"
import { ProfileClient } from "./profile-client"
import { notFound } from "next/navigation"

export default async function DentistProfilePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const dentist = await getDentistById(id)

    if (!dentist) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <ProfileClient dentist={dentist} />
            <Footer />
        </div>
    )
}
