import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Online Showroom Admin", description: "Vehicle video showroom control panel" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
