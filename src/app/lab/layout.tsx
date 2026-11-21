import { Footer } from "@/components/layout/footer"
import { LabNav } from "@/components/lab/lab-nav"

export default function LabLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <LabNav />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    )
}
