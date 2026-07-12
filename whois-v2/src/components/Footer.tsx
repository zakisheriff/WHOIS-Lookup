'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--border-color)]">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-[var(--text-muted)]">
          <span className="text-[var(--accent-orange)]">Powered by</span>{' '}
          <a
            href="https://theatom.lk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            The Atom
          </a>
        </div>

        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span>&copy; {currentYear} The Atom. All rights reserved.</span>
          <a
            href="https://whois.theatom.lk"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-secondary)] transition-colors"
          >
            whois.theatom.lk
          </a>
        </div>
      </div>
    </footer>
  );
}
