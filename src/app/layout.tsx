import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LudoStar BD - বাংলাদেশের সেরা লুডো প্ল্যাটফর্ম | Play • Compete • Win",
  description: "রিয়েল প্লেয়ারদের সাথে লুডো ম্যাচ খেলুন ও জিতে নিন আকর্ষণীয় পুরস্কার। দ্রুত ডিপোজিট ও ইনস্ট্যান্ট উইথড্র সুবিধা।",
  keywords: ["LudoStar BD", "Ludo King Tournament", "Ludo Tournament Bangladesh", "Online Ludo Earn", "বিকাশ লুডো গেম"],
  icons: {
    icon: "/newlogo.png",
    shortcut: "/newlogo.png",
    apple: "/newlogo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#030712",
};

import Providers from "@/components/common/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-cyan-400 selection:text-slate-950">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
