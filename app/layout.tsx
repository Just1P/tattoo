import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import localFont from "next/font/local";
import "./globals.css";

const jaguar = localFont({
  src: "../public/fonts/Jaguar.otf",
  variable: "--font-jaguar",
  display: "swap",
});

const switzer = localFont({
  src: [
    { path: "../public/fonts/Switzer-Regular.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/Switzer-Semibold.otf", weight: "600", style: "normal" },
  ],
  variable: "--font-switzer",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Tattoo Pro",
  description: "Trouvez votre tatoueur idéal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${jaguar.variable} ${switzer.variable}`}>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
