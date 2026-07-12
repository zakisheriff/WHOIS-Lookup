'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchInputProps {
  initialValue?: string;
  compact?: boolean;
}

const DOMAIN_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

function cleanDomain(input: string): string {
  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '');
  domain = domain.replace(/^www\./, '');
  domain = domain.split('/')[0];
  domain = domain.split(':')[0];
  return domain;
}

export default function SearchInput({ initialValue = '', compact = false }: SearchInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!query.trim()) {
      setError('Please enter a domain');
      return;
    }

    const cleaned = cleanDomain(query);

    if (!DOMAIN_REGEX.test(cleaned)) {
      setError('Invalid domain format');
      return;
    }

    router.push(`/${cleaned}`);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-[var(--text-muted)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError('');
            }}
            placeholder={compact ? 'Search another domain...' : 'Enter domain (e.g., example.com)'}
            className={`w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all ${
              compact
                ? 'pl-10 pr-4 py-2.5 text-sm'
                : 'pl-11 pr-28 py-4 text-base'
            }`}
          />

          {!compact && (
            <div className="absolute right-2 flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-1.5 py-0.5 font-mono">
                /
              </span>
              <button
                type="submit"
                className="bg-[var(--accent-orange)] hover:bg-[var(--accent-orange)]/90 text-white font-medium rounded-full px-5 py-2 text-sm transition-colors"
              >
                Inspect
              </button>
            </div>
          )}
        </div>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 mt-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 z-10"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
