import { getDentistProfile } from "@/app/actions/dashboard"
import { AvailabilityForm } from "@/components/dashboard/availability-form"

export default async function AvailabilityPage() {
    const profile = await getDentistProfile()

    if (!profile) {
        return <div>Profile not found.</div>
    }

    return <AvailabilityForm initialData={profile.availability} />
}
