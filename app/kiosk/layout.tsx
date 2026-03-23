import { Inter, Oswald } from "next/font/google"
import "@/app/globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" })

export const metadata = {
    title: "DRS Kiosk — Arrivée Client",
    description: "Self-service check-in for DRS Detailing clients.",
}

export default function KioskLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="fr" className="dark">
            <body className={`${inter.variable} ${oswald.variable} font-sans bg-black antialiased`}>
                <main className="min-h-screen overflow-hidden">
                    {children}
                </main>
            </body>
        </html>
    )
}
