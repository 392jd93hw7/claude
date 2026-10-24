import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qwen Chat",
  description: "A private web chat interface powered by an OpenAI-compatible Ollama endpoint."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
