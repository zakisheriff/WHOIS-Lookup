'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchInput from '@/components/SearchInput';
import styles from '@/styles/Home.module.css';

export default function Home() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const searches = localStorage.getItem('atom_recent_whois');
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  const popularDomains = ['cloudflare.com', 'github.com', 'vercel.app', 'theatom.lk'];

  // Animations configuration
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <main style={{ width: '100%', maxWidth: '640px', padding: '24px' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
        >
          <motion.div className={styles.hero} variants={itemVariants} style={{ marginBottom: '32px' }}>
            <h1 className={styles.title}>WHOIS Lookup</h1>
            <p className={styles.subtitle}>
              Instantly inspect domain registration, RDAP, DNS, SSL certificates, nameservers, registrar information and more.
            </p>
          </motion.div>

          <motion.div className={styles.searchSection} variants={itemVariants} style={{ width: '100%' }}>
            <SearchInput />
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
