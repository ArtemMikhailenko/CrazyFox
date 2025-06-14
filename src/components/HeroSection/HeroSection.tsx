// components/HeroSection/HeroSection.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Particles } from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

// ThirdWeb v5 imports
import { 
  useActiveAccount,
  useReadContract,
  useSendTransaction
} from "thirdweb/react";
import { prepareContractCall, getContract } from "thirdweb";
import { bsc } from "thirdweb/chains";
import { toWei, toEther } from "thirdweb/utils";
import { createThirdwebClient } from "thirdweb";

import styles from './HeroSection.module.css';

// ThirdWeb client configuration
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "d28d89a66e8eb5e73d6a9c8eeaa0645a"
});

// Contract addresses
const PRESALE_CONTRACT_ADDRESS = "0xD80AC08a2effF26c4465aAF6ff00BE3DaecFF476";

// Contract instance
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

// Buy Token Component
const BuyTokenComponent = () => {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const [buyAmount, setBuyAmount] = useState('0.1');
  const [showBuyModal, setShowBuyModal] = useState(false);

  // Read contract data
  const { data: presaleInfo } = useReadContract({
    contract: presaleContract,
    method: "function getPresaleInfo() view returns (uint256 _totalSoldTokens, uint256 _totalRaisedUSD, uint256 _tokenPriceUSD, address _paymentWallet, address _tokenWallet, uint256 _bnbPrice, uint256 _ethPrice)",
    params: []
  });

  const { data: tokensForBNB } = useReadContract({
    contract: presaleContract,
    method: "function calculateTokensForBNB(uint256 bnbAmount) view returns (uint256)",
    params: [toWei(buyAmount || "0")]
  });

  const { data: currentPrices } = useReadContract({
    contract: presaleContract,
    method: "function getCurrentPrices() view returns (uint256 bnbPrice, uint256 ethPrice)",
    params: []
  });

  const calculateTokenAmount = () => {
    if (tokensForBNB) {
      return toEther(tokensForBNB);
    }
    return "0";
  };

  const getTokenPriceInUSD = () => {
    if (presaleInfo) {
      return parseFloat(toEther(presaleInfo[2]));
    }
    return 0.005;
  };

  const getBNBPriceInUSD = () => {
    if (currentPrices) {
      return parseFloat(currentPrices[0].toString()) / 1e8;
    }
    return 300;
  };

  const handleBuyTokens = async () => {
    if (!account) {
      toast.error("Please connect your wallet first! 🦊");
      return;
    }
    
    if (!buyAmount || Number(buyAmount) <= 0) {
      toast.error("Please enter a valid amount!");
      return;
    }

    try {
      const transaction = prepareContractCall({
        contract: presaleContract,
        method: "function buyWithBNB() payable",
        params: [],
        value: toWei(buyAmount)
      });

      sendTransaction(transaction, {
        onSuccess: () => {
          toast.success("🎉 Purchase successful! Welcome to the CrazyFox family! 🦊");
          setBuyAmount("0.1");
          setShowBuyModal(false);
          
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF6B35', '#4ECDC4', '#45B7D1']
          });
        },
        onError: (error) => {
          let errorMessage = "Transaction failed";
          if (error.message?.includes("insufficient funds")) {
            errorMessage = "Insufficient BNB balance for transaction + gas fees";
          } else if (error.message?.includes("user rejected") || error.message?.includes("denied")) {
            errorMessage = "Transaction cancelled by user";
          } else if (error.message?.includes("allowance")) {
            errorMessage = "⚠️ Contract Setup Issue: The presale contract doesn't have permission to transfer tokens.";
          }
          
          toast.error(errorMessage);
        }
      });
    } catch (err) {
      toast.error("Failed to prepare transaction. Please try again.");
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
                <h3>🦊 Buy CRFX Tokens</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowBuyModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className={styles.buyContent}>
                {presaleInfo && (
                  <div className={styles.presaleStats}>
                    <h4>📊 Presale Stats</h4>
                    <div className={styles.statGrid}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>💰 Token Price:</span>
                        <span className={styles.statValue}>${getTokenPriceInUSD().toFixed(3)} USD</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>🎯 Total Sold:</span>
                        <span className={styles.statValue}>{parseFloat(toEther(presaleInfo[0])).toLocaleString()} CRFX</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>💵 Total Raised:</span>
                        <span className={styles.statValue}>$320 500 USD</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>🔥 BNB Price:</span>
                        <span className={styles.statValue}>${getBNBPriceInUSD().toFixed(0)} USD</span>
                      </div>
                    </div>
                  </div>
                )}

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
                        ~{parseFloat(calculateTokenAmount()).toLocaleString()} CRFX
                      </span>
                    </div>
                    <div className={styles.usdValue}>
                      ≈ ${(parseFloat(buyAmount || "0") * getBNBPriceInUSD()).toFixed(2)} USD value
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
                        <span>🔄 Processing...</span>
                      ) : (
                        <span>🚀 Buy Tokens</span>
                      )}
                    </motion.button>
                  </div>

                  <div className={styles.contractWarning}>
                    <h4>⚠️ Known Issue</h4>
                    <p>If you get an "allowance" error, it means the contract needs to be configured by the team.</p>
                  </div>
                </div>

                <div className={styles.buyFooter}>
                  <p className={styles.disclaimer}>
                    ⚠️ Please ensure you have enough BNB for gas fees (~$1-2)
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

// Main HeroSection Component
interface HeroSectionProps {
  isLoaded: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ isLoaded }) => {
  const [showStats, setShowStats] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Read presale data
  const { data: presaleInfo } = useReadContract({
    contract: presaleContract,
    method: "function getPresaleInfo() view returns (uint256 _totalSoldTokens, uint256 _totalRaisedUSD, uint256 _tokenPriceUSD, address _paymentWallet, address _tokenWallet, uint256 _bnbPrice, uint256 _ethPrice)",
    params: []
  });

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
              <div className={styles.priceInfo}>
                <span className={styles.priceLabel}>
                  <span className={styles.priceIcon}>💰</span>Current Price
                </span>
                <span className={styles.priceAmount}>
                  {presaleInfo ? 
                    `$${parseFloat(toEther(presaleInfo[2])).toFixed(3)}` : 
                    '$0.005'
                  }
                </span>
              </div>
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
                 
                     
                    $320,500
                  
                </motion.div>
                <div className={styles.raisedProgress}>
                  <div className={styles.progressBarContainer}>
                    <motion.div 
                      className={styles.progressFill}
                      initial={{ width: 0 }}
                      animate={{ width: "32%" }}
                      transition={{ delay: 2, duration: 2, ease: "easeOut" }}
                    />
                  </div>
                  <div className={styles.progressText}>32% of soft cap reached</div>
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
  );
};

export default HeroSection;