import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

function devApiBlocked() {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_API !== "true") {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return null
}

export async function GET() {
    const blocked = devApiBlocked()
    if (blocked) return blocked
    try {
        console.log("Starting cache-busting prisma generate...")
        const output = execSync('npx prisma generate', { encoding: 'utf-8' })
        
        return NextResponse.json({ 
            success: true, 
            message: "Prisma FRESH-CLIENT generated successfully", 
            output: output.split('\n')
        })
    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            message: "Prisma generate failed", 
            error: error.message
        }, { status: 500 })
    }
}
