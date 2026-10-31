import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'VoiceExpression — Multimodal Live Conversation Assistant (PS16)',
  description: 'Accessible AI communication platform for individuals with speech impairments associated with ALS, cerebral palsy, Parkinson\'s, stroke, or laryngectomy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased selection:bg-[#6651E8] selection:text-white bg-[#F8F9FC] dark:bg-[#0F172A] text-[#172554] dark:text-[#F8FAFC]">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1" id="main-content">
            {children}
          </main>
          <Footer />
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
