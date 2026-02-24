import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppProviders } from '@/providers';
import OrientationManager from '@/components/OrientationManager';
import SplashHandler from '@/components/SplashHandler';

export const metadata: Metadata = {
  title: 'CYBIM - Offline Signage Player',
  description: 'A lightweight Android TV offline signage player app.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@600&family=Roboto:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased', 'bg-background text-foreground')} suppressHydrationWarning>
        <AppProviders>
          <OrientationManager />
          <SplashHandler>
            {children}
          </SplashHandler>
        </AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
