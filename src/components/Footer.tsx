'use client';

import styles from '@/styles/Components.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerLeft}>
          <div className={styles.footerBrand}>
            <span style={{ color: 'var(--accent)' }}>Powered by</span> The Atom
          </div>
          <p className={styles.footerCopyright}>
            © {new Date().getFullYear()} The Atom. All rights reserved.
          </p>
        </div>
        <div className={styles.footerRight}>
          <a href="https://whoislookup.theatom.lk" className={styles.link}>whoislookup.theatom.lk</a>
          <span>•</span>
          <a href="https://theatom.lk" target="_blank" rel="noopener noreferrer" className={styles.link}>theatom.lk</a>
        </div>
      </div>
    </footer>
  );
}
