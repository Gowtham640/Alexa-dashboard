import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthWrapper from './components/AuthWrapper';
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AlexaVerse 2.0',
  description: 'Dashboard for AlexaVerse 2.0 events',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthWrapper>
          <main className="min-h-screen">{children}</main>
        </AuthWrapper>
        <Toaster position="top-center" reverseOrder={false} />
      </body>
    </html>
  );
}
