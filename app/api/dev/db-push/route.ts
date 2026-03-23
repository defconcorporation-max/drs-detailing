import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

/** Désactivé en prod sauf si `ALLOW_DEV_API=true` (évite un db push public). */
function devApiBlocked() {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_API !== 'true') {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return null
}

export async function GET() {
    const blocked = devApiBlocked()
    if (blocked) return blocked
    try {
        console.log("Starting remote prisma db push...")
        // This will sync the Supabase database to match the schema.prisma
        const output = execSync('npx prisma db push --accept-data-loss', { encoding: 'utf-8' })
        console.log("Prisma db push output:", output)
        
        return NextResponse.json({ 
            success: true, 
            message: "Database schema synchronized successfully", 
            output: output.split('\n')
        })
    } catch (error: any) {
        console.error("Prisma db push failed:", error)
        return NextResponse.json({ 
            success: false, 
            message: "Prisma db push failed", 
            error: error.message,
            stderr: error.stderr
        }, { status: 500 })
    }
}
