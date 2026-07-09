import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
});

const SITE_URL = "https://www.radarstock.cl";
const SITE_TITLE = "RadarStock — Predicción de inventario para PYMEs";
const SITE_DESCRIPTION =
  "RadarStock predice quiebres de stock y sobre-stock para PYMEs chilenas. Sube un CSV y en minutos tienes tu radar de inventario funcionando, sin ERP.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — RadarStock",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "predicción de inventario",
    "quiebre de stock",
    "gestión de inventario PYME",
    "predicción de demanda Chile",
    "software de inventario sin ERP",
    "reposición de stock",
  ],
  authors: [{ name: "RadarStock" }],
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: SITE_URL,
    siteName: "RadarStock",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RadarStock — Predicción de inventario para PYMEs chilenas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} font-body bg-navy text-text-high antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
