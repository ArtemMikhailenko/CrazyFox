import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import styles from './CrazyTokenomics.module.css';

const CrazyTokenomics = () => {
  const [activeSlice, setActiveSlice] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const tokenData = [
    { 
      label: 'Liquidity Pool', 
      percentage: 40, 
      color: '#FF6B35', 
      icon: '💧',
      description: 'Locked liquidity for stable trading',
      details: '400M tokens permanently locked'
    },
    { 
      label: 'Community Rewards', 
      percentage: 25, 
      color: '#4ECDC4', 
      icon: '🎁',
      description: 'Airdrops, contests, and community events',
      details: '250M tokens for the crazy fox family'
    },
    { 
      label: 'Marketing & Partnerships', 
      percentage: 15, 
      color: '#45B7D1', 
      icon: '🚀',
      description: 'Aggressive marketing campaigns',
      details: '150M tokens for moon mission'
    },
    { 
      label: 'Development', 
      percentage: 10, 
      color: '#96CEB4', 
      icon: '⚙️',
      description: 'Platform development and utilities',
      details: '100M tokens for building the ecosystem'
    },
    { 
      label: 'Team & Advisors', 
      percentage: 10, 
      color: '#FECA57', 
      icon: '👥',
      description: 'Team allocation with vesting',
      details: '100M tokens locked for 12 months'
    }
  ];

  const contractDetails = {
    address: "0x742d35Cc7cF66f5e8f20A4C1b8c4A6b8b4E6F5d1C2",
    totalSupply: "1,000,000,000",
    network: "Binance Smart Chain",
    symbol: "$CFOX",
    taxes: {
      buy: 5,
      sell: 5,
      autoLP: 2,
      marketing: 2,
      reflections: 1
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);
//@ts-ignore
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Contract address copied! 🦊', {
        position: "top-right",
        autoClose: 2000,
        theme: "dark"
      });
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B35', '#4ECDC4', '#45B7D1']
      });
    } catch (err) {
      toast.error('Failed to copy!', { theme: "dark" });
    }
  };
//@ts-ignore
  const createPieSlice = (item, index, total) => {
    const cumulativePercentage = tokenData
      .slice(0, index)
      .reduce((sum, data) => sum + data.percentage, 0);
    
    const startAngle = (cumulativePercentage / 100) * 360 - 90;
    const endAngle = ((cumulativePercentage + item.percentage) / 100) * 360 - 90;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const radius = 120;
    const centerX = 150;
    const centerY = 150;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = item.percentage > 50 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    return (
      <motion.path
        key={index}
        d={pathData}
        fill={item.color}
        stroke="#0a0e1e"
        strokeWidth="2"
        className={styles.pieSlice}
        style={{ 
          transformOrigin: `${centerX}px ${centerY}px`,
          filter: activeSlice === index ? 'brightness(1.2) drop-shadow(0 0 20px currentColor)' : 'brightness(1)'
        }}
        initial={{ scale: 0, rotate: -180 }}
        animate={isVisible ? { 
          scale: 1, 
          rotate: 0
        } : {}}
        transition={{ 
          delay: index * 0.2,
          duration: 0.8,
          type: "spring",
          stiffness: 100
        }}
        whileHover={{ 
          scale: 1.05,
          filter: 'brightness(1.3) drop-shadow(0 0 25px currentColor)'
        }}
        onMouseEnter={() => setActiveSlice(index)}
        onMouseLeave={() => setActiveSlice(null)}
      />
    );
  };

  return (
    <div className={styles.tokenomicsSection}>
      <div className={styles.tokenomicsContainer}>
        <motion.h2 
          className={styles.tokenomicsTitle}
          initial={{ y: -50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Crazy Tokenomics 🚀
        </motion.h2>

        <div className={styles.tokenomicsContent}>
          {/* Left side - Chart and Fox */}
          <motion.div 
            className={styles.chartSection}
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.chartContainer}>
              <div className={styles.pieChart}>
                <svg width="300" height="300" viewBox="0 0 300 300">
                  {tokenData.map((item, index) => 
                    createPieSlice(item, index, tokenData.length)
                  )}
                </svg>
                <div className={styles.chartCenter}>
          
                </div>
              </div>
            </div>
            
            {/* Muscle Fox Image */}
            <motion.div 
              className={styles.muscleFoxContainer}
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.5, type: "spring" }}
              viewport={{ once: true }}
            >
              <img 
                src="/fox-tokenomic.png"
                alt="Muscle Fox with Coin"
                className={styles.muscleFoxImage}
              />
              <motion.div 
                className={styles.foxGlow}
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </motion.div>

          {/* Right side - Legend */}
          <motion.div 
            className={styles.legendSection}
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className={styles.legend}>
              {tokenData.map((item, index) => (
                <motion.div
                  key={index}
                  className={`${styles.legendItem} ${activeSlice === index ? styles.active : ''}`}
                  whileHover={{ scale: 1.02, y: -5 }}
                  //@ts-ignore
                  onMouseEnter={() => setActiveSlice(index)}
                  onMouseLeave={() => setActiveSlice(null)}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className={styles.legendHeader}>
                    <div 
                      className={styles.legendColor} 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className={styles.legendIcon}>{item.icon}</span>
                    <span className={styles.legendLabel}>{item.label}</span>
                    <span className={styles.legendPercentage}>{item.percentage}%</span>
                  </div>
                  <div className={styles.legendDescription}>{item.description}</div>
                  <div className={styles.legendDetails}>{item.details}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Contract Section */}
        <motion.div 
          className={styles.contractSection}
          initial={{ y: 100, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className={styles.contractTitle}>📊 Contract Details & Tax Structure</h3>
          
          <div className={styles.contractGrid}>
            <div className={styles.contractInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Total Supply:</span>
                <span className={styles.infoValue}>{contractDetails.totalSupply} $CFOX</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Network:</span>
                <span className={styles.infoValue}>{contractDetails.network}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Symbol:</span>
                <span className={styles.infoValue}>{contractDetails.symbol}</span>
              </div>
              
              <motion.div 
                className={styles.contractAddress}
                onClick={() => copyToClipboard(contractDetails.address)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.addressText}>
                  {contractDetails.address.slice(0, 10)}...{contractDetails.address.slice(-8)}
                </div>
                <button className={styles.copyButton}>📋 Copy</button>
              </motion.div>
            </div>

            <div className={styles.taxInfo}>
              <div className={styles.taxItem}>
                <span className={styles.taxPercentage}>{contractDetails.taxes.buy}%</span>
                <div className={styles.taxLabel}>Buy Tax</div>
              </div>
              <div className={styles.taxItem}>
                <span className={styles.taxPercentage}>{contractDetails.taxes.sell}%</span>
                <div className={styles.taxLabel}>Sell Tax</div>
              </div>
              <div className={styles.taxItem}>
                <span className={styles.taxPercentage}>{contractDetails.taxes.autoLP}%</span>
                <div className={styles.taxLabel}>Auto LP</div>
              </div>
              <div className={styles.taxItem}>
                <span className={styles.taxPercentage}>{contractDetails.taxes.marketing}%</span>
                <div className={styles.taxLabel}>Marketing</div>
              </div>
              <div className={styles.taxItem}>
                <span className={styles.taxPercentage}>{contractDetails.taxes.reflections}%</span>
                <div className={styles.taxLabel}>Reflections</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CrazyTokenomics;