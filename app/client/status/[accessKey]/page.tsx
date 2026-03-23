import { notFound } from "next/navigation"
import { getJobByAccessKey } from "@/lib/actions/client-view"
import { getActiveTimeLog } from "@/lib/actions/time"
import { LiveStatus } from "@/components/client/LiveStatus"

export default async function ClientStatusPage({ params }: { params: Promise<{ accessKey: string }> }) {
    const { accessKey } = await params
    const job = await getJobByAccessKey(accessKey)

    if (!job) return notFound()

    // Optimization: find active log from job.timeLogs or fetch
    const activeTimeLog = job.timeLogs.find(l => !l.endTime)

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50 selection:bg-primary/30">
            <div className="max-w-4xl mx-auto p-4 md:p-8">
                <LiveStatus job={job} activeTimeLog={activeTimeLog} />
            </div>
        </main>
    )
}
