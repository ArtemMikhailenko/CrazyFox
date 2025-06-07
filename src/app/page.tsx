// pages/index.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Particles } from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import SimpleHeader from '@/components/Header/SimpleHeader'; // Заменили Header на SimpleHeader
import SimpleWeb3Buy from '@/components/SimpleWeb3Buy'; // Простой компонент


import styles from './page.module.css';
import CrazyAbout from '@/components/CrazyAbout/CrazyAbout';
import CrazyTokenomics from '@/components/CrazyTokenomics/CrazyTokenomics';
import CrazyCommunity from '@/components/CrazyCommunity/CrazyCommunity';
import CrazyRoadmap from '@/components/CrazyRoadmap/CrazyRoadmap';

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

// Custom Hooks
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

// Price Display Component
const PriceDisplay = () => {
  const [currentPrice, setCurrentPrice] = useState(0.005);
  const [bnbPrice, setBnbPrice] = useState(300);
  const [ethPrice, setEthPrice] = useState(2000);

  // Обновление цен (можно подключить к API)
  useEffect(() => {
    const updatePrices = () => {
      // Здесь можно добавить реальные API вызовы
      setBnbPrice(295 + Math.random() * 10); // Симуляция колебаний
      setEthPrice(1990 + Math.random() * 20);
    };

    const interval = setInterval(updatePrices, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className={styles.priceDisplay}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
    >
      <div className={styles.priceContainer}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>🦊 CRFX:</span>
          <span className={styles.priceValue}>${currentPrice.toFixed(3)}</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>🔶 BNB:</span>
          <span className={styles.priceValue}>${bnbPrice.toFixed(0)}</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>💎 ETH:</span>
          <span className={styles.priceValue}>${ethPrice.toFixed(0)}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Music Player Component
const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {
          toast.info('Click to enable music! 🎵');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <motion.div 
      className={styles.musicPlayer}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 2, type: "spring", stiffness: 200 }}
    >
      <motion.button 
        onClick={togglePlay} 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={styles.playButton}
      >
        {isPlaying ? '⏸️' : '🎵'}
      </motion.button>
      {/* @ts-ignore */}
      <audio ref={audioRef} loop volume={0.3}>
        <source src="/fox-theme.mp3" type="audio/mpeg" />
      </audio>
    </motion.div>
  );
};

// Stats Component
const StatsDisplay = ({ showStats }: { showStats: boolean }) => {
  const holdersCount = useAnimatedCounter(1342, 3000, showStats);
  const marketCapCount = useAnimatedCounter(156, 3000, showStats);
  const communityCount = useAnimatedCounter(294780, 3000, showStats);
  const raisedAmount = useAnimatedCounter(78420, 3000, showStats);

  return (
    <>
      {/* Raised Amount */}
      <motion.div 
        className={styles.raisedAmount}
        variants={itemVariants}
      >
        <div className={styles.raisedContainer}>
          <div className={styles.raisedIcon}>💰</div>
          <div className={styles.raisedContent}>
            <div className={styles.raisedLabel}>Total Raised</div>
            <motion.div 
              className={styles.raisedNumber}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.6, type: "spring", stiffness: 200 }}
            >
              ${raisedAmount.toLocaleString()}
            </motion.div>
            <div className={styles.raisedSubtext}>
              Growing every minute! 🚀
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className={styles.stats}
        variants={itemVariants}
      >
        <motion.div 
          className={styles.stat}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.span 
            className={styles.statNumber}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {holdersCount.toLocaleString()}+
          </motion.span>
          <span className={styles.statLabel}>Holders</span>
          <div className={styles.statIcon}>👥</div>
        </motion.div>

        <motion.div 
          className={styles.stat}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.span 
            className={styles.statNumber}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            ${marketCapCount}K+
          </motion.span>
          <span className={styles.statLabel}>Market Cap</span>
          <div className={styles.statIcon}>💰</div>
        </motion.div>

        <motion.div 
          className={styles.stat}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.span 
            className={styles.statNumber}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            {communityCount.toLocaleString()}+
          </motion.span>
          <span className={styles.statLabel}>Community</span>
          <div className={styles.statIcon}>🚀</div>
        </motion.div>
      </motion.div>
    </>
  );
};

// Floating Elements
const FloatingElements = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <div className={styles.floatingElements}>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.floatingEmoji}
            initial={{ opacity: 0, y: 100 }}
            animate={{ 
              opacity: [0, 1, 0],
              y: [-100, -300],
              x: [0, Math.random() * 100 - 50]
            }}
            transition={{
              duration: 4,
              delay: i * 0.5,
              repeat: Infinity,
              repeatDelay: 8
            }}
          >
            {['🦊', '🚀', '💎', '🌙', '⭐', '🔥'][i]}
          </motion.div>
        ))}
      </div>
    )}
  </AnimatePresence>
);

// Main Home Component
const HomeContent = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [showStats, setShowStats] = useState(false);
  const [showFloatingElements, setShowFloatingElements] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Typewriter effect
  const { displayedText: heroText, isComplete: heroComplete } = useTypewriter(
    "Welcome to the CrazyFox Revolution!", 80
  );

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.id === 'hero') {
              setShowStats(true);
              setTimeout(() => setShowFloatingElements(true), 1500);
            }
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    document.querySelectorAll('section').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // Particles config
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
        opacity: 0.15,
        width: 1,
      },
      move: {
        enable: true,
        outModes: { default: "bounce" },
        random: false,
        speed: 0.8,
        straight: false,
      },
      number: { density: { enable: true, area: 1000 }, value: 40 },
      opacity: { value: 0.4 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={styles.container}>
      {/* Progress Bar */}
      <motion.div 
        className={styles.progressBar} 
        style={{ scaleX }}
      />

      {/* Header */}
      <SimpleHeader 
        activeSection={activeSection}
        scrollToSection={scrollToSection}
      />

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

      {/* Music Player */}
      <MusicPlayer />

      {/* Floating Elements */}
      <FloatingElements show={showFloatingElements} />

      {/* Hero Section */}
      <motion.section 
        id="hero" 
        className={styles.hero}
        variants={containerVariants}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
      >
        <div className={styles.heroContent}>
          <motion.div className={styles.heroText} variants={itemVariants}>
            <motion.h1 className={styles.heroTitle}>
              <span className={styles.titleGradient}>{heroText}</span>
              {!heroComplete && <span className={styles.cursor}>|</span>}
            </motion.h1>
            
            <motion.p 
              className={styles.heroSubtitle}
              variants={itemVariants}
            >
              The wildest meme coin on Binance Smart Chain that's ready to take you to the moon! 
              Join our crazy community with{' '}
              <span className={styles.highlight}>instant payments</span>,{' '}
              <span className={styles.highlight}>direct delivery</span>, and{' '}
              <span className={styles.highlight}>no complex setup</span>!
            </motion.p>

            <motion.div 
              className={styles.heroButtons}
              variants={itemVariants}
            >
              <SimpleWeb3Buy />
              
              <motion.button
                className={styles.secondaryButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://dexscreener.com/bsc/0x874641647B9d8a8d991c541BBD48bD597b85aE33', '_blank')}
              >
                <span className={styles.buttonIcon}>📊</span>
                <span>Chart</span>
              </motion.button>
              
              <motion.button
                className={styles.secondaryButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://pancakeswap.finance/swap?outputCurrency=0x874641647B9d8a8d991c541BBD48bD597b85aE33', '_blank')}
              >
                <span className={styles.buttonIcon}>🥞</span>
                <span>PancakeSwap</span>
              </motion.button>
            </motion.div>

            {/* Price Display */}
            <PriceDisplay />

            {/* Stats */}
            <StatsDisplay showStats={showStats} />

            {/* Security Badges */}
            <motion.div 
              className={styles.securityBadges}
              variants={itemVariants}
            >
              <div className={styles.badge}>
                <span className={styles.badgeIcon}>💰</span>
                <div className={styles.badgeContent}>
                  <span className={styles.badgeTitle}>Direct Payments</span>
                  <span className={styles.badgeDesc}>To Treasury</span>
                </div>
              </div>
              
              <div className={styles.badge}>
                <span className={styles.badgeIcon}>⚡</span>
                <div className={styles.badgeContent}>
                  <span className={styles.badgeTitle}>Instant Tokens</span>
                  <span className={styles.badgeDesc}>No Waiting</span>
                </div>
              </div>
              
              <div className={styles.badge}>
                <span className={styles.badgeIcon}>🔧</span>
                <div className={styles.badgeContent}>
                  <span className={styles.badgeTitle}>Simple Setup</span>
                  <span className={styles.badgeDesc}>Just MetaMask</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className={styles.heroImage}
            variants={itemVariants}
          >
            <div className={styles.canvasContainer}>
              <motion.img 
                src="/fox-full.png" 
                alt="CrazyFox Hero"
                className={styles.heroFox}
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, 0, -5, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
              />
              
              {/* Glow effect */}
              <div className={styles.foxGlow} />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className={styles.scrollIndicator}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 1 }}
          onClick={() => scrollToSection('about')}
        >
          <div className={styles.scrollText}>Scroll to explore</div>
          <motion.div 
            className={styles.scrollArrow}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⬇️
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Other Sections */}
      <motion.section 
        id="about" 
        className={styles.about}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <CrazyAbout />
      </motion.section>

      <motion.section 
        id="tokenomics" 
        className={styles.tokenomics}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <CrazyTokenomics />
      </motion.section>

      <motion.section 
        id="roadmap" 
        className={styles.roadmap}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <CrazyRoadmap />
      </motion.section>

      <motion.section 
        id="community" 
        className={styles.community}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <CrazyCommunity />
      </motion.section>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          border: '1px solid rgba(255, 107, 53, 0.3)',
          color: '#ffffff'
        }}
      />
    </div>
  );
};

// Main Export (без ThirdWeb Provider)
export default function Home() {
  return (
    <>
      <Head>
        <title>CrazyFox | The Wildest Meme Coin on BSC 🦊 | Simple Presale</title>
        <meta name="description" content="Join the CrazyFox revolution! The most exciting meme coin on Binance Smart Chain with simple setup, instant payments, and direct token delivery." />
        <meta name="keywords" content="CrazyFox, CRFX, meme coin, BSC, cryptocurrency, DeFi, presale, MetaMask, simple setup" />
        <meta property="og:title" content="CrazyFox | The Wildest Meme Coin on BSC 🦊" />
        <meta property="og:description" content="Join the CrazyFox revolution! Simple setup with MetaMask, instant payments, direct token delivery!" />
        <meta property="og:image" content="/fox-full.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://crazyfox.meme" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CrazyFox | The Wildest Meme Coin on BSC 🦊" />
        <meta name="twitter:description" content="The simplest and most secure meme coin presale. Just connect MetaMask and buy!" />
        <meta name="twitter:image" content="/fox-full.png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/fox.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#FF6B35" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <HomeContent />
    </>
  );
}