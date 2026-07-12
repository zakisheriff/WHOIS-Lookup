'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchInput from '@/components/SearchInput';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } },
};

const features = [
  { icon: 'WHOIS', label: 'WHOIS' },
  { icon: 'RDAP', label: 'RDAP' },
  { icon: 'DNS', label: 'DNS' },
  { icon: 'SSL', label: 'SSL' },
  { icon: 'NS', label: 'NS' },
  { icon: 'SEC', label: 'SEC' },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-2xl flex flex-col items-center"
        >
          <motion.div variants={itemVariants} className="text-center mb-6">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
              WHOIS{' '}
              <span className="font-['Caveat',_cursive] text-[var(--accent-orange)] -rotate-2 inline-block">
                Lookup
              </span>
            </h1>
          </motion.div>

          <motion.p variants={itemVariants} className="text-[var(--text-secondary)] text-center mb-8 max-w-md">
            Inspect any domain — WHOIS records, DNS, SSL certificates, HTTP headers, and more.
          </motion.p>

          <motion.div variants={itemVariants} className="w-full mb-8">
            <SearchInput />
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2">
            {features.map((f) => (
              <span
                key={f.label}
                className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full"
              >
                {f.label}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
