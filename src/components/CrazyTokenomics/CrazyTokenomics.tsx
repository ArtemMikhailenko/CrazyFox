import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import styles from './CrazyTokenomics.module.css';

const CrazyTokenomics = () => {
  const [activeSlice, setActiveSlice] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const tokenData = useMemo(() => [
    { 
      label: 'Presale', 
      percentage: 55, 
      color: '#FF6B35', 
      icon: '🚀',
      description: 'Early investor allocation',
      details: '550M tokens for community presale'
    },
    { 
      label: 'Listing & Liquidity', 
      percentage: 10, 
      color: '#4ECDC4', 
      icon: '💧',
      description: 'DEX listing and liquidity pool',
      details: '100M tokens for trading launch'
    },
    { 
      label: 'Marketing & Partnerships', 
      percentage: 15, 
      color: '#45B7D1', 
      icon: '📢',
      description: 'Aggressive marketing campaigns',
      details: '150M tokens for moon mission'
    },
    { 
      label: 'Development', 
      percentage: 10, 
      color: '#96CEB4', 
      icon: '⚙️',
      description: 'Platform development and utilities',
      details: '100M tokens for building ecosystem'
    },
    { 
      label: 'Team & Advisors', 
      percentage: 10, 
      color: '#FECA57', 
      icon: '👥',
      description: 'Team allocation with vesting',
      details: '100M tokens locked for 12 months'
    }
  ], []);

  const contractDetails = useMemo(() => ({
    address: "0x874641647B9d8a8d991c541BBD48bD597b85aE33",
    totalSupply: "1,000,000,000",
    network: "Binance Smart Chain",
    symbol: "$CRFX",
    taxes: {
      buy: 5,
      sell: 5,
      autoLP: 2,
      marketing: 2,
      reflections: 1
    }
  }), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Contract address copied! 🦊', {
        position: "top-right",
        autoClose: 2000,
        theme: "dark"
      });
      
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#FF6B35', '#4ECDC4', '#45B7D1']
      });
    } catch (err) {
      toast.error('Failed to copy!', { theme: "dark" });
    }
  }, []);

  const handleSliceHover = useCallback((index: number) => {
    setActiveSlice(index);
  }, []);

  const handleSliceLeave = useCallback(() => {
    setActiveSlice(null);
  }, []);

  const createPieSlice = useCallback((item: any, index: number) => {
    const cumulativePercentage = tokenData
      .slice(0, index)
      .reduce((sum, data) => sum + data.percentage, 0);
    
    const startAngle = (cumulativePercentage / 100) * 360 - 90;
    const endAngle = ((cumulativePercentage + item.percentage) / 100) * 360 - 90;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const radius = 110;
    const centerX = 140;
    const centerY = 140;
    
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

    const isActive = activeSlice === index;

    return (
      <motion.path
        key={`slice-${index}`}
        d={pathData}
        fill={item.color}
        stroke="#0a0e1e"
        strokeWidth="3"
        className={styles.pieSlice}
        initial={{ 
          scale: 0, 
          opacity: 0
        }}
        animate={isVisible ? { 
          scale: isActive ? 1.08 : 1, 
          opacity: 1,
        } : {
          scale: 0,
          opacity: 0
        }}
        transition={{ 
          delay: index * 0.1,
          duration: 0.5,
          type: "spring",
          stiffness: 100
        }}
        style={{
          transformOrigin: `${centerX}px ${centerY}px`,
          filter: isActive ? `brightness(1.2) drop-shadow(0 0 15px ${item.color}50)` : 'brightness(1)',
          transition: 'filter 0.3s ease, transform 0.3s ease'
        }}
        onMouseEnter={() => handleSliceHover(index)}
        onMouseLeave={handleSliceLeave}
      />
    );
  }, [tokenData, isVisible, activeSlice, handleSliceHover, handleSliceLeave]);

  return (
    <div className={styles.tokenomicsSection}>
      <div className={styles.tokenomicsContainer}>
        <motion.h2 
          className={styles.tokenomicsTitle}
          initial={{ y: -20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className={styles.titleIcon}>💰</span>
          Crazy Tokenomics
        </motion.h2>

        <div className={styles.tokenomicsContent}>
          {/* Left side - Chart */}
          <motion.div 
            className={styles.chartSection}
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className={styles.chartContainer}>
              <div className={styles.pieChart}>
                <svg 
                  width="280" 
                  height="280" 
                  viewBox="0 0 280 280"
                  className={styles.chartSvg}
                >
                  {tokenData.map((item, index) => 
                    createPieSlice(item, index)
                  )}
                </svg>
                
                <div className={styles.chartCenter}>
                  <motion.div 
                    className={styles.centerContent}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                  </motion.div>
                </div>
              </div>
            </div>
            
            {/* Fox Image */}
            <motion.div 
              className={styles.muscleFoxContainer}
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <img 
                src="/fox-tokenomic.png"
                alt="CrazyFox Tokenomics"
                className={styles.muscleFoxImage}
                loading="lazy"
              />
              <div className={styles.foxGlow} />
            </motion.div>
          </motion.div>

          {/* Right side - Legend */}
          <motion.div 
            className={styles.legendSection}
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.legend}>
              {tokenData.map((item, index) => (
                <motion.div
                  key={`legend-${index}`}
                  className={`${styles.legendItem} ${activeSlice === index ? styles.active : ''}`}
                  onMouseEnter={() => handleSliceHover(index)}
                  onMouseLeave={handleSliceLeave}
                  initial={{ y: 15, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ 
                    delay: index * 0.05,
                    duration: 0.4
                  }}
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
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <h3 className={styles.contractTitle}>
            <span className={styles.contractIcon}>📊</span>
            Contract Details
          </h3>
          
          <div className={styles.contractGrid}>
            <div className={styles.contractInfo}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>🎯 Total Supply:</span>
                  <span className={styles.infoValue}>{contractDetails.totalSupply} $CRFX</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>🌐 Network:</span>
                  <span className={styles.infoValue}>{contractDetails.network}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>💎 Symbol:</span>
                  <span className={styles.infoValue}>{contractDetails.symbol}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>📈 Tax:</span>
                  <span className={styles.infoValue}>0% Buy / 0% Sell</span>
                </div>
              </div>
              
              <motion.div 
                className={styles.contractAddress}
                onClick={() => copyToClipboard(contractDetails.address)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.addressLabel}>📋 Contract Address:</div>
                <div className={styles.addressText}>
                  {contractDetails.address.slice(0, 12)}...{contractDetails.address.slice(-10)}
                </div>
                <button className={styles.copyButton}>Copy</button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CrazyTokenomics;