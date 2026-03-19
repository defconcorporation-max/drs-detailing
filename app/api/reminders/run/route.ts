import { runReminderDispatch } from "@/lib/actions/notifications"

export async function POST(request: Request) {
    const auth = request.headers.get("authorization") || ""
    const token = auth.replace("Bearer ", "").trim()
    const secret = process.env.CRON_SECRET

    if (!secret || token !== secret) {
        return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const result = await runReminderDispatch()
    return Response.json(result, { status: result.success ? 200 : 207 })
}

