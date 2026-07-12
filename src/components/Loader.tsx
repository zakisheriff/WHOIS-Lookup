'use client';

import styles from '@/styles/Components.module.css';

export default function Loader() {
  return (
    <div className={styles.skeletonContainer}>
      {/* Search Result Header Skeleton */}
      <div className={`${styles.skeletonHeader} shimmer`} />

      {/* Main & Sidebar Grid Skeleton */}
      <div className={styles.skeletonGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={`${styles.skeletonCard} shimmer`} style={{ height: '320px' }} />
          <div className={`${styles.skeletonCard} shimmer`} style={{ height: '280px' }} />
          <div className={`${styles.skeletonCard} shimmer`} style={{ height: '240px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={`${styles.skeletonCard} shimmer`} style={{ height: '200px' }} />
          <div className={`${styles.skeletonCard} shimmer`} style={{ height: '360px' }} />
        </div>
      </div>
    </div>
  );
}
