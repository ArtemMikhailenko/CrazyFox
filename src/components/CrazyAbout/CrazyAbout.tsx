import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CrazyAbout.module.css';

const CrazyAbout = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const features = [
    { 
      icon: '🔥', 
      title: 'Community Driven', 
      desc: 'Built by the community, for the community. Every decision is made together!',
      longDesc: 'Our decentralized community governs every major decision through voting. From marketing campaigns to partnership deals, every CrazyFox holder has a voice in shaping our future.',
      color: '#FF6B35',
      bgGradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
    },
    { 
      icon: '💎', 
      title: 'Diamond Hands', 
      desc: 'Strong tokenomics designed to reward long-term holders and punish paper hands.',
      longDesc: 'Our innovative reflection mechanism rewards holders with passive income. The longer you hold, the more $CRFX tokens you earn automatically. Diamond hands are rewarded, paper hands pay the price.',
      color: '#4ECDC4',
      bgGradient: 'linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%)'
    },
    { 
      icon: '🚀', 
      title: 'To The Moon', 
      desc: 'Aggressive marketing campaigns and partnerships to ensure maximum visibility.',
      longDesc: 'Strategic partnerships with major influencers, listings on top exchanges, and viral marketing campaigns. We\'re not just going to the moon - we\'re building a rocket ship to Mars!',
      color: '#96CEB4',
      bgGradient: 'linear-gradient(135deg, #96CEB4 0%, #6BCF7F 100%)'
    },
    { 
      icon: '🦊', 
      title: 'Crazy Utility', 
      desc: 'NFTs, games, and DeFi integration coming soon to add real utility to $CRFX.',
      longDesc: 'CrazyFox NFT collection, Play-to-Earn gaming ecosystem, staking pools, and our own DEX. Real utility that goes beyond just being a meme coin.',
      color: '#FECA57',
      bgGradient: 'linear-gradient(135deg, #FECA57 0%, #FF9FF3 100%)'
    }
  ];

  const stats = [
    { number: '1K+', label: 'Holders', icon: '👥' },
    { number: '$300K+', label: 'Market Cap', icon: '💰' },
    { number: '50K+', label: 'Community', icon: '🌍' },
    { number: '24/7', label: 'Support', icon: '🛠️' }
  ];

  // Initialize visibility
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Auto-rotation with pause functionality
  useEffect(() => {
    const startInterval = () => {
      //@ts-ignore
      intervalRef.current = setInterval(() => {
        if (!isPaused) {
          setActiveFeature((prev) => (prev + 1) % features.length);
        }
      }, 5000); // Increased interval to 5 seconds
    };

    startInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, features.length]);

  // Handle manual feature selection
  const handleFeatureClick = (index:number) => {
    setActiveFeature(index);
    setIsPaused(true);
    
    // Resume auto-rotation after 8 seconds of inactivity
    setTimeout(() => {
      setIsPaused(false);
    }, 8000);
  };

  // Pause on hover
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div className={styles.aboutSection}>
      <div className={styles.aboutContainer}>
        {/* Title Section - Simplified animation */}
        <motion.div 
          className={styles.titleSection}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className={styles.sectionTitle}>
            Why CrazyFox? 🦊
          </h2>
          <p className={styles.sectionSubtitle}>
            Join the wildest community in crypto and discover what makes us different
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className={styles.mainContent}>
          {/* Left Side - Fox Team Image */}
          <motion.div 
            className={styles.imageSection}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className={styles.foxTeamContainer}>
              <motion.img 
                src="/fox-team.png"
                alt="CrazyFox Team"
                className={styles.foxTeamImage}
                initial={{ scale: 0.95 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true }}
              />
              
              {/* Simplified glow effect */}
              <div className={styles.imageGlow} />
            </div>

            {/* Stats Cards - Reduced animation complexity */}
            <motion.div 
              className={styles.statsGrid}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={styles.statCard}
                >
                  <div className={styles.statIcon}>{stat.icon}</div>
                  <div className={styles.statNumber}>{stat.number}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Features */}
          <motion.div 
            className={styles.featuresSection}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className={styles.featuresContainer}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`${styles.featureCard} ${activeFeature === index ? styles.active : ''}`}
                  onClick={() => handleFeatureClick(index)}
                  style={{
                    borderColor: activeFeature === index ? feature.color : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div 
                    className={styles.featureIcon}
                    style={{
                      background: activeFeature === index ? feature.bgGradient : 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {feature.icon}
                  </div>
                  
                  <div className={styles.featureContent}>
                    <h3 className={styles.featureTitle}>{feature.title}</h3>
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={activeFeature === index ? 'long' : 'short'}
                        className={styles.featureDesc}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {activeFeature === index ? feature.longDesc : feature.desc}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  {/* Active Indicator - Simplified */}
                  {activeFeature === index && (
                    <div 
                      className={styles.activeIndicator}
                      style={{ background: feature.color }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Feature Navigation Dots */}
            <div className={styles.featureNavigation}>
              {features.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.navDot} ${activeFeature === index ? styles.activeDot : ''}`}
                  onClick={() => handleFeatureClick(index)}
                  style={{
                    backgroundColor: activeFeature === index ? features[index].color : 'rgba(255, 255, 255, 0.3)'
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CrazyAbout;