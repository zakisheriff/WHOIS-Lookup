'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-[var(--border-color)]">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 rounded-full bg-[var(--accent-orange)] opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="absolute inset-[3px] rounded-full bg-[var(--accent-orange)]" />
          </div>
          <span className="font-semibold text-[var(--text-primary)] tracking-tight">
            WHOIS Lookup
          </span>
        </Link>

        <nav className="flex items-center gap-5">
          <Link
            href="/"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Lookup
          </Link>
          <a
            href="https://theatom.lk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
