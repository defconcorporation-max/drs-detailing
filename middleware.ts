import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Admin Protection
    if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
        const adminCookie = request.cookies.get('drs_admin_session')
        if (!adminCookie) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
    }

    // Employee Protection
    if (path.startsWith('/employee') && !path.startsWith('/employee/login')) {
        const employeeCookie = request.cookies.get('drs_employee_session')
        if (!employeeCookie) {
            return NextResponse.redirect(new URL('/employee/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/employee/:path*'],
}
