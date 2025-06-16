import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import styles from './CrazyTokenomics.module.css';

const CrazyTokenomics = () => {
  const [activeSlice, setActiveSlice] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  const tokenData = useMemo(() => [
    { 
      label: 'Presale', 
      percentage: 55, 
      color: '#FF6B35', 
      icon: '🚀',
      description: 'Early investor allocation',
      details: '550M tokens for community presale',
      gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
    },
    { 
      label: 'Listing & Liquidity', 
      percentage: 10, 
      color: '#4ECDC4', 
      icon: '💧',
      description: 'DEX listing and liquidity pool',
      details: '100M tokens for trading launch',
      gradient: 'linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%)'
    },
    { 
      label: 'Marketing & Partnerships', 
      percentage: 15, 
      color: '#45B7D1', 
      icon: '📢',
      description: 'Aggressive marketing campaigns',
      details: '150M tokens for moon mission',
      gradient: 'linear-gradient(135deg, #45B7D1 0%, #96CEB4 100%)'
    },
    { 
      label: 'Development', 
      percentage: 10, 
      color: '#96CEB4', 
      icon: '⚙️',
      description: 'Platform development and utilities',
      details: '100M tokens for building ecosystem',
      gradient: 'linear-gradient(135deg, #96CEB4 0%, #6BCF7F 100%)'
    },
    { 
      label: 'Team & Advisors', 
      percentage: 10, 
      color: '#FECA57', 
      icon: '👥',
      description: 'Team allocation with vesting',
      details: '100M tokens locked for 12 months',
      gradient: 'linear-gradient(135deg, #FECA57 0%, #FF9FF3 100%)'
    }
  ], []);

  const contractDetails = useMemo(() => ({
    address: "0xa2c959a7Fbf6d96eA4170e724D871E0556cd8556",
    totalSupply: "1,000,000,000",
    network: "Binance Smart Chain",
    symbol: "$CRFX",
    taxes: {
      buy: 0,
      sell: 0
    }
  }), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = useCallback(async (text:any) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Contract address copied! 🦊', {
        position: "top-right",
        autoClose: 2000,
        theme: "dark"
      });
      
      // Epic confetti explosion
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B35', '#4ECDC4', '#45B7D1', '#FECA57']
      });
      
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 1000);
    } catch (err) {
      toast.error('Failed to copy!', { theme: "dark" });
    }
  }, []);

  const handleSliceHover = useCallback((index:any) => {
    setActiveSlice(index);
  }, []);

  const handleSliceLeave = useCallback(() => {
    setActiveSlice(null);
  }, []);

  const createPieSlice = useCallback((item:any, index:any) => {
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
      <path
        key={`slice-${index}`}
        d={pathData}
        fill={item.color}
        stroke="#0a0e1e"
        strokeWidth="3"
        className={`${styles.pieSlice} ${isActive ? styles.activeSlice : ''}`}
        style={{
          transformOrigin: `${centerX}px ${centerY}px`,
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.3s ease',
          filter: isActive ? `brightness(1.3) drop-shadow(0 0 20px ${item.color}80)` : 'brightness(1)'
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
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className={styles.titleIcon}>💰</span>
          Crazy Tokenomics
          {showFireworks && <span className={styles.fireworks}>🎆</span>}
        </motion.h2>

        <div className={styles.tokenomicsContent}>
          {/* Left side - Chart */}
          <motion.div 
            className={styles.chartSection}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
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
                  {/* Animated background ring */}
                  <circle
                    cx="140"
                    cy="140"
                    r="115"
                    fill="none"
                    stroke="rgba(255, 107, 53, 0.1)"
                    strokeWidth="10"
                    className={styles.backgroundRing}
                  />
                  
                  {tokenData.map((item, index) => 
                    createPieSlice(item, index)
                  )}
                </svg>
                
                
              </div>
            </div>
            
            {/* Enhanced Fox Image */}
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
              
              {/* Floating stats around fox */}
              <div className={styles.floatingStats}>
                <div className={styles.floatingStat} style={{ top: '10%', right: '-20px' }}>
                  📈 +2000%
                </div>
                <div className={styles.floatingStat} style={{ bottom: '20%', left: '-20px' }}>
                  🔥 HODL
                </div>
                <div className={styles.floatingStat} style={{ top: '60%', right: '-30px' }}>
                  🚀 MOON
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right side - Enhanced Legend */}
          <motion.div 
            className={styles.legendSection}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.legend}>
              {tokenData.map((item, index) => (
                <div
                  key={`legend-${index}`}
                  className={`${styles.legendItem} ${activeSlice === index ? styles.active : ''}`}
                  onMouseEnter={() => handleSliceHover(index)}
                  onMouseLeave={handleSliceLeave}
                >
                  <div className={styles.legendHeader}>
                    <div 
                      className={styles.legendColor} 
                      style={{ background: item.gradient }}
                    />
                    <span className={styles.legendIcon}>{item.icon}</span>
                    <span className={styles.legendLabel}>{item.label}</span>
                    <span className={styles.legendPercentage}>{item.percentage}%</span>
                  </div>
                  <div className={styles.legendDescription}>{item.description}</div>
                  <div className={styles.legendDetails}>{item.details}</div>
                  
                  {/* Progress bar */}
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${item.percentage * 1.8}%`,
                        background: item.gradient 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Enhanced Contract Section */}
        <motion.div 
          className={styles.contractSection}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <h3 className={styles.contractTitle}>
            <span className={styles.contractIcon}>📊</span>
            Contract Details
            <div className={styles.titleGlow} />
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
              </div>
              
              <div 
                className={styles.contractAddress}
                onClick={() => copyToClipboard(contractDetails.address)}
              >
                <div className={styles.addressLabel}>📋 Contract Address:</div>
                <div className={styles.addressText}>
                  {contractDetails.address.slice(0, 12)}...{contractDetails.address.slice(-10)}
                </div>
                <button className={styles.copyButton}>
                  Copy Address 🔗
                </button>
                
                {/* Hover effect */}
                <div className={styles.copyHoverEffect} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CrazyTokenomics;