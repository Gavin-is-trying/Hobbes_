import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSections } from "../lib/content";
import { SiteShell } from "../components/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Hobbes — Operational knowledge", template: "%s | Hobbes" },
  description: "The shared home for Hobbes principles, processes, and operational knowledge.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><SiteShell sections={getSections()}>{children}</SiteShell></body></html>;
}
