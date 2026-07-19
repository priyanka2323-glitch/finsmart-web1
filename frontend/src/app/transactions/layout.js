'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar />
      <Header />
      <main style={{ marginLeft: 260, paddingTop: 64, minHeight: '100vh' }}>
        <div style={{ padding: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}