import "./globals.css";
import Header from "@/components/Header";

export const metadata = { title: "The Vision" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="km">
      <body className="bg-white text-gray-900">
        <Header />
        {children}
      </body>
    </html>
  );
}
