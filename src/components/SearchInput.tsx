'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/styles/Components.module.css';

export default function SearchInput({ initialValue = '' }: { initialValue?: string }) {
  const [query, setQuery] = useState(initialValue);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [placeholder, setPlaceholder] = useState('Search domain, RDAP, DNS records...');

  // Press "/" to focus search input, and manage responsive placeholder text
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const updatePlaceholder = () => {
      if (window.innerWidth <= 640) {
        setPlaceholder('atom.lk');
      } else {
        setPlaceholder('Search domain, RDAP, DNS records...');
      }
    };
    updatePlaceholder();
    window.addEventListener('resize', updatePlaceholder);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePlaceholder);
    };
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (val.trim()) {
      const cleanVal = val.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
      const domainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;
      if (!domainRegex.test(cleanVal)) {
        setError('Invalid domain format (e.g. cloudflare.com)');
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const cleanQuery = query.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
    const domainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

    if (!domainRegex.test(cleanQuery)) {
      setError('Please enter a valid domain name');
      return;
    }

    router.push(`/${cleanQuery}`);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.searchWrapper}>
      <div className={styles.searchBar}>
        <div className={styles.searchIcon}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className={styles.input}
          aria-label="Domain Search Input"
          autoComplete="off"
          spellCheck="false"
        />
        <span className={styles.shortcutHint} aria-hidden="true">/</span>
        <button type="submit" className={styles.submitBtn}>
          <span>Inspect</span>
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={styles.validationError}
            role="alert"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
