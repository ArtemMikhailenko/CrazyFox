'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import styles from './CrazyCommunity.module.css';

const CrazyCommunity = () => {
  const [activeCard, setActiveCard] = useState(null);
  const [particles, setParticles] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const controls = useAnimation();

  // Community stats that animate
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
      bgPattern: '📱',
      url: 'https://t.me/crazyfoxmeme'
    },
    { 
      icon: '🐦', 
      name: 'Twitter', 
      members: '89K', 
      color: '#1da1f2',
      gradient: 'linear-gradient(135deg, #1da1f2, #0d8bd9)',
      description: 'Latest news and updates',
      bgPattern: '🚀',
      url: 'https://x.com/crazyfoxmeme?s=21'
    },
    { 
      icon: '🎵', 
      name: 'TikTok', 
      members: '156K', 
      color: '#000000',
      gradient: 'linear-gradient(135deg, #000000, #ff0050)',
      description: 'Viral fox content',
      bgPattern: '🎭',
      url: 'https://www.tiktok.com/@crazyfoxmeme?_t=ZM-8wpwWp3NVAu&_r=1'
    }
  ];
  

  // Animate stats on mount
  useEffect(() => {
    if (isInView) {
      const animateStats = () => {
        const targets = { members: 5000, messages: 100000, countries: 12, memes: 12500 };
        const duration = 2000;
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
      };

      animateStats();
      controls.start('visible');
    }
  }, [isInView, controls]);

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
          speed: Math.random() * 2 + 1,
          emoji: ['🦊', '🚀', '💎', '🌙', '⭐', '🔥'][Math.floor(Math.random() * 6)]
        });
      }
      //@ts-ignore
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e:any) => {
      if (containerRef.current) {

        //@ts-ignore
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        });
      }
    };

    const container = containerRef.current;
    if (container) {
        //@ts-ignore
      container.addEventListener('mousemove', handleMouseMove);
      //@ts-ignore
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

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
      y: 50,
      rotateX: -15
    },
    visible: { 
      opacity: 1, 
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className={styles.communityWrapper} ref={containerRef}>
      {/* Animated Background */}
      <div className={styles.backgroundEffects}>
        {particles.map((particle) => (
          <motion.div
          //@ts-ignore
            key={particle.id}
            className={styles.particle}
            initial={{
                //@ts-ignore
              x: `${particle.x}%`,
              //@ts-ignore
              y: `${particle.y}%`,
              //@ts-ignore
              fontSize: `${particle.size}px`
            }}
            animate={{
                //@ts-ignore
              y: [`${particle.y}%`, `${particle.y - 20}%`, `${particle.y}%`],
              rotate: [0, 180, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
                //@ts-ignore
              duration: particle.speed * 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/*@ts-ignore*/}
            {particle.emoji}
          </motion.div>
        ))}
      </div>

      {/* Mouse Glow Effect */}
      <motion.div
        className={styles.mouseGlow}
        animate={{
          x: `${mousePosition.x}%`,
          y: `${mousePosition.y}%`,
          opacity: isHovering ? 0.6 : 0
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />

      <motion.div
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate={controls}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Header Section */}
        <motion.div className={styles.header} variants={cardVariants}>
          <motion.div
            className={styles.titleContainer}
            whileHover={{ scale: 1.02 }}
          >
            <motion.h2 
              className={styles.title}
              initial={{ backgroundPosition: "0% 50%" }}
              animate={{ backgroundPosition: "200% 50%" }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              🦊 Join the Fox Pack 🦊
            </motion.h2>
            <motion.p 
              className={styles.subtitle}
              variants={cardVariants}
            >
              Connect with the craziest crypto community! Over 500K+ foxes worldwide sharing memes, 
              strategies, and spreading the $CFOX revolution across the galaxy! 🚀
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Community Stats */}
        <motion.div className={styles.statsGrid} variants={cardVariants}>
          {[
            { label: 'Community Members', value: stats.members, icon: '👥', suffix: '+' },
            { label: 'Messages Sent', value: stats.messages, icon: '💬', suffix: '+' },
            { label: 'Countries', value: stats.countries, icon: '🌍', suffix: '' },
            { label: 'Memes Created', value: stats.memes, icon: '😂', suffix: '+' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              className={styles.statCard}
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 20px 40px rgba(255, 107, 53, 0.3)" 
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
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
            <a
            key={i}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkWrapper}
          >
            <motion.div
              key={i}
              className={styles.socialCard}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.05,
                rotateY: 5,
                z: 50
              }}
              whileTap={{ scale: 0.95 }}
              //@ts-ignore
              onHoverStart={() => setActiveCard(i)}
              onHoverEnd={() => setActiveCard(null)}
              style={{
                background: activeCard === i ? platform.gradient : 'rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Background Pattern */}
              <div className={styles.cardPattern}>
                {Array.from({ length: 6 }, (_, j) => (
                  <span key={j} className={styles.patternEmoji}>
                    {platform.bgPattern}
                  </span>
                ))}
              </div>

              {/* Card Content */}
              <div className={styles.cardContent}>
                <motion.div 
                  className={styles.socialIcon}
                  animate={{ 
                    rotate: activeCard === i ? [0, -10, 10, 0] : 0,
                    scale: activeCard === i ? 1.2 : 1
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {platform.icon}
                </motion.div>
                
                <motion.h3 
                  className={styles.socialName}
                  animate={{ y: activeCard === i ? -2 : 0 }}
                >
                  {platform.name}
                </motion.h3>
                
                <motion.div 
                  className={styles.memberCount}
                  animate={{ scale: activeCard === i ? 1.1 : 1 }}
                >
                  {platform.members} Foxes
                </motion.div>
                
                <motion.p 
                  className={styles.socialDescription}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: activeCard === i ? 1 : 0.7 }}
                >
                  {platform.description}
                </motion.p>

                <motion.button
                  className={styles.joinButton}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ 
                    backgroundColor: activeCard === i ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                    color: activeCard === i ? platform.color : '#ffffff'
                  }}
                >
                  Join Now 🚀
                </motion.button>
              </div>

              {/* Hover Effect */}
              <motion.div
                className={styles.cardGlow}
                animate={{
                  opacity: activeCard === i ? 1 : 0,
                  scale: activeCard === i ? 1 : 0.8
                }}
                style={{ background: platform.gradient }}
              />
            </motion.div>
            </a>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div className={styles.ctaSection} variants={cardVariants}>
          <motion.div
            className={styles.ctaCard}
            whileHover={{ scale: 1.02, boxShadow: "0 30px 60px rgba(255, 107, 53, 0.4)" }}
          >
            <motion.div
              className={styles.ctaContent}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <h3 className={styles.ctaTitle}>
                Ready to Join the Revolution? 🌟
              </h3>
              <p className={styles.ctaText}>
                Don't miss out on the most epic crypto community! Choose your platform and 
                become part of the $CFOX family today!
              </p>
              <div className={styles.ctaButtons}>
                <motion.button
                  className={styles.primaryCta}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🚀 Join All Platforms
                </motion.button>
                <motion.button
                  className={styles.secondaryCta}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  💎 Learn More
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CrazyCommunity;