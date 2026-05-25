import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LegalConnect NG | Find Trusted Lawyers in Nigeria",
    template: "%s | LegalConnect NG",
  },
  description:
    "Connect with verified legal professionals across Nigeria. Browse profiles, read expert insights, and get the representation you deserve.",
  keywords: [
    "lawyers Nigeria",
    "legal services",
    "find lawyer",
    "legal marketplace",
    "Nigerian lawyers",
    "legal help",
    "law firm",
  ],
  authors: [{ name: "LegalConnect NG" }],
  openGraph: {
    title: "LegalConnect NG | Find Trusted Lawyers in Nigeria",
    description:
      "Connect with verified legal professionals across Nigeria.",
    url: "https://legalconnect.ng",
    siteName: "LegalConnect NG",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LegalConnect NG",
    description:
      "Connect with verified legal professionals across Nigeria.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
