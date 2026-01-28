import { DashboardShell } from "@/components/dashboard/sidebar-shell"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    return (
        <DashboardShell role={(session.user as any).role} userName={session.user?.name}>
            {children}
        </DashboardShell>
    )
}
