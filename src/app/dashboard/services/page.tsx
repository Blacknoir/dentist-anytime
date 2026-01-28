import { getDentistProfile } from "@/app/actions/dashboard"
import { ServicesForm } from "@/components/dashboard/services-form"

export default async function ServicesPage() {
    const profile = await getDentistProfile()

    if (!profile) {
        return <div>Profile not found.</div>
    }

    return <ServicesForm initialData={profile.services} />
}
