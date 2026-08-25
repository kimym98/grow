import type { Metadata } from "next"
import { DM_Sans, IBM_Plex_Mono, Lora } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/providers/theme-provider"
import { AuthProvider } from "@/providers/auth-provider"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Toaster } from "@/components/ui/sonner"
import { AppShell } from "@/components/layout/app-shell"
import { SITE_CONFIG } from "@/lib/constants"

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
})

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      className={`${dmSans.variable} ${ibmPlexMono.variable} ${lora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppShell>
              <AuthGuard>{children}</AuthGuard>
            </AppShell>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
