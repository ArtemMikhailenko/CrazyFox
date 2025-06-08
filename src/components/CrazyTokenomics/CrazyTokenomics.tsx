import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import styles from './CrazyTokenomics.module.css';

const CrazyTokenomics = () => {
  const [activeSlice, setActiveSlice] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);

  const tokenData = useMemo(() => [
    { 
      label: 'Liquidity Pool', 
      percentage: 65, 
      color: '#FF6B35', 
      icon: '💧',
      description: 'Locked liquidity for stable trading',
      details: '650M tokens permanently locked'
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

  // Initialize visibility with proper sequencing
  useEffect(() => {
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    const chartTimer = setTimeout(() => {
      setIsChartReady(true);
    }, 600);

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(chartTimer);
    };
  }, []);

  const copyToClipboard = useCallback(async (text:any) => {
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
  }, []);

  const handleSliceHover = useCallback((index:any) => {
    setActiveSlice(index);
  }, []);

  const handleSliceLeave = useCallback(() => {
    setActiveSlice(null);
  }, []);
  //@ts-ignore
  const createPieSlice = useCallback((item, index) => {
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

    const isActive = activeSlice === index;

    return (
      <motion.path
        key={`slice-${index}`}
        d={pathData}
        fill={item.color}
        stroke="#0a0e1e"
        strokeWidth="2"
        className={styles.pieSlice}
        style={{ 
          transformOrigin: `${centerX}px ${centerY}px`,
          transition: 'filter 0.3s ease, transform 0.3s ease',
          willChange: 'transform, filter'
        }}
        initial={{ 
          scale: 0, 
          rotate: 0,
          opacity: 0
        }}
        animate={isChartReady ? { 
          scale: isActive ? 1.05 : 1, 
          rotate: 0,
          opacity: 1,
          filter: isActive 
            ? 'brightness(1.3) drop-shadow(0 0 20px currentColor)' 
            : 'brightness(1)'
        } : {
          scale: 0,
          rotate: 0,
          opacity: 0
        }}
        transition={{ 
          delay: index * 0.15,
          duration: 0.6,
          type: "spring",
          stiffness: 120,
          damping: 15
        }}
        onMouseEnter={() => handleSliceHover(index)}
        onMouseLeave={handleSliceLeave}
      />
    );
  }, [tokenData, isChartReady, activeSlice, handleSliceHover, handleSliceLeave]);

  return (
    <div className={styles.tokenomicsSection}>
      <div className={styles.tokenomicsContainer}>
        <motion.h2 
          className={styles.tokenomicsTitle}
          initial={{ y: -30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Crazy Tokenomics 🚀
        </motion.h2>

        <div className={styles.tokenomicsContent}>
          {/* Left side - Chart and Fox */}
          <motion.div 
            className={styles.chartSection}
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className={styles.chartContainer}>
              <div className={styles.pieChart}>
                <motion.svg 
                  width="300" 
                  height="300" 
                  viewBox="0 0 300 300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isVisible ? 1 : 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <AnimatePresence>
                    {tokenData.map((item, index) => 
                      createPieSlice(item, index)
                    )}
                  </AnimatePresence>
                </motion.svg>
                <div className={styles.chartCenter}>
                  {/* Center content if needed */}
                </div>
              </div>
            </div>
            
            {/* Muscle Fox Image */}
            <motion.div 
              className={styles.muscleFoxContainer}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.4, 
                type: "spring",
                stiffness: 100,
                damping: 12
              }}
              viewport={{ once: true }}
            >
              <motion.img 
                src="/fox-tokenomic.png"
                alt="Muscle Fox with Coin"
                className={styles.muscleFoxImage}
                loading="lazy"
              />
              <motion.div 
                className={styles.foxGlow}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </motion.div>

          {/* Right side - Legend */}
          <motion.div 
            className={styles.legendSection}
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.legend}>
              {tokenData.map((item, index) => (
                <motion.div
                  key={`legend-${index}`}
                  className={`${styles.legendItem} ${activeSlice === index ? styles.active : ''}`}
                  style={{
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform'
                  }}
                  onMouseEnter={() => handleSliceHover(index)}
                  onMouseLeave={handleSliceLeave}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ 
                    delay: index * 0.08,
                    duration: 0.5
                  }}
                  viewport={{ once: true }}
                  animate={{
                    scale: activeSlice === index ? 1.02 : 1,
                    y: activeSlice === index ? -2 : 0
                  }}
                >
                  <div className={styles.legendHeader}>
                    <motion.div 
                      className={styles.legendColor} 
                      style={{ backgroundColor: item.color }}
                      animate={{
                        scale: activeSlice === index ? 1.2 : 1,
                        boxShadow: activeSlice === index 
                          ? `0 0 20px ${item.color}50` 
                          : '0 0 0px transparent'
                      }}
                      transition={{ duration: 0.3 }}
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
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <h3 className={styles.contractTitle}>📊 Contract Details & Tax Structure</h3>
          
          <div className={styles.contractGrid}>
            <motion.div 
              className={styles.contractInfo}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Total Supply:</span>
                <span className={styles.infoValue}>{contractDetails.totalSupply} $CRFX</span>
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
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 5px 20px rgba(255, 107, 53, 0.3)"
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                <div className={styles.addressText}>
                  {contractDetails.address.slice(0, 10)}...{contractDetails.address.slice(-8)}
                </div>
                <button className={styles.copyButton}>📋 Copy</button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CrazyTokenomics;