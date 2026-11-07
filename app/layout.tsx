import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Poker Pot',
  description: 'Poker pot, bets and dealer manager',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
