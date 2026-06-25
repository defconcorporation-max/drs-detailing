export const dynamic = "force-dynamic"

import { CrmChat } from "@/components/admin/CrmChat"

export default function AdminChatPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl font-bold tracking-tight uppercase md:text-4xl">
                    Messagerie <span className="text-gradient-brand">SMS</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Gérez et répondez en temps réel aux SMS de vos clients en mode CRM (Twilio).
                </p>
            </div>

            <CrmChat />
        </div>
    )
}
