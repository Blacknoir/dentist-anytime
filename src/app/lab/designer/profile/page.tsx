import { redirect } from "next/navigation"
import { getLabActor } from "@/app/actions/lab"
import { getDesignerProfile, getLabProfile } from "@/app/actions/lab-designer"
import { DesignerProfileForm } from "@/components/lab/designer-profile-form"

export const dynamic = "force-dynamic"

export default async function DesignerProfilePage() {
    const actor = await getLabActor()
    if (!actor) redirect("/lab/register")

    const designer = actor.isDesigner ? await getDesignerProfile() : null
    const lab = actor.role === "LAB" ? await getLabProfile() : null

    if (!designer && !lab) redirect("/lab/register")

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
            </div>
        </div>
    )
}
