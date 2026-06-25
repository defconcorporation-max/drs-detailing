import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const twiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial>+14506024805</Dial>
</Response>`

    return new NextResponse(twiML, {
        status: 200,
        headers: { "Content-Type": "text/xml" }
    })
}

export async function GET(req: NextRequest) {
    const twiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial>+14506024805</Dial>
</Response>`

    return new NextResponse(twiML, {
        status: 200,
        headers: { "Content-Type": "text/xml" }
    })
}
