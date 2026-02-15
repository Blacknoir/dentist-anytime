"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, RefreshCw } from "lucide-react"

export default function FixAuthPage() {
    const [status, setStatus] = useState("Ready to clean...")

    const clearAllCookies = () => {
        const cookies = document.cookie.split(";")
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i]
            const eqPos = cookie.indexOf("=")
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;"
        }
        localStorage.clear()
        sessionStorage.clear()
        setStatus("Cookies and Storage cleared! Please refresh.")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Fix Connection (431)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-center text-gray-500 text-sm">
                        This tool will forcefully clear all local data and cookies that cause the "HTTP 431" error.
                    </p>

                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 font-medium text-center">
                        {status}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={clearAllCookies}
                            className="w-full h-12 text-lg font-bold"
                        >
                            <RefreshCw className="mr-2 h-5 w-5" /> Clear & Reset
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/'}
                            className="w-full"
                        >
                            Back to Home
                        </Button>
                    </div>

                    <p className="text-[10px] text-center text-gray-400">
                        Tip: If this fails, try opening <span className="font-mono bg-gray-100 px-1">127.0.0.1:3000</span> instead of <span className="font-mono bg-gray-100 px-1">localhost:3000</span>.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
