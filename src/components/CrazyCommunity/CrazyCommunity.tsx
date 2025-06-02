'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import styles from './CrazyCommunity.module.css';

const CrazyCommunity = () => {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const controls = useAnimation();

  // Community stats
  const [stats, setStats] = useState({
    members: 0,
    messages: 0,
    countries: 0,
    memes: 0
  });

  const socialPlatforms = [
    { 
      icon: '💬', 
      name: 'Telegram', 
      members: '127K', 
      color: '#0088cc',
      gradient: 'linear-gradient(135deg, #0088cc, #00a6d6)',
      description: 'Join our main community hub',
      url: 'https://t.me/crazyfoxmeme'
    },
    { 
      icon: '🐦', 
      name: 'Twitter', 
      members: '89K', 
      color: '#1da1f2',
      gradient: 'linear-gradient(135deg, #1da1f2, #0d8bd9)',
      description: 'Latest news and updates',
      url: 'https://x.com/crazyfoxmeme?s=21'
    },
    { 
      icon: '🎵', 
      name: 'TikTok', 
      members: '156K', 
      color: '#000000',
      gradient: 'linear-gradient(135deg, #000000, #ff0050)',
      description: 'Viral fox content',
      url: 'https://www.tiktok.com/@crazyfoxmeme?_t=ZM-8wpwWp3NVAu&_r=1'
    }
  ];

  // Detect mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Animate stats when in view
  useEffect(() => {
    if (isInView) {
      const targets = { members: 5000, messages: 100000, countries: 12, memes: 12500 };
      const duration = isMobile ? 1000 : 2000; // Faster on mobile
      const startTime = Date.now();

      const updateStats = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setStats({
          members: Math.floor(targets.members * progress),
          messages: Math.floor(targets.messages * progress),
          countries: Math.floor(targets.countries * progress),
          memes: Math.floor(targets.memes * progress)
        });

        if (progress < 1) {
          requestAnimationFrame(updateStats);
        }
      };

      requestAnimationFrame(updateStats);
      controls.start('visible');
    }
  }, [isInView, controls, isMobile]);

  // Simplified animations for mobile
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: isMobile ? 0.05 : 0.1,
        delayChildren: isMobile ? 0.1 : 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: isMobile ? 20 : 50
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: isMobile ? 200 : 100,
        damping: isMobile ? 20 : 15
      }
    }
  };

  return (
    <div className={styles.communityWrapper} ref={containerRef}>
      {/* Simplified background for mobile */}
      {!isMobile && (
        <div className={styles.backgroundEffects}>
          {/* Only show particles on desktop */}
          <div className={styles.simpleBackground} />
        </div>
      )}

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
              🦊 Join the Fox Pack 🦊
            </h2>
            <p className={styles.subtitle}>
              Connect with the craziest crypto community! Over 500K+ foxes worldwide sharing memes, 
              strategies, and spreading the $CRFX revolution! 🚀
            </p>
          </div>
        </motion.div>

        {/* Community Stats */}
        <motion.div className={styles.statsGrid} variants={cardVariants}>
          {[
            { label: 'Community Members', value: stats.members, icon: '👥', suffix: '+' },
            { label: 'Messages Sent', value: stats.messages, icon: '💬', suffix: '+' },
            { label: 'Countries', value: stats.countries, icon: '🌍', suffix: '' },
            // { label: 'Memes Created', value: stats.memes, icon: '😂', suffix: '+' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              className={styles.statCard}
              whileHover={!isMobile ? { scale: 1.05 } : {}}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: isMobile ? 10 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statValue}>
                {stat.value.toLocaleString()}{stat.suffix}
              </div>
              <div className={styles.statLabel}>{stat.label}</div>
            </motion.div>
          ))}
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
              whileHover={!isMobile ? { scale: 1.02 } : {}}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => !isMobile && setActiveCard(i)}
              onHoverEnd={() => !isMobile && setActiveCard(null)}
              onClick={() => isMobile && setActiveCard(activeCard === i ? null : i)}
            >
              <div
                className={styles.socialCard}
                style={{
                  background: (activeCard === i && !isMobile) ? platform.gradient : 'rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Simplified content for mobile */}
                <div className={styles.cardContent}>
                  <div className={styles.socialIcon}>
                    {platform.icon}
                  </div>
                  
                  <h3 className={styles.socialName}>
                    {platform.name}
                  </h3>
                  
                  <div className={styles.memberCount}>
                    {platform.members} Foxes
                  </div>
                  
                  <p className={styles.socialDescription}>
                    {platform.description}
                  </p>

                  <button className={styles.joinButton}>
                    Join Now 🚀
                  </button>
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div className={styles.ctaSection} variants={cardVariants}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <h3 className={styles.ctaTitle}>
                Ready to Join the Revolution? 🌟
              </h3>
              <p className={styles.ctaText}>
                Don't miss out on the most epic crypto community! Choose your platform and 
                become part of the $CRFX family today!
              </p>
              <div className={styles.ctaButtons}>
                <motion.button
                  className={styles.primaryCta}
                  whileTap={{ scale: 0.95 }}
                >
                  🚀 Join All Platforms
                </motion.button>
                <motion.button
                  className={styles.secondaryCta}
                  whileTap={{ scale: 0.95 }}
                >
                  💎 Learn More
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CrazyCommunity;