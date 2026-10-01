import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Przedszkole Pickup",
    template: "%s · Przedszkole Pickup",
  },
  description:
    "Zarządzanie odbiorem i zaprowadzaniem dziecka do przedszkola i na zajęcia dodatkowe – dostępność rodziny, plan dnia, dopasowanie osób i powiadomienia push.",
};

export const viewport: Viewport = {
  themeColor: "#1b6ef5",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
