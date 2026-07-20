import type { Metadata, Viewport } from "next";
import { Newsreader } from "next/font/google";
import "@/styles/globals.css";
import ServiceWorker from "@/components/ui/ServiceWorker";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NextAct",
  description:
    "A private space to turn a lifetime of judgment into a living legacy.",
  applicationName: "NextAct",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "NextAct",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAFAF8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={newsreader.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body style={{ background: "#FAFAF8" }}>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
