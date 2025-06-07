// pages/index.tsx или app/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { Particles } from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import confetti from 'canvas-confetti';

// ThirdWeb v5 imports
import { 
  ThirdwebProvider, 
  useActiveAccount,
  useReadContract,
  useSendTransaction,
  useWalletBalance
} from "thirdweb/react";
import { createThirdwebClient, defineChain } from "thirdweb";
import { prepareContractCall, getContract } from "thirdweb";
import { bsc } from "thirdweb/chains";

// Components
import Header from '@/components/Header/Header';
import CrazyTokenomics from '@/components/CrazyTokenomics/CrazyTokenomics';
import CrazyAbout from '@/components/CrazyAbout/CrazyAbout';
import CrazyCommunity from '@/components/CrazyCommunity/CrazyCommunity';
import CrazyRoadmapMap from '@/components/CrazyRoadmap/CrazyRoadmap';

import styles from './page.module.css';

// ThirdWeb client configuration
const client = createThirdwebClient({
  clientId: "d28d89a66e8eb5e73d6a9c8eeaa0645a" // Замените на ваш Client ID
});

// Contract addresses
const TOKEN_CONTRACT_ADDRESS = "0x874641647B9d8a8d991c541BBD48bD597b85aE33";
const PRESALE_CONTRACT_ADDRESS = "0x..."; // Ваш контракт для пресейла

// Token price in USD
const TOKEN_PRICE_USD = 0.005;

// Contract instances
const presaleContract = getContract({
  client,
  chain: bsc,
  address: PRESALE_CONTRACT_ADDRESS,
});

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

// Buy Token Component for ThirdWeb v5
const BuyTokenComponent = () => {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const [buyAmount, setBuyAmount] = useState('1');
  const [showBuyModal, setShowBuyModal] = useState(false);

  // Read presale info
  const { data: presaleInfo } = useReadContract({
    contract: presaleContract,
    method: "getPresaleInfo",
    params: []
  });

  // Read user info
  const { data: userInfo } = useReadContract({
    contract: presaleContract,
    method: "getUserInfo",
    params: [account?.address || ""]
  });

  const calculateTokenAmount = (bnbAmount: string) => {
    const bnbValue = parseFloat(bnbAmount);
    // Предполагаем курс BNB к USD (в реальном приложении получайте с API)
    const BNB_TO_USD = 300; // Примерный курс
    const usdValue = bnbValue * BNB_TO_USD;
    return Math.floor(usdValue / TOKEN_PRICE_USD);
  };

  const handleBuyTokens = async () => {
    if (!account) {
      toast.error('Please connect your wallet first!');
      return;
    }

    try {
      const transaction = prepareContractCall({
        contract: presaleContract,
        //@ts-ignore
        method: "buyTokens",
        params: [],
        value: BigInt(parseFloat(buyAmount) * 10**18) // Convert to wei
      });

      await sendTransaction(transaction);

      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.8 }
      });
      
      toast.success(`Successfully bought ${calculateTokenAmount(buyAmount).toLocaleString()} CRFX tokens! 🚀`);
      setShowBuyModal(false);
      setBuyAmount('1');
    } catch (error) {
      console.error('Error buying tokens:', error);
      toast.error('Failed to buy tokens. Please try again.');
    }
  };

  return (
    <>
      <motion.button
        className={`${styles.primaryButton} ${!account ? styles.disabled : ''}`}
        onClick={() => account ? setShowBuyModal(true) : toast.warning('Please connect your wallet first! 🦊')}
        whileHover={account ? { scale: 1.05 } : {}}
        whileTap={account ? { scale: 0.95 } : {}}
      >
        <span>🚀 Buy $CRFX Now</span>
      </motion.button>

      {/* Buy Modal */}
      <AnimatePresence>
        {showBuyModal && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBuyModal(false)}
          >
            <motion.div 
              className={styles.buyModal}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3>Buy CRFX Tokens</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowBuyModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className={styles.buyContent}>
                <div className={styles.priceInfo}>
                  <div className={styles.tokenPrice}>
                    <span className={styles.priceLabel}>Token Price:</span>
                    <span className={styles.priceValue}>${TOKEN_PRICE_USD}</span>
                  </div>
                </div>

                <div className={styles.buyForm}>
                  <div className={styles.inputGroup}>
                    <label>Amount (BNB)</label>
                    <input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      min="0.001"
                      step="0.001"
                      placeholder="Enter BNB amount"
                    />
                  </div>

                  <div className={styles.conversionInfo}>
                    <div className={styles.conversion}>
                      <span>You will receive:</span>
                      <span className={styles.tokenAmount}>
                        ~{calculateTokenAmount(buyAmount).toLocaleString()} CRFX
                      </span>
                    </div>
                  </div>

                  <div className={styles.buyActions}>
                    <motion.button
                      className={styles.cancelButton}
                      onClick={() => setShowBuyModal(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    
                    <motion.button
                      className={styles.confirmBuyButton}
                      onClick={handleBuyTokens}
                      disabled={isPending || !buyAmount || parseFloat(buyAmount) <= 0}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isPending ? (
                        <span>🔄 Buying...</span>
                      ) : (
                        <span>🚀 Buy Tokens</span>
                      )}
                    </motion.button>
                  </div>
                </div>

                <div className={styles.buyFooter}>
                  <p className={styles.disclaimer}>
                    ⚠️ Please ensure you have enough BNB for gas fees
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
const HomeContent = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [showStats, setShowStats] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const account = useActiveAccount();

  // Typewriter effect for hero title
  const { displayedText: heroText, isComplete: heroComplete } = useTypewriter(
    "Welcome to the CrazyFox Revolution!", 100
  );

  // Animated counters
  const holdersCount = useAnimatedCounter(1000, 3000, showStats);
  const marketCapCount = useAnimatedCounter(50, 3000, showStats);
  const communityCount = useAnimatedCounter(280000, 3000, showStats);
  const raisedAmount = useAnimatedCounter(302736, 3000, showStats);

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

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={styles.container}>
      {/* Progress Bar */}
      <motion.div className={styles.progressBar} style={{ scaleX }} />

      {/* Header Component */}
      <Header 
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
              <BuyTokenComponent />
              <motion.div 
  className={styles.tokenPriceBadge}
  variants={itemVariants}
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ delay: 1.8, type: "spring", stiffness: 200 }}
>
  {/* <div className={styles.priceContainer}> */}
    
    <div className={styles.priceInfo}>
    
      <span className={styles.priceLabel}><span className={styles.priceIcon}>💰</span>Current Price</span>
      <span className={styles.priceAmount}>$0.005</span>
    </div>
    
  {/* </div> */}
</motion.div>
            </motion.div>
         
            {/* Raised Amount Display */}
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
                    ${raisedAmount.toLocaleString()}.92
                  </motion.div>
                  <div className={styles.raisedProgress}>
                    <div className={styles.progressBarContainer}>
                      <motion.div 
                        className={styles.progressFill}
                        initial={{ width: 0 }}
                        animate={{ width: "73%" }}
                        transition={{ delay: 2, duration: 2, ease: "easeOut" }}
                      />
                    </div>
                    <div className={styles.progressText}>73% of soft cap reached</div>
                  </div>
                </div>
              </div>
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
                  ${marketCapCount}K+
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
              <motion.img 
                src="/fox-full.png" 
                alt="CrazyFox Hero"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </div>
          </motion.div>
        </div>
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
        <CrazyAbout/>
      </motion.section>

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

      <motion.section 
        id="roadmap" 
        className={styles.roadmap}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <CrazyRoadmapMap/>
      </motion.section>

      <motion.section 
        id="community" 
        className={styles.community}
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
  );
};

// Main Export with ThirdWeb Provider
export default function Home() {
  return (
    <>
      <Head>
        <title>CrazyFox | The Wildest Meme Coin on BSC 🦊</title>
        <meta name="description" content="Join the CrazyFox revolution! The most exciting meme coin on Binance Smart Chain with locked liquidity and moon mission." />
        <meta name="keywords" content="CrazyFox, CRFX, meme coin, BSC, cryptocurrency, DeFi, moon mission" />
        <meta property="og:title" content="CrazyFox | The Wildest Meme Coin on BSC 🦊" />
        <meta property="og:description" content="Join the CrazyFox revolution! 65% liquidity locked forever, aggressive marketing, and moon mission ready!" />
        <meta property="og:image" content="/fox-full.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CrazyFox | The Wildest Meme Coin on BSC 🦊" />
        <meta name="twitter:description" content="Join the CrazyFox revolution! The most secure and exciting meme coin on BSC." />
        <meta name="twitter:image" content="/fox-full.png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/fox.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <ThirdwebProvider>
        <HomeContent />
      </ThirdwebProvider>
    </>
  );
}