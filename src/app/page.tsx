'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { Particles } from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import Lottie from 'lottie-react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import confetti from 'canvas-confetti';
import styles from './page.module.css';
import CrazyRoadmap from '@/components/CrazyRoadmap/CrazyRoadmap';
import CrazyTokenomics from '@/components/CrazyTokenomics/CrazyTokenomics';
import CrazyAbout from '@/components/CrazyAbout/CrazyAbout';
import EpicGameRoadmap from '@/components/CrazyRoadmap/CrazyRoadmap';
import CrazyCommunity from '@/components/CrazyCommunity/CrazyCommunity';

// Contract address
const CONTRACT_ADDRESS = "0x742d35Cc7cF66f5e8f20A4C1b8c4A6b8b4E6F5d1C2";

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

// Music Player Component
const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <motion.div 
      className={styles.musicPlayer}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <button onClick={togglePlay} className={styles.playButton}>
        {isPlaying ? '⏸️' : '🎵'}
      </button>
      <audio ref={audioRef} loop>
        <source src="/fox-theme.mp3" type="audio/mpeg" />
      </audio>
    </motion.div>
  );
};



// Main Home Component
export default function Home() {
  const [activeSection, setActiveSection] = useState('hero');
  const [showStats, setShowStats] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Typewriter effect for hero title
  const { displayedText: heroText, isComplete: heroComplete } = useTypewriter(
    "Welcome to the CrazyFox Revolution!", 100
  );

  // Animated counters
  const holdersCount = useAnimatedCounter(1000000, 3000, showStats);
  const marketCapCount = useAnimatedCounter(50, 3000, showStats);
  const communityCount = useAnimatedCounter(100000, 3000, showStats);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.id === 'hero') {
              setShowStats(true);
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
        random: false,
        speed: 1,
        straight: false,
      },
      number: { density: { enable: true, area: 800 }, value: 50 },
      opacity: { value: 0.3 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  };

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Buy button handler
  const handleBuyClick = () => {
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.8 }
    });
    toast.success('Redirecting to buy $CFOX! 🚀', { theme: "dark" });
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <>
      <Head>
        <title>CrazyFox | The Wildest Meme Coin on BSC 🦊</title>
        <meta name="description" content="Join the CrazyFox revolution! The most exciting meme coin on Binance Smart Chain." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        {/* Progress Bar */}
        <motion.div className={styles.progressBar} style={{ scaleX }} />

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
          //@ts-expect-error
          options={particlesConfig}
          className={styles.particles}
        />

        {/* Music Player */}
        <MusicPlayer />

        {/* Navigation */}
        <motion.nav 
          className={styles.nav}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className={styles.navContainer}>
            <motion.div 
              className={styles.logo}
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
             <img src="/fox.png" alt="" />
            </motion.div>
            
            <div className={styles.navLinks}>
              {['hero', 'about', 'tokenomics', 'roadmap', 'community'].map((section) => (
                <motion.button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`${styles.navLink} ${activeSection === section ? styles.active : ''}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </motion.button>
              ))}
            </div>

            <motion.button
              className={styles.buyButton}
              onClick={handleBuyClick}
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px #FF6B35" }}
              whileTap={{ scale: 0.95 }}
            >
              🚀 Buy $CFOX
            </motion.button>
          </div>
        </motion.nav>

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
                {heroText}
                {!heroComplete && <span className={styles.cursor}>|</span>}
              </motion.h1>
              
              <motion.p 
                className={styles.heroSubtitle}
                variants={itemVariants}
              >
                The wildest meme coin on Binance Smart Chain that's ready to take you to the moon! 
                Join our crazy community and experience the fox-tastic journey!
              </motion.p>

              <motion.div 
                className={styles.heroButtons}
                variants={itemVariants}
              >
                <motion.button
                  className={styles.primaryButton}
                  onClick={handleBuyClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>🚀 Buy $CFOX Now</span>
                </motion.button>
                <motion.button
                  className={styles.secondaryButton}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>📊 Chart</span>
                </motion.button>
              </motion.div>

              <motion.div 
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
                    ${marketCapCount}M+
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
                    {communityCount.toLocaleString()}+
                  </motion.span>
                  <span className={styles.statLabel}>Community</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className={styles.heroImage}
              variants={itemVariants}
            >
              <div className={styles.canvasContainer}>
                <img src="/fox-full.png" alt="" />
              </div>
            </motion.div>
          </div>

        </motion.section>

        {/* About Section */}
        <motion.section 
          id="about" 
          className={styles.about}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
        <CrazyAbout/>
        </motion.section>

        {/* Tokenomics Section */}
        <motion.section 
          id="tokenomics" 
          className={styles.tokenomics}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
         <CrazyTokenomics/>
        </motion.section>

        {/* Interactive Roadmap */}
        <motion.section 
          id="roadmap" 
          className={styles.roadmap}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <EpicGameRoadmap/>
        </motion.section>

        {/* Community Section */}
        <motion.section 
          id="community" 
          className={styles.community}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <CrazyCommunity/>
        </motion.section>

        {/* Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </>
  );
}