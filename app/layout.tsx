import type { Metadata } from "next";
import { Oswald, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const oswald = Oswald({
    variable: "--font-oswald",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

const dmSans = DM_Sans({
    variable: "--font-dm-sans",
    subsets: ["latin", "latin-ext"],
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-mono",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "DRS Detailing — Showroom",
    description: "L’atelier numérique : rendez-vous, équipe et finition miroir.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body
                className={`${oswald.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
            >
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                    <div id="showroom-root" className="bg-background text-foreground">
                        {children}
                        <Toaster richColors position="top-center" closeButton theme="system" />
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
