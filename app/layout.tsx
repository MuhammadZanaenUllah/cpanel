import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const wsFont = localFont({
  src: [
    { path: '../public/fonts/ws/WSF-Thin.ttf', weight: '100', style: 'normal' },
    { path: '../public/fonts/ws/WSF-ThinItalic.ttf', weight: '100', style: 'italic' },
    { path: '../public/fonts/ws/WSF-ExtraLight.ttf', weight: '200', style: 'normal' },
    { path: '../public/fonts/ws/WSF-ExtraLightItalic.ttf', weight: '200', style: 'italic' },
    { path: '../public/fonts/ws/WSF-Light.ttf', weight: '300', style: 'normal' },
    { path: '../public/fonts/ws/WSF-LightItalic.ttf', weight: '300', style: 'italic' },
    { path: '../public/fonts/ws/WSF-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/ws/WSF-Italic.ttf', weight: '400', style: 'italic' },
    { path: '../public/fonts/ws/WSF-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../public/fonts/ws/WSF-MediumItalic.ttf', weight: '500', style: 'italic' },
    { path: '../public/fonts/ws/WSF-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../public/fonts/ws/WSF-SemiBoldItalic.ttf', weight: '600', style: 'italic' },
    { path: '../public/fonts/ws/WSF-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../public/fonts/ws/WSF-BoldItalic.ttf', weight: '700', style: 'italic' },
    { path: '../public/fonts/ws/WSF-ExtraBold.ttf', weight: '800', style: 'normal' },
    { path: '../public/fonts/ws/WSF-ExtraBoldItalic.ttf', weight: '800', style: 'italic' },
    { path: '../public/fonts/ws/WSF-Black.ttf', weight: '900', style: 'normal' },
    { path: '../public/fonts/ws/WSF-BlackItalic.ttf', weight: '900', style: 'italic' },
  ],
  variable: '--font-ws',
});

export const metadata: Metadata = {
  title: 'Websouls cPanel',
  description: 'Websouls Hosting Control Panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={wsFont.variable} suppressHydrationWarning>
      <body className={wsFont.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ style: { fontSize: 13 } }} />
        </AuthProvider>
      </body>
    </html>
  );
}
