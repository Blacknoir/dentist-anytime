import { LabLoginForm } from "@/components/lab/lab-login-form"

export default function LabLoginPage() {
    // The quick sign-in with an existing account only exists in development.
    const devMode = process.env.NODE_ENV !== "production"

    return (
        <div className="pt-16 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Σύνδεση στο Dentora Lab</h1>
                    <p className="text-gray-600 mt-3">
                        Συνδέσου ως οδοντίατρος, οδοντοτεχνικό εργαστήριο ή CAD designer για να δεις τις εργασίες σου.
                    </p>
                </div>

                <LabLoginForm devMode={devMode} />
            </div>
        </div>
    )
}
