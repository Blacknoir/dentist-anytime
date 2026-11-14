import { redirect } from "next/navigation"
import { getLabActor } from "@/app/actions/lab"
import { getDesignerProfile, getLabProfile } from "@/app/actions/lab-designer"
import { listOwnPortfolio } from "@/app/actions/lab-portfolio"
import { DesignerProfileForm } from "@/components/lab/designer-profile-form"
import { PortfolioManager } from "@/components/lab/portfolio-manager"

export const dynamic = "force-dynamic"

export default async function DesignerProfilePage() {
    const actor = await getLabActor()
    if (!actor) redirect("/lab/register")

    const designer = actor.isDesigner ? await getDesignerProfile() : null
    const lab = actor.role === "LAB" ? await getLabProfile() : null

    if (!designer && !lab) redirect("/lab/register")

    const ownerType = designer ? ("DESIGNER" as const) : ("LAB" as const)
    const portfolioItems = await listOwnPortfolio(ownerType)

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-900">Το προφίλ μου</h1>
                <p className="text-gray-600 mt-1">
                    Αυτό το προφίλ βλέπουν οι πελάτες στο Dentora Lab.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    Στο marketplace εμφανίζεσαι ως{" "}
                    <strong className="text-gray-900">
                        {actor.role === "LAB" ? "Οδοντοτεχνικό εργαστήριο" : "CAD Designer"}
                    </strong>{" "}
                    — τα στοιχεία επικοινωνίας σου παραμένουν κρυφά από τους πελάτες και οι συμφωνίες γίνονται
                    μόνο μέσω της πλατφόρμας.
                </p>

                <DesignerProfileForm
                    designer={
                        designer
                            ? {
                                  headline: designer.headline,
                                  bio: designer.bio || "",
                                  city: designer.city || "",
                                  services: designer.services.map((service) => ({
                                      id: service.id,
                                      name: service.name,
                                      description: service.description || "",
                                      price: service.price,
                                      leadTimeDays: service.leadTimeDays,
                                      minUnits: service.minUnits,
                                  })),
                              }
                            : null
                    }
                    lab={
                        lab
                            ? {
                                  labName: lab.labName,
                                  city: lab.city || "",
                                  about: lab.about || "",
                                  equipment: lab.equipment,
                                  materials: lab.materials,
                              }
                            : null
                    }
                />

                {ownerType && (
                    <section className="mt-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Portfolio</h2>
                        <p className="text-sm text-gray-600 mb-5">
                            Δημόσιες εικόνες από τις εργασίες σου. Οι φωτογραφίες των πελατών δεν
                            δημοσιεύονται ποτέ.
                        </p>
                        <PortfolioManager ownerType={ownerType} items={portfolioItems} />
                    </section>
                )}
            </div>
        </div>
    )
}
