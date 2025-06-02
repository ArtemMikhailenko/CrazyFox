'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Ethereum provider types
interface EthereumProvider {
  isMetaMask?: boolean;
  isTrust?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (accounts: string[]) => void) => void;
  removeListener: (event: string, callback: (accounts: string[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
import Head from 'next/head';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { Particles } from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import confetti from 'canvas-confetti';
import styles from './page.module.css';
import CrazyTokenomics from '@/components/CrazyTokenomics/CrazyTokenomics';
import CrazyAbout from '@/components/CrazyAbout/CrazyAbout';
import CrazyCommunity from '@/components/CrazyCommunity/CrazyCommunity';
import CrazyRoadmapMap from '@/components/CrazyRoadmap/CrazyRoadmap';

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

// Wallet Connection Hook with multiple wallet support
const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletType, setWalletType] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);

  const connectMetaMask = async () => {
    if (typeof window !== 'undefined' && !window.ethereum) {
      toast.error('MetaMask is not installed! Please install MetaMask first.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    if (!window.ethereum) return;

    setIsConnecting(true);
    try {
      // Request BSC network if not already connected
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }], // BSC Mainnet
        });
      } catch (switchError: any) {
        // Network not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'Binance Smart Chain',
              nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18,
              },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/'],
            }],
          });
        }
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        setWalletType('MetaMask');
        setShowWalletModal(false);
        toast.success('MetaMask connected successfully! 🦊');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
      toast.error('Failed to connect MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWalletConnect = async () => {
    toast.info('WalletConnect integration coming soon! 🚀');
    setShowWalletModal(false);
  };

  const connectTrustWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum?.isTrust) {
      setIsConnecting(true);
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          setWalletType('Trust Wallet');
          setShowWalletModal(false);
          toast.success('Trust Wallet connected successfully! 🦊');
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } catch (error) {
        console.error('Failed to connect Trust Wallet:', error);
        toast.error('Failed to connect Trust Wallet');
      } finally {
        setIsConnecting(false);
      }
    } else {
      toast.error('Trust Wallet not detected!');
      window.open('https://trustwallet.com/download', '_blank');
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress('');
    setWalletType('');
    toast.info('Wallet disconnected');
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            if (window.ethereum.isMetaMask) {
              setWalletType('MetaMask');
            } else if (window.ethereum.isTrust) {
              setWalletType('Trust Wallet');
            }
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    checkConnection();

    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAddress(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  return {
    isConnected,
    address,
    isConnecting,
    walletType,
    showWalletModal,
    setShowWalletModal,
    connectMetaMask,
    connectWalletConnect,
    connectTrustWallet,
    disconnectWallet,
    formatAddress
  };
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

  // Wallet hook
  const {
    isConnected,
    address,
    isConnecting,
    walletType,
    showWalletModal,
    setShowWalletModal,
    connectMetaMask,
    connectWalletConnect,
    connectTrustWallet,
    disconnectWallet,
    formatAddress
  } = useWallet();

  // Typewriter effect for hero title
  const { displayedText: heroText, isComplete: heroComplete } = useTypewriter(
    "Welcome to the CrazyFox Revolution!", 100
  );

  // Animated counters
  const holdersCount = useAnimatedCounter(1000, 3000, showStats);
  const marketCapCount = useAnimatedCounter(50, 3000, showStats);
  const communityCount = useAnimatedCounter(280000, 3000, showStats);
  const raisedAmount = useAnimatedCounter(262736, 3000, showStats); // Новый счетчик для собранной суммы

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
    if (!isConnected) {
      toast.warning('Please connect your wallet first! 🦊');
      return;
    }
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.8 }
    });
    toast.success('Redirecting to buy $CRFX! 🚀', { theme: "dark" });
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
          //@ts-ignore
          options={particlesConfig}
          className={styles.particles}
        />

        {/* Music Player */}
        <MusicPlayer />

        {/* Wallet Modal */}
        <AnimatePresence>
          {showWalletModal && (
            <motion.div 
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWalletModal(false)}
            >
              <motion.div 
                className={styles.walletModal}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <h3>Connect Your Wallet</h3>
                  <button 
                    className={styles.closeButton}
                    onClick={() => setShowWalletModal(false)}
                  >
                    ✕
                  </button>
                </div>
                
                <div className={styles.walletOptions}>
                  <motion.button
                    className={styles.walletOption}
                    onClick={connectMetaMask}
                    disabled={isConnecting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={styles.walletIcon}>🦊</div>
                    <div className={styles.walletInfo}>
                      <h4>MetaMask</h4>
                      <p>Connect using browser wallet</p>
                    </div>
                  </motion.button>

                  <motion.button
                    className={styles.walletOption}
                    onClick={connectTrustWallet}
                    disabled={isConnecting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={styles.walletIcon}>🔷</div>
                    <div className={styles.walletInfo}>
                      <h4>Trust Wallet</h4>
                      <p>Connect using Trust Wallet</p>
                    </div>
                  </motion.button>

                  <motion.button
                    className={styles.walletOption}
                    onClick={connectWalletConnect}
                    disabled={isConnecting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={styles.walletIcon}>🔗</div>
                    <div className={styles.walletInfo}>
                      <h4>WalletConnect</h4>
                      <p>Scan QR code with mobile wallet</p>
                    </div>
                  </motion.button>
                </div>

                <div className={styles.modalFooter}>
                  <p>New to wallets? <a href="https://ethereum.org/en/wallets/" target="_blank" rel="noopener noreferrer">Learn more</a></p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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

            <div className={styles.navActions}>
              {/* Wallet Connection Button */}
              <motion.button
                className={`${styles.walletButton} ${isConnected ? styles.connected : ''}`}
                onClick={isConnected ? disconnectWallet : () => setShowWalletModal(true)}
                disabled={isConnecting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isConnecting ? (
                  <span>🔄 Connecting...</span>
                ) : isConnected ? (
                  <span>
                    <span className={styles.walletIcon}>
                      {walletType === 'MetaMask' ? '🦊' : walletType === 'Trust Wallet' ? '🔷' : '🔗'}
                    </span>
                    <span className={styles.walletAddress}>{formatAddress(address)}</span>
                  </span>
                ) : (
                  <span>
                    <span className={styles.walletIcon}>🔗</span>
                    <span className={styles.walletText}>Connect Wallet</span>
                  </span>
                )}
              </motion.button>

              {/* Buy Button */}
              <motion.button
                className={`${styles.buyButton} ${!isConnected ? styles.disabled : ''}`}
                onClick={handleBuyClick}
                whileHover={isConnected ? { scale: 1.05, boxShadow: "0 0 25px #FF6B35" } : {}}
                whileTap={isConnected ? { scale: 0.95 } : {}}
              >
                🚀 Buy $CRFX
              </motion.button>
            </div>
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
                  className={`${styles.primaryButton} ${!isConnected ? styles.disabled : ''}`}
                  onClick={handleBuyClick}
                  whileHover={isConnected ? { scale: 1.05 } : {}}
                  whileTap={isConnected ? { scale: 0.95 } : {}}
                >
                  <span>🚀 Buy $CRFX Now</span>
                </motion.button>
                <motion.button
                  className={styles.secondaryButton}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>📊 Chart</span>
                </motion.button>
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
                      <div className={styles.progressBar}>
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
          <CrazyRoadmapMap/>
        </motion.section>

        {/* Community Section */}
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
    </>
  );
}