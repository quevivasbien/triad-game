import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import TriadLogo from "@/components/triad-logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Triad Game",
  description: "The competitive pattern-finding game",
};

function MobileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger><Menu /></DropdownMenuTrigger>
      <DropdownMenuContent className="shadow-sm rounded-none border-t-0 border-l border-r-0 border-b">
        <div className="flex flex-col p-4 gap-2 text-center">
          <Link className="text-lg sm:text-xl hover:text-muted" href="/learn">Learn</Link>
          <DropdownMenuSeparator />
          <Link className="text-lg sm:text-xl hover:text-muted" href="/high-scores">High Scores</Link>
          <DropdownMenuSeparator />
          <Link className="text-lg sm:text-xl hover:text-muted" href="/">Play</Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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
                    <div className="text-xl sm:text-3xl font-semibold">Triad</div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12">
                      <TriadLogo color="gray" />
                    </div>
                  </Link>
                  <div className="hidden sm:flex flex-row gap-8">
                    <Link className="text-lg sm:text-xl hover:text-muted whitespace-nowrap" href="/learn">Learn</Link>
                    <Link className="text-lg sm:text-xl hover:text-muted whitespace-nowrap" href="/high-scores">High Scores</Link>
                    <Link className="text-lg sm:text-xl hover:text-muted whitespace-nowrap" href="/">Play</Link>
                  </div>
                  <div className="sm:hidden">
                    <MobileMenu />
                  </div>
                </div>
              </nav>
              <div className="w-full py-4 px-6 sm:p-8 md:p-12 max-w-5xl">
                {children}
              </div>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
