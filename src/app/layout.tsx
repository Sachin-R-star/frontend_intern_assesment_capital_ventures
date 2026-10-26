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
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        <ReduxProvider>
          <Suspense fallback={<div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />}>
            <Header />
          </Suspense>
          <div className="flex-1 pb-16">{children}</div>
        </ReduxProvider>
      </body>
    </html>
  );
}
