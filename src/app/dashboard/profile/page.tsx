import { getDentistProfile } from "@/app/actions/dashboard"
import { ProfileForm } from "@/components/dashboard/profile-form"

export default async function ProfilePage() {
    const profile = await getDentistProfile()

    if (!profile) {
        return <div>Profile not found.</div>
    }

    return <ProfileForm initialData={profile} />
}
