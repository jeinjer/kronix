import React from 'react';
import { motion } from 'framer-motion';

export default function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-cyan-500/10 rounded-full blur-2xl"
          style={{
            width: Math.random() * 400 + 50,
            height: Math.random() * 400 + 50,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, Math.random() * 200 - 100],
            x: [0, Math.random() * 200 - 100],
            scale: [1, 1.5, 0.8],
            opacity: [0.05, 0.2, 0.05],
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}