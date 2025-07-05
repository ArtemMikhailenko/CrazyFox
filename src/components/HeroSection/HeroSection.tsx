'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Particles } from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './HeroSection.module.css';
import WagmiPresalePurchase from '../PurchaseWidget/PurchaseWidget';

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
  
  // Language hook
  const { getComponentText, getComponentArray } = useLanguage();

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

  // Get localized stats data
  const statsData = useMemo(() => [
    {
      value: getComponentText('heroSection', 'stats.holders.value'),
      label: getComponentText('heroSection', 'stats.holders.label')
    },
    {
      value: getComponentText('heroSection', 'stats.marketCap.value'),
      label: getComponentText('heroSection', 'stats.marketCap.label')
    },
    {
      value: getComponentText('heroSection', 'stats.community.value'),
      label: getComponentText('heroSection', 'stats.community.label')
    }
  ], [getComponentText]);

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
          <motion.h1 
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {getComponentText('heroSection', 'title')}
          </motion.h1>
          
          {/* Subtitle */}
          {/* <motion.p
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {getComponentText('heroSection', 'subtitle')}
          </motion.p> */}

          {/* Hero Image */}
          <motion.div 
            className={styles.heroImageLeft}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isLoaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <img 
              src="/fox-full.png" 
              alt={getComponentText('heroSection', 'image.alt')}
              loading="eager"
            />
          </motion.div>

          {/* Features List */}
          {/* <motion.div
            className={styles.featuresList}
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {getComponentArray('heroSection', 'features', 4).map((feature: string, index: number) => (
              <motion.div
                key={index}
                className={styles.featureItem}
                initial={{ opacity: 0, x: -20 }}
                animate={isLoaded ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
              >
                {feature}
              </motion.div>
            ))}
          </motion.div> */}

          {/* Stats section */}
          {showStats && (
            <motion.div 
              className={styles.stats}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {statsData.map((stat, index) => (
                <motion.div 
                  key={index}
                  className={styles.stat}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.4 + index * 0.1,
                    type: "spring",
                    stiffness: 200 
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                >
                  <span className={styles.statNumber}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        <motion.div 
          className={styles.heroRight}
          initial={{ opacity: 0, x: 30 }}
          animate={isLoaded ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <WagmiPresalePurchase />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;