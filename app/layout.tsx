import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import TriadLogo from "@/components/triad-logo";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Triad Game",
  description: "The competitive pattern-finding game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col gap-2 sm:gap-8 items-center">
              <nav className="w-full flex justify-center py-4 border-b border-b-foreground/10">
                <div className="flex flex-row justify-between items-center w-full mx-12 sm:w-1/2 gap-12">
                  <Link className="flex flex-row gap-2 items-center" href="/">
                    <div className="text-xl sm:text-3xl">Triad</div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12">
                      <TriadLogo color="gray" />
                    </div>
                  </Link>
                  <div className="flex flex-row gap-8">
                    <Link className="text-lg sm:text-xl hover:text-muted" href="/learn">Learn</Link>
                    <Link className="text-lg sm:text-xl hover:text-muted" href="/high-scores">High Scores</Link>
                    <Link className="text-lg sm:text-xl hover:text-muted" href="/">Play</Link>
                  </div>
                </div>
              </nav>
              <div className="flex flex-col gap-4 max-w-5xl p-5">
                {children}
              </div>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
