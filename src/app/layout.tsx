import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/components/providers/ReduxProvider';
import { Header } from '@/components/layout/Header';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Support Ticket Dashboard | Freeflow Desk',
  description:
    'A high-performance support dashboard for support agents to manage tickets, review AI decisions, and stay ahead of SLAs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-violet-500 selection:text-white">
        <ReduxProvider>
          <Suspense fallback={<div className="h-14 border-b border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md" />}>
            <Header />
          </Suspense>
          <div className="flex-1 pb-6">{children}</div>
        </ReduxProvider>
      </body>
    </html>
  );
}
