'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import styles from './CrazyCommunity.module.css';

const CrazyCommunity = () => {
  const [activeCard, setActiveCard] = useState(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const controls = useAnimation();

  // Community stats
  const [stats, setStats] = useState({
    members: 0,
    messages: 0,
    countries: 0
  });

  const socialPlatforms = [
    { 
      icon: '💬', 
      name: 'Telegram', 
      members: '50K+', 
      color: '#0088cc',
      gradient: 'linear-gradient(135deg, #0088cc, #00a6d6)',
      description: 'Join our main community hub for daily discussions and exclusive updates',
      url: 'https://t.me/crazyfoxmeme',
      highlight: '🔥 Most Active'
    },
    { 
      icon: '🐦', 
      name: 'Twitter/X', 
      members: '25K+', 
      color: '#1da1f2',
      gradient: 'linear-gradient(135deg, #1da1f2, #0d8bd9)',
      description: 'Latest news, market updates and community announcements',
      url: 'https://x.com/crazyfoxmeme?s=21',
      highlight: '📢 News Hub'
    },
    { 
      icon: '🎵', 
      name: 'TikTok', 
      members: '15K+', 
      color: '#000000',
      gradient: 'linear-gradient(135deg, #000000, #ff0050)',
      description: 'Viral fox content, memes and community highlights',
      url: 'https://www.tiktok.com/@crazyfoxmeme?_t=ZM-8wpwWp3NVAu&_r=1',
      highlight: '🎬 Viral Content'
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
              🦊 Join the Fox Revolution
            </h2>
            <p className={styles.subtitle}>
              Connect with the wildest crypto community! Over <span className={styles.highlight}>90K+ active foxes</span> worldwide 
              sharing strategies, memes, and building the future of $CRFX together! 🚀
            </p>
            
            {/* Quick Stats Bar */}
            <div className={styles.quickStats}>
              <div className={styles.quickStat}>
                <span className={styles.quickNumber}>{stats.members.toLocaleString()}+</span>
                <span className={styles.quickLabel}>Active Members</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickNumber}>{(stats.messages / 1000000).toFixed(1)}M+</span>
                <span className={styles.quickLabel}>Messages</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickNumber}>{stats.countries}+</span>
                <span className={styles.quickLabel}>Countries</span>
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
                      {platform.members} Foxes
                    </div>
                  </div>
                </div>
                
                <p className={styles.socialDescription}>
                  {platform.description}
                </p>

                <div className={styles.cardFooter}>
                  <div className={styles.joinButton} style={{ background: platform.gradient }}>
                    <span>Join Community</span>
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
                Ready to Go Crazy? 🌟
              </h3>
              <p className={styles.ctaText}>
                Join thousands of foxes building the future of meme coins. 
                Get exclusive updates, participate in giveaways, and be part of history!
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
                🚀 Join Telegram Now
              </motion.a>
              
              <motion.a
                href="https://x.com/crazyfoxmeme?s=21"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryCta}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                💎 Follow on X
              </motion.a>
            </div>

            {/* Trust Indicators */}
            <div className={styles.trustIndicators}>
              <div className={styles.trustItem}>
                <span className={styles.trustIcon}>✅</span>
                <span>Verified Community</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustIcon}>🔒</span>
                <span>Safe & Secure</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustIcon}>🌍</span>
                <span>Global Community</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CrazyCommunity;