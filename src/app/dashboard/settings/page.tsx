import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Manage your account settings and preferences.</p>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Email Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>New Bookings</Label>
                            <p className="text-sm text-gray-500">Receive an email when a new patient books an appointment.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                        <div className="space-y-0.5">
                            <Label>Reminders</Label>
                            <p className="text-sm text-gray-500">Receive reminders about upcoming appointments.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-red-600">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Delete Account</Label>
                            <p className="text-sm text-gray-500">Permanently delete your account and all data. This action cannot be undone.</p>
                        </div>
                        <Button variant="destructive">Delete Account</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
