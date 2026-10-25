import Link from "next/link"
import { redirect } from "next/navigation"
import { Activity, FileClock, ShieldCheck, Trash2, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    listAuditEvents,
    listDeletionRequests,
    listFileAccessLogs,
    listVerificationRequests,
} from "@/app/actions/lab-compliance"
import { getLabActor } from "@/app/actions/lab"
import {
    ExecuteDeletionButton,
    IncidentStatusSelect,
    ReviewVerificationButtons,
} from "@/components/lab/admin-actions"
import { formatDateTime } from "@/lib/lab"

export const dynamic = "force-dynamic"

export default async function LabAdminPage() {
    const actor = await getLabActor()
    if (!actor?.isAdmin) redirect("/lab/legal")

    const [verifications, accessLogs, auditEvents, deletions] = await Promise.all([
        listVerificationRequests(),
        listFileAccessLogs({ limit: 60 }),
        listAuditEvents(60),
        listDeletionRequests(),
    ])

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                <h1 className="text-3xl font-bold text-gray-900">Διαχείριση συμμόρφωσης</h1>
                <p className="text-gray-600 mt-1">
                    Επαληθευση επαγγέλματος, καταγραφές πρόσβασης, αρχείο ελέγχου, περιστατικά ασφαλείας και
                    αιτήματα διαγραφής.
                </p>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" /> Αιτήσεις επαλήθευσης ({verifications.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {verifications.length === 0 && (
                            <p className="text-sm text-gray-500">Δεν υπάρχουν αιτήσεις επαλήθευσης.</p>
                        )}
                        {verifications.map((request) => (
                            <div
                                key={request.id}
                                className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 text-sm">
                                        {request.user.name || request.user.email} ·{" "}
                                        <span className="text-gray-500">{request.subjectType}</span>
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {request.documentName || "χωρίς παραστατικό"} ·{" "}
                                        {formatDateTime(request.createdAt)} · {request.status}
                                    </p>
                                    {request.notes && (
                                        <p className="text-xs text-gray-600 mt-1">{request.notes}</p>
                                    )}
                                </div>
                                {request.status === "PENDING" && (
                                    <ReviewVerificationButtons requestId={request.id} />
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileClock className="h-4 w-4" /> Καταγραφές πρόσβασης αρχείων
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                            {accessLogs.length === 0 && (
                                <p className="text-sm text-gray-500">Δεν υπάρχουν καταγραφές.</p>
                            )}
                            {accessLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs"
                                >
                                    <span className="min-w-0">
                                        <span
                                            className={`font-bold ${
                                                log.outcome === "DENIED" ? "text-red-600" : "text-green-700"
                                            }`}
                                        >
                                            {log.action}
                                        </span>{" "}
                                        <span className="text-gray-500">
                                            {log.userId?.slice(0, 8) || "—"} · {log.ipAddress || "—"}
                                        </span>
                                    </span>
                                    <span className="text-gray-400 shrink-0">
                                        {formatDateTime(log.createdAt)}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Activity className="h-4 w-4" /> Αρχείο ελέγχου
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                            {auditEvents.length === 0 && (
                                <p className="text-sm text-gray-500">Δεν υπάρχουν συμβάντα ελέγχου.</p>
                            )}
                            {auditEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs"
                                >
                                    <span className="min-w-0">
                                        <span className="font-bold text-gray-700">{event.action}</span>{" "}
                                        <span className="text-gray-500">{event.entity}</span>
                                    </span>
                                    <span className="text-gray-400 shrink-0">
                                        {formatDateTime(event.createdAt)}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Trash2 className="h-4 w-4" /> Αιτήματα διαγραφής ({deletions.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {deletions.length === 0 && (
                            <p className="text-sm text-gray-500">Δεν υπάρχουν αιτήματα διαγραφής.</p>
                        )}
                        {deletions.map((request) => (
                            <div
                                key={request.id}
                                className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 text-sm">
                                        {request.user.name || request.user.email}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {request.scope} · {formatDateTime(request.requestedAt)} · {request.status}
                                    </p>
                                    {request.report && (
                                        <p className="text-xs text-gray-600 mt-1">{request.report}</p>
                                    )}
                                </div>
                                {request.status !== "COMPLETED" && (
                                    <ExecuteDeletionButton requestId={request.id} />
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Περιστατικά ασφαλείας
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-gray-500">
                            Η διαχείριση των περιστατικών γίνεται από το δημόσιο αρχείο στη σελίδα{" "}
                            <Link href="/lab/security" className="text-primary-700 underline">
                                ασφαλείας
                            </Link>
                            .
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
