'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './CrazyCommunity.module.css';

const CrazyCommunity = () => {
  const [activeCard, setActiveCard] = useState(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const controls = useAnimation();

  // Language hook
  const { getComponentText } = useLanguage();

  // Community stats
  const [stats, setStats] = useState({
    members: 0,
    messages: 0,
    countries: 0
  });

  const socialPlatforms = [
    { 
      icon: '💬', 
      name: getComponentText('crazyCommunity', 'socialPlatforms.telegram.name'),
      members: getComponentText('crazyCommunity', 'socialPlatforms.telegram.members'),
      color: '#0088cc',
      gradient: 'linear-gradient(135deg, #0088cc, #00a6d6)',
      description: getComponentText('crazyCommunity', 'socialPlatforms.telegram.description'),
      url: 'https://t.me/crazyfoxmeme',
      highlight: getComponentText('crazyCommunity', 'socialPlatforms.telegram.highlight')
    },
    { 
      icon: '🐦', 
      name: getComponentText('crazyCommunity', 'socialPlatforms.twitter.name'),
      members: getComponentText('crazyCommunity', 'socialPlatforms.twitter.members'),
      color: '#1da1f2',
      gradient: 'linear-gradient(135deg, #1da1f2, #0d8bd9)',
      description: getComponentText('crazyCommunity', 'socialPlatforms.twitter.description'),
      url: 'https://x.com/crazyfoxmeme?s=21',
      highlight: getComponentText('crazyCommunity', 'socialPlatforms.twitter.highlight')
    },
    { 
      icon: '🎵', 
      name: getComponentText('crazyCommunity', 'socialPlatforms.tiktok.name'),
      members: getComponentText('crazyCommunity', 'socialPlatforms.tiktok.members'),
      color: '#000000',
      gradient: 'linear-gradient(135deg, #000000, #ff0050)',
      description: getComponentText('crazyCommunity', 'socialPlatforms.tiktok.description'),
      url: 'https://www.tiktok.com/@crazyfoxmeme?_t=ZM-8wpwWp3NVAu&_r=1',
      highlight: getComponentText('crazyCommunity', 'socialPlatforms.tiktok.highlight')
    }
  ];

  // Animate stats when in view
  useEffect(() => {
    if (isInView) {
      const targets = { members: 90000, messages: 2500000, countries: 45 };
      const duration = 2000;
      const startTime = Date.now();

      const updateStats = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        setStats({
          members: Math.floor(targets.members * easeOut),
          messages: Math.floor(targets.messages * easeOut),
          countries: Math.floor(targets.countries * easeOut)
        });

        if (progress < 1) {
          requestAnimationFrame(updateStats);
        }
      };

      requestAnimationFrame(updateStats);
      controls.start('visible');
    }
  }, [isInView, controls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className={styles.communityWrapper} ref={containerRef}>
      <motion.div
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        {/* Header Section */}
        <motion.div className={styles.header} variants={cardVariants}>
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>
              {getComponentText('crazyCommunity', 'header.title')}
            </h2>
            <p className={styles.subtitle}>
              {getComponentText('crazyCommunity', 'header.subtitle')
                .split('{highlight}')
                .map((part, index) => 
                  index === 1 ? (
                    <span key={index} className={styles.highlight}>
                      {getComponentText('crazyCommunity', 'header.highlightText')}
                    </span>
                  ) : part
                )}
            </p>
            
            {/* Quick Stats Bar */}
            <div className={styles.quickStats}>
              <div className={styles.quickStat}>
                <span className={styles.quickNumber}>{stats.members.toLocaleString()}+</span>
                <span className={styles.quickLabel}>
                  {getComponentText('crazyCommunity', 'stats.activeMembers')}
                </span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickNumber}>{(stats.messages / 1000000).toFixed(1)}M+</span>
                <span className={styles.quickLabel}>
                  {getComponentText('crazyCommunity', 'stats.messages')}
                </span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickNumber}>{stats.countries}+</span>
                <span className={styles.quickLabel}>
                  {getComponentText('crazyCommunity', 'stats.countries')}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Social Platforms Grid */}
        <motion.div className={styles.socialGrid} variants={cardVariants}>
          {socialPlatforms.map((platform, i) => (
            <motion.a
              key={i}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkWrapper}
              variants={cardVariants}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              onMouseEnter={() => setActiveCard(i as any)}
              onMouseLeave={() => setActiveCard(null)}
            >
              <div className={`${styles.socialCard} ${activeCard === i ? styles.active : ''}`}>
                {/* Highlight Badge */}
                <div className={styles.highlightBadge}>
                  {platform.highlight}
                </div>

                <div className={styles.cardHeader}>
                  <div className={styles.socialIcon}>
                    {platform.icon}
                  </div>
                  <div className={styles.platformInfo}>
                    <h3 className={styles.socialName}>
                      {platform.name}
                    </h3>
                    <div className={styles.memberCount}>
                      {platform.members}
                    </div>
                  </div>
                </div>
                
                <p className={styles.socialDescription}>
                  {platform.description}
                </p>

                <div className={styles.cardFooter}>
                  <div className={styles.joinButton} style={{ background: platform.gradient }}>
                    <span>{getComponentText('crazyCommunity', 'buttons.joinCommunity')}</span>
                    <span className={styles.arrow}>→</span>
                  </div>
                </div>

                {/* Active Background Effect */}
                <div 
                  className={styles.cardBackground}
                  style={{ background: activeCard === i ? platform.gradient : 'transparent' }}
                />
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Enhanced CTA Section */}
        <motion.div className={styles.ctaSection} variants={cardVariants}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaHeader}>
              <h3 className={styles.ctaTitle}>
                {getComponentText('crazyCommunity', 'cta.title')}
              </h3>
              <p className={styles.ctaText}>
                {getComponentText('crazyCommunity', 'cta.description')}
              </p>
            </div>
            
            <div className={styles.ctaActions}>
              <motion.a
                href="https://t.me/crazyfoxmeme"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primaryCta}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {getComponentText('crazyCommunity', 'cta.primaryButton')}
              </motion.a>
              
              <motion.a
                href="https://x.com/crazyfoxmeme?s=21"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryCta}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {getComponentText('crazyCommunity', 'cta.secondaryButton')}
              </motion.a>
            </div>

            {/* Trust Indicators */}
            <div className={styles.trustIndicators}>
              <div className={styles.trustItem}>
                <span className={styles.trustIcon}>✅</span>
                <span>{getComponentText('crazyCommunity', 'trustIndicators.verified')}</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustIcon}>🔒</span>
                <span>{getComponentText('crazyCommunity', 'trustIndicators.secure')}</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustIcon}>🌍</span>
                <span>{getComponentText('crazyCommunity', 'trustIndicators.global')}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CrazyCommunity;