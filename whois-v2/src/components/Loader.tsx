'use client';

import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <div className="w-full max-w-[var(--container-max)] mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="h-10 w-48 shimmer rounded-lg" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 shimmer rounded-[var(--radius-lg)]" />
            <div className="h-48 shimmer rounded-[var(--radius-lg)]" />
          </div>
          <div className="space-y-4">
            <div className="h-40 shimmer rounded-[var(--radius-lg)]" />
            <div className="h-56 shimmer rounded-[var(--radius-lg)]" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
