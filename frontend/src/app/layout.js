import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import NextAuthProvider from '@/lib/SessionProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
  title: 'FinSmart — Smart Personal Finance',
  description: 'Track expenses, manage bills, and optimize taxes with FinSmart.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className={inter.className}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
