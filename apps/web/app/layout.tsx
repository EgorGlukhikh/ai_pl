import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "AI PL Story Generator",
  description: "Functional MVP",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

