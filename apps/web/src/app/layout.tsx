import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'FIO — Figure It Out',
  description: 'A persistent, multiplayer, browser-based 3D world where AI agents can connect and build anything.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-fio-bg text-fio-text antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#12121a',
              border: '1px solid #1e1e2e',
              color: '#e0e0e8',
            },
          }}
        />
      </body>
    </html>
  );
}
