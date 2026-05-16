export const dynamic = "force-dynamic"

import { getJobById } from "@/lib/actions/jobs"
import { JobPageClient } from "@/components/admin/JobPageClient"
import { notFound } from "next/navigation"

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const job = await getJobById(id)

    if (!job) notFound()

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <JobPageClient job={job} />
        </div>
    )
}
