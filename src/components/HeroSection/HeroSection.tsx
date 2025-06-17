'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Particles } from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import PurchaseWidget from '../PurchaseWidget/PurchaseWidget';
import styles from './HeroSection.module.css';
import MobileMetaMaskPurchase from '../PurchaseWidget/PurchaseWidget';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

// Animated counter hook
const useAnimatedCounter = (end: number, duration: number = 2000, startAnimation: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startAnimation) return;
    
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration, startAnimation]);

  return count;
};

// Typewriter Effect Hook
const useTypewriter = (text: string, speed: number = 50) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayedText, isComplete };
};

// Main HeroSection Component
interface HeroSectionProps {
  isLoaded: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ isLoaded }) => {
  const [showStats, setShowStats] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Typewriter effect
  const { displayedText: heroText, isComplete: heroComplete } = useTypewriter(
    "Welcome to the CrazyFox Revolution!", 100
  );

  // Animated counters
  const holdersCount = useAnimatedCounter(1000, 3000, showStats);
  const communityCount = useAnimatedCounter(50000, 3000, showStats);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Start animations when component mounts
  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Particles configuration
  const particlesInit = useCallback(async (engine: any) => {
    await loadSlim(engine);
  }, []);

  const particlesConfig = {
    background: { color: { value: "transparent" } },
    fpsLimit: 60,
    particles: {
      color: { value: ["#FF6B35", "#4ECDC4", "#45B7D1"] },
      links: {
        color: "#4ECDC4",
        distance: 150,
        enable: true,
        opacity: 0.2,
        width: 1,
      },
      move: {
        enable: true,
        outModes: { default: "bounce" },
        speed: 1,
      },
      number: { density: { enable: true, area: 800 }, value: 50 },
      opacity: { value: 0.3 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  };

  return (
    <motion.section 
      id="hero" 
      className={styles.hero}
      variants={containerVariants}
      initial="hidden"
      animate={isLoaded ? "visible" : "hidden"}
    >
      {/* Cursor Follower */}
      <motion.div
        className={styles.cursorFollower}
        animate={{
          x: mousePosition.x - 10,
          y: mousePosition.y - 10,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      />

      {/* Background Particles */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        //@ts-ignore
        options={particlesConfig}
        className={styles.particles}
      />

      <div className={styles.heroContent}>
        <motion.div className={styles.heroText} variants={itemVariants}>
          <motion.h1 className={styles.heroTitle}>
            {heroText}
            {!heroComplete && <span className={styles.cursor}>|</span>}
          </motion.h1>
          
          {/* Fox Image under title */}
          <div className={styles.heroImageLeft}>
            <motion.img 
              src="/fox-full.png" 
              alt="CrazyFox Hero"
              // whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          </div>
          
          
          {/* <motion.div 
            className={styles.stats}
            variants={itemVariants}
          >
            <div className={styles.stat}>
              <motion.span 
                className={styles.statNumber}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {holdersCount.toLocaleString()}+
              </motion.span>
              <span className={styles.statLabel}>Holders</span>
            </div>
            <div className={styles.stat}>
              <motion.span 
                className={styles.statNumber}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                $300K+
              </motion.span>
              <span className={styles.statLabel}>Market Cap</span>
            </div>
            <div className={styles.stat}>
              <motion.span 
                className={styles.statNumber}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                {Math.floor(communityCount / 1000)}K+
              </motion.span>
              <span className={styles.statLabel}>Community</span>
            </div>
          </motion.div> */}
        </motion.div>

        {/* Right side with purchase widget only */}
        <motion.div 
          className={styles.heroRight}
          variants={itemVariants}
        >
          {/* Purchase Widget */}
          <MobileMetaMaskPurchase />
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HeroSection;