'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  BarChart3,
  Calculator,
  Menu,
  X,
  Diamond,
  LogOut,
  User,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navLinks = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/transactions',  label: 'Transactions',  icon: ArrowLeftRight  },
  { href: '/bills',         label: 'Bills',         icon: Receipt         },
  { href: '/reports',       label: 'Reports',       icon: BarChart3       },
  { href: '/tax',           label: 'Tax Estimator', icon: Calculator      },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const user = session?.user;

  return (
    <>
      {/* Mobile toggle */}
      <button className={styles.mobileToggle} onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {collapsed && <div className={styles.overlay} onClick={() => setCollapsed(false)} />}

      <aside className={`${styles.sidebar} ${collapsed ? styles.open : ''}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <Diamond size={22} />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>FinSmart</span>
            <span className={styles.brandTagline}>Personal Finance</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                onClick={() => setCollapsed(false)}
              >
                <div className={styles.navIconWrap}>
                  <Icon size={20} />
                </div>
                <span className={styles.navLabel}>{link.label}</span>
                {isActive && <div className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className={styles.userSection}>
          <div className={styles.divider} />
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              <User size={18} />
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.username || user?.name || 'My Account'}</span>
              <span className={styles.userEmail}>{user?.email || ''}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
