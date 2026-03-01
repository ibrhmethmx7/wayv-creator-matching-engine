import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/components/TRPCProvider";
import { Sidebar } from "@/components/Sidebar";
import { SelectionProvider } from "@/context/SelectionContext";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Wayv - Creator Matching",
  description: "Campaign-to-creator matching engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body>
        <TRPCProvider>
          <SelectionProvider>
            <div className="app-shell">
              <Sidebar />
              <main className="app-main">
                <div className="content-wrap">{children}</div>
              </main>
            </div>
          </SelectionProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}

