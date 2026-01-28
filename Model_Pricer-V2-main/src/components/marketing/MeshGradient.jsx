import React from 'react';
import { motion } from 'framer-motion';

/**
 * Mesh-style animated background for marketing sections.
 * Purely decorative.
 */
export default function MeshGradient() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      {/* Soft animated blobs */}
      <motion.div
        className="absolute -top-32 -left-32 h-[34rem] w-[34rem] rounded-full bg-primary/25 blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[-10rem] right-[-12rem] h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-14rem] left-[20%] h-[36rem] w-[36rem] rounded-full bg-secondary/40 blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, -40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-10rem] right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-primary/15 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle vignette so text stays readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/40 to-background" />
    </div>
  );
}
