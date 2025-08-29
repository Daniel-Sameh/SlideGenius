import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RootClientWrapper } from "@/components/RootClientWrapper";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SlideGenius",
  description: "AI-Powered Markdown to Presentation Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RootClientWrapper>
          {children}
          <Toaster />
        </RootClientWrapper>
      </body>
    </html>
  );
}
