"use client"

import * as React from "react"
import { Search, MapPin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function SearchBar() {
    const [activeTab, setActiveTab] = React.useState<"doctor" | "service">("doctor")

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab("doctor")}
                    className={cn(
                        "flex-1 py-4 text-sm font-medium transition-colors relative",
                        activeTab === "doctor"
                            ? "text-primary-600 bg-primary-50/50"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                >
                    Find a Dentist
                    {activeTab === "doctor" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("service")}
                    className={cn(
                        "flex-1 py-4 text-sm font-medium transition-colors relative",
                        activeTab === "service"
                            ? "text-primary-600 bg-primary-50/50"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                >
                    Find by Service
                    {activeTab === "service" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                    )}
                </button>
            </div>

            {/* Search Inputs */}
            <div className="p-2 md:p-4 flex flex-col md:flex-row gap-2 md:gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <Input
                        placeholder={
                            activeTab === "doctor"
                                ? "Doctor name, specialty, or condition"
                                : "Treatment (e.g., Whitening, Implants)"
                        }
                        className="pl-10 h-12 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                    />
                </div>

                <div className="flex-1 relative group">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <Input
                        placeholder="City, neighborhood, or zip code"
                        className="pl-10 h-12 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                    />
                </div>

                <div className="md:w-48 relative group hidden md:block">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <Input
                        placeholder="Any date"
                        className="pl-10 h-12 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                    />
                </div>

                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary-500/20">
                    Search
                </Button>
            </div>
        </div>
    )
}
