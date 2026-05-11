import type { Metadata } from "next";
import "./globals.css";
import AdminShell from "@/components/AdminShell";
export const metadata: Metadata={title:"Online Showroom Admin",description:"Vehicle video showroom control panel"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AdminShell>{children}</AdminShell></body></html>}
