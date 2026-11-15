import { LabLoginForm } from "@/components/lab/lab-login-form"
import { getLabActor } from "@/lib/lab-domain"
import { hasRoleProfile } from "@/lib/lab-role-profiles"
import { profileRoleFor } from "@/lib/roles"

export const dynamic = "force-dynamic"

export default async function LabLoginPage() {
    // The quick sign-in with an existing account only exists in development.
    const devMode = process.env.NODE_ENV !== "production"

    // The Lab uses the same account and the same session as the main site.
    const actor = await getLabActor()
    const profileRole = actor ? profileRoleFor(actor.role) : null
    const hasProfile = actor && profileRole ? await hasRoleProfile(actor.userId, profileRole) : false

    return (
        <div className="pt-16 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Σύνδεση στο Dentora Lab</h1>
                    <p className="text-gray-600 mt-3">
                        Συνδέσου ως οδοντίατρος, οδοντοτεχνικό εργαστήριο ή CAD designer για να δεις τις εργασίες σου.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Χρησιμοποιείται ο ίδιος λογαριασμός με την κύρια σελίδα. Ένας λογαριασμός που έχει ήδη
                        επαγγελματικό προφίλ δεν χρειάζεται νέα σύνδεση.
                    </p>
                </div>

                <LabLoginForm
                    devMode={devMode}
                    currentRole={actor?.role ?? null}
                    hasProfile={hasProfile}
                />
            </div>
        </div>
    )
}
