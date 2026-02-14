import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "AI PL Story Generator",
  description: "Functional MVP",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <script async src="https://telegram.org/js/telegram-widget.js?22"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}

