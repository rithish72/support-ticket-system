import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const font = Schibsted_Grotesk({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "SupportDesk | Ticket Management",
  description: "Raise support tickets, track their status and talk to the support team.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${font.className} min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
