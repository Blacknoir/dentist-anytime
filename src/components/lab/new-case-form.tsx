"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { AlertCircle, CheckCircle2, FileUp, Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MATERIALS, PRIORITIES, SHADES, WORK_TYPES } from "@/lib/lab"
import { cn } from "@/lib/utils"

const MAX_SIZE_MB = 120

export default function NewCaseForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { data: session, status } = useSession()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState({
        type: WORK_TYPES[0] as string,
        material: MATERIALS[0] as string,
        shade: SHADES[0] as string,
        units: 1,
        priority: "STANDARD",
        deadline: "",
        title: "",
        description: "",
    })
    const [files, setFiles] = useState<File[]>([])
    const [progress, setProgress] = useState(0)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState<string | null>(null)

    const designerId = useMemo(() => searchParams.get("designer") || "", [searchParams])

    const isCustomer = (session?.user as any)?.role === "DENTIST" || (session?.user as any)?.role === "LAB"

    const update = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }))

    const handleFiles = (list: FileList | null) => {
        if (!list) return
        const next = Array.from(list)
        const tooBig = next.find((file) => file.size > MAX_SIZE_MB * 1024 * 1024)
        if (tooBig) {
            setError(`Το αρχείο ${tooBig.name} ξεπερνά τα ${MAX_SIZE_MB}MB.`)
            return
        }
        setError(null)
        setFiles(next)
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        if (!session?.user?.id) {
            setError("Πρέπει να είσαι συνδεδεμένος για να δημιουργήσεις εργασία.")
            return
        }
        if (!form.description.trim()) {
            setError("Περιέγραψε την εργασία.")
            return
        }

        const body = new FormData()
        body.append("type", form.type)
        body.append("material", form.material)
        body.append("shade", form.shade)
        body.append("units", String(form.units))
        body.append("priority", form.priority)
        body.append("deadline", form.deadline)
        body.append("title", form.title)
        body.append("description", form.description)
        if (designerId) body.append("designerId", designerId)
        files.forEach((file) => body.append("files", file))

        setUploading(true)
        setError(null)
        setProgress(0)

        const request = new XMLHttpRequest()
        request.open("POST", "/api/lab/cases")

        request.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                setProgress(Math.round((event.loaded / event.total) * 100))
            }
        }

        request.onload = () => {
            setUploading(false)
            if (request.status >= 200 && request.status < 300) {
                const payload = JSON.parse(request.responseText || "{}")
                setDone(payload.code || "OK")
            } else {
                try {
                    const payload = JSON.parse(request.responseText || "{}")
                    setError(payload.error || "Η δημιουργία της εργασίας απέτυχε.")
                } catch {
                    setError("Η δημιουργία της εργασίας απέτυχε.")
                }
            }
        }

        request.onerror = () => {
            setUploading(false)
            setError("Η σύνδεση διακόπηκε. Δοκίμασε ξανά.")
        }

        request.send(body)
    }

    if (status === "loading") {
        return (
            <div className="pt-24 pb-20 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
        )
    }

    if (!session?.user?.id) {
        return (
            <div className="pt-24 pb-20 container mx-auto px-4 max-w-xl text-center space-y-4">
                <h1 className="text-2xl font-bold text-gray-900">Πρέπει να είσαι συνδεδεμένος</h1>
                <p className="text-gray-600">
                    Για να δημιουργήσεις εργασία CAD χρειάζεται λογαριασμό οδοντίατρου ή εργαστηρίου.
                </p>
                <Button asChild>
                    <Link href="/lab/register">Εγγραφή / σύνδεση</Link>
                </Button>
            </div>
        )
    }

    if (!isCustomer) {
        return (
            <div className="pt-24 pb-20 container mx-auto px-4 max-w-xl text-center space-y-4">
                <h1 className="text-2xl font-bold text-gray-900">Λάθος ρόλος</h1>
                <p className="text-gray-600">
                    Ο λογαριασμός σου είναι {String((session.user as any)?.role).toLowerCase()}. Οι εργασίες τις
                    δημιουργούν οδοντίατρες και εργαστήρια.
                </p>
                <Button asChild>
                    <Link href="/lab">Πίσω στο Dentora Lab</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-900">Νέα εργαστηριακή εργασία</h1>
                <p className="text-gray-600 mt-2">
                    Ανέβασε τη σάρωση και τις οδηγίες σχεδιασμού. Οι designers θα δουν την εργασία και θα σου
                    στείλουν προσφορές.
                </p>

                {done ? (
                    <Card className="mt-8 border-green-200 bg-green-50">
                        <CardContent className="p-8 text-center space-y-4">
                            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Η εργασία δημιουργήθηκε</h2>
                                <p className="text-gray-600 mt-1">Κωδικός εργασίας: {done}</p>
                            </div>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <Button onClick={() => router.push("/lab/cases")}>Οι εργασίες μου</Button>
                                <Button variant="outline" onClick={() => router.push("/lab/cases?scope=open")}>
                                    Δες τις ανοιχτές εργασίες
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Στοιχεία εργασίας</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="type">Είδος εργασίας</Label>
                                        <select
                                            id="type"
                                            value={form.type}
                                            onChange={(e) => update("type", e.target.value)}
                                            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                                        >
                                            {WORK_TYPES.map((item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="material">Υλικό</Label>
                                        <select
                                            id="material"
                                            value={form.material}
                                            onChange={(e) => update("material", e.target.value)}
                                            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                                        >
                                            {MATERIALS.map((item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="shade">Απόχρωση</Label>
                                        <select
                                            id="shade"
                                            value={form.shade}
                                            onChange={(e) => update("shade", e.target.value)}
                                            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                                        >
                                            {SHADES.map((item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="units">Τεμάχια</Label>
                                        <Input
                                            id="units"
                                            type="number"
                                            min={1}
                                            value={form.units}
                                            onChange={(e) => update("units", Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="priority">Προτεραιότητα</Label>
                                        <select
                                            id="priority"
                                            value={form.priority}
                                            onChange={(e) => update("priority", e.target.value)}
                                            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                                        >
                                            {PRIORITIES.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="deadline">Απαιτούμενη παράδοση</Label>
                                        <Input
                                            id="deadline"
                                            type="date"
                                            value={form.deadline}
                                            onChange={(e) => update("deadline", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="title">Τίτλος (προαιρετικό)</Label>
                                    <Input
                                        id="title"
                                        placeholder="π.χ. Στεφάνη #26 για τον ασθενή Ν. Α."
                                        value={form.title}
                                        onChange={(e) => update("title", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="description">Περιγραφή & οδηγίες σχεδιασμού</Label>
                                    <Textarea
                                        id="description"
                                        rows={6}
                                        placeholder="Περιγράψε τι χρειάζεται: π.χ. στεφάνη #26, chamfer, αντίπαλο άθικτο, ζυγοστάθμιση σε σκάν."
                                        value={form.description}
                                        onChange={(e) => update("description", e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileUp className="h-4 w-4" /> Αρχεία (STL, οδηγίες, φωτογραφίες)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".stl,.obj,.3mf,.zip,.step,.stp,.pdf,.jpg,.jpeg,.png,.dcm,.txt,.doc,.docx"
                                    onChange={(e) => handleFiles(e.target.files)}
                                    className="hidden"
                                />
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center transition-colors hover:border-primary-300 hover:bg-primary-50/40",
                                        files.length > 0 && "border-primary-300 bg-primary-50/40"
                                    )}
                                >
                                    <Upload className="h-6 w-6 mx-auto text-primary-600" />
                                    <p className="text-sm font-medium text-gray-700 mt-2">
                                        {files.length > 0
                                            ? `${files.length} αρχεία επιλεγμένα — κάνε κλικ για αλλαγή`
                                            : "Κάνε κλικ για να επιλέξεις αρχεία"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        STL, OBJ, 3MF, ZIP, STEP, PDF, JPG, PNG (έως {MAX_SIZE_MB}MB ανά αρχείο)
                                    </p>
                                </div>

                                {files.length > 0 && (
                                    <div className="space-y-2">
                                        {files.map((file, index) => (
                                            <div
                                                key={`${file.name}-${index}`}
                                                className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm"
                                            >
                                                <span className="truncate">{file.name}</span>
                                                <span className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-400">
                                                        {(file.size / 1024 / 1024).toFixed(1)} MB
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setFiles((prev) => prev.filter((_, i) => i !== index))
                                                        }
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {error && (
                            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        {uploading && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Αποστολή αρχείων…</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-500 transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" asChild>
                                <Link href="/lab/cases">Ακύρωση</Link>
                            </Button>
                            <Button type="submit" disabled={uploading}>
                                {uploading ? "Αποστολή…" : "Δημιούργησε εργασία"}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
