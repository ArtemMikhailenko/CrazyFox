'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Particles } from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import PurchaseWidget from '../PurchaseWidget/PurchaseWidget';
import styles from './HeroSection.module.css';

// Simple fade-in animation
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

interface HeroSectionProps {
  isLoaded: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ isLoaded }) => {
  const [showStats, setShowStats] = useState(false);

  // Start stats animation after component loads
  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => setShowStats(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  // Memoized particles config for better performance
  const particlesConfig = useMemo(() => ({
    background: { color: { value: "transparent" } },
    fpsLimit: 30,
    particles: {
      color: { value: ["#FF6B35", "#4ECDC4", "#45B7D1"] },
      links: {
        color: "#4ECDC4",
        distance: 120,
        enable: true,
        opacity: 0.15,
        width: 1,
      },
      move: {
        enable: true,
        outModes: { default: "bounce" },
        speed: 0.8,
      },
      number: { 
        density: { enable: true, area: 1000 }, 
        value: 30
      },
      opacity: { value: 0.25 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 2 } },
    },
    detectRetina: true,
  }), []);

  const particlesInit = useCallback(async (engine: any) => {
    await loadSlim(engine);
  }, []);

  return (
    <section id="hero" className={styles.hero}>
      {/* Background particles */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        //@ts-ignore
        options={particlesConfig}
        className={styles.particles}
      />

      <motion.div 
        className={styles.heroContent}
        variants={fadeIn}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
      >
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            Welcome to the CrazyFox Revolution!
          </h1>
          
          <div className={styles.heroImageLeft}>
            <img 
              src="/fox-full.png" 
              alt="CrazyFox Hero"
              loading="eager"
            />
          </div>

          {/* Stats section */}
          {showStats && (
            <motion.div 
              className={styles.stats}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className={styles.stat}>
                <span className={styles.statNumber}>1,000+</span>
                <span className={styles.statLabel}>Holders</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>$300K+</span>
                <span className={styles.statLabel}>Market Cap</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>50K+</span>
                <span className={styles.statLabel}>Community</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className={styles.heroRight}>
          <PurchaseWidget />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;