import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://velltoagenda.vercel.app"),

  title: {
    default: "Vellto | Agenda e Gestão para o seu negócio",
    template: "%s | Vellto",
  },

  description:
    "Agenda online e gestão para barbearias, salões, clínicas e negócios que trabalham com hora marcada. Organize clientes, profissionais, serviços, mensalistas e agendamentos em um só lugar.",

  applicationName: "Vellto",

  keywords: [
    "agenda online",
    "sistema de agendamento",
    "gestão de barbearia",
    "agenda para barbearia",
    "agenda para salão",
    "sistema para salão",
    "gestão de clientes",
    "agendamento online",
    "Vellto",
    "Vellto Agenda",
  ],

  authors: [{ name: "Vellto" }],
  creator: "Vellto",
  publisher: "Vellto",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://velltoagenda.vercel.app",
    siteName: "Vellto",
    title: "Vellto | Agenda e Gestão para o seu negócio",
    description:
      "Tenha agenda online, clientes, profissionais, serviços, mensalistas e gestão do seu negócio em um só lugar.",
  },

  twitter: {
    card: "summary_large_image",
    title: "Vellto | Agenda e Gestão para o seu negócio",
    description:
      "Organize sua agenda, clientes, profissionais e serviços com a Vellto.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
