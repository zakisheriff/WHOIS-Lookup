'use client';

import Link from 'next/link';
import styles from '@/styles/Components.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoAtom}>
            <div className={styles.logoRing} />
          </div>
          <span>WHOIS Lookup</span>
        </Link>
        <nav className={styles.navLinks}>
          <Link href="/">Lookup</Link>
          <a href="https://theatom.lk" target="_blank" rel="noopener noreferrer">About</a>
        </nav>
      </div>
    </header>
  );
}
