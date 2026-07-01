'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Bell, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import styles from './Header.module.css';

const pageTitles = {
  '/dashboard':      'Dashboard',
  '/transactions':   'Transactions',
  '/bills':          'Bills & Subscriptions',
  '/reports':        'Reports',
  '/tax':            'Tax Estimator',
  '/profile':        'My Profile',
  '/notifications':  'Notifications',
};

// Unread count — in production fetch from API
const UNREAD = 3;

export default function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();
  const user  = session?.user;
  const title = pageTitles[pathname] || 'FinSmart';

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        {/* Bell → /notifications */}
        <button
          className={styles.iconBtn}
          onClick={() => router.push('/notifications')}
          aria-label="Notifications"
        >
          <Bell size={20}/>
          {UNREAD > 0 && (
            <span className={styles.notifBadge}>{UNREAD}</span>
          )}
        </button>

        {/* User pill → /profile */}
        <button
          className={styles.userPill}
          onClick={() => router.push('/profile')}
          aria-label="Profile"
        >
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name || 'User'}
              width={32} height={32}
              className={styles.avatarImg}
            />
          ) : (
            <div className={styles.avatar}><User size={16}/></div>
          )}
          <span className={styles.userName}>{user?.username || user?.name || 'User'}</span>
        </button>
      </div>
    </header>
  );
}
