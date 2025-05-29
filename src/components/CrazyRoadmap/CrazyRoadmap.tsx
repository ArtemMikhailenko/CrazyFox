import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import styles from './EpicGameRoadmap.module.css';

const EpicGameRoadmap = () => {
  const [activePhase, setActivePhase] = useState(0);
  const [rocketPosition, setRocketPosition] = useState({ x: 8, y: 75 });
  const [showExplosion, setShowExplosion] = useState(false);
  const [completedPhases, setCompletedPhases] = useState([0]);
  const [isRocketFlying, setIsRocketFlying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true });

  // Fixed roadmap data
  const roadmapData = useMemo(() => [
    {
      id: 1,
      title: "🌍 Earth Launch",
      subtitle: "Mission Control",
      planet: "🌍",
      type: "planet",
      size: "large",
      coordinates: { x: 8, y: 75 },
      color: "#4A90E2",
      glowColor: "#6BB6FF",
      price: "$0.001",
      marketCap: "$100K",
      holders: "1K+",
      duration: "Days 1-30",
      status: "completed",
      achievements: [
        "🚀 Smart Contract Launch",
        "🌐 Website & Socials",
        "👥 Community Building",
        "📢 Initial Marketing"
      ],
      description: "Starting our epic journey from Earth's surface to the cosmos!",
      obstacles: ["🛸 Initial FUD", "⚡ Gas Fees"]
    },
    {
      id: 2,
      title: "🛰️ Space Station Alpha",
      subtitle: "Orbital Checkpoint", 
      planet: "🛰️",
      type: "station",
      size: "large",
      coordinates: { x: 25, y: 60 },
      color: "#4ECDC4",
      glowColor: "#6EE7DB",
      price: "$0.005",
      marketCap: "$500K",
      holders: "5K+",
      duration: "Days 31-90",
      status: "in-progress",
      achievements: [
        "💎 DEX Listings",
        "🤝 First Partnerships",
        "📈 Community Growth",
        "🎮 Utility Launch"
      ],
      description: "Establishing our first orbital base and gaining momentum!",
      obstacles: ["🌪️ Market Volatility", "🏴‍☠️ Paper Hands"]
    },
    {
      id: 3,
      title: "☄️ Asteroid Belt",
      subtitle: "Mining Operations",
      planet: "☄️",
      type: "asteroid",
      size: "large",
      coordinates: { x: 42, y: 45 },
      color: "#95A5A6",
      glowColor: "#BDC3C7",
      price: "$0.01",
      marketCap: "$2M",
      holders: "10K+",
      duration: "Days 91-150",
      status: "planned",
      achievements: [
        "⛏️ NFT Mining Launch",
        "💰 Staking Rewards",
        "🎯 Influencer Partnerships",
        "📱 Mobile App"
      ],
      description: "Navigating through challenges and mining valuable resources!",
      obstacles: ["💥 Market Crashes", "🤖 Bot Attacks", "⚡ Competition"]
    },
    {
      id: 4,
      title: "🪐 Jupiter Station", 
      subtitle: "Gas Giant Gateway",
      planet: "🪐",
      type: "planet",
      size: "xl",
      coordinates: { x: 60, y: 30 },
      color: "#E67E22",
      glowColor: "#F39C12",
      price: "$0.05",
      marketCap: "$10M", 
      holders: "50K+",
      duration: "Days 151-240",
      status: "planned",
      achievements: [
        "🏦 Major CEX Listings",
        "🎮 Gaming Platform",
        "🌐 DeFi Integration",
        "🏆 Awards & Recognition"
      ],
      description: "Reaching the massive gas giant and establishing our presence!",
      obstacles: ["🌊 Whale Manipulation", "📉 Bear Markets"]
    },
    {
      id: 5,
      title: "🌙 Moon Base",
      subtitle: "Lunar Colony",
      planet: "🌙",
      type: "planet", 
      size: "xl",
      coordinates: { x: 78, y: 20 },
      color: "#F39C12",
      glowColor: "#FFD700",
      price: "$0.1",
      marketCap: "$50M",
      holders: "100K+", 
      duration: "Days 241-300",
      status: "planned",
      achievements: [
        "🌕 Moon Landing Achieved",
        "🏛️ DAO Governance",
        "🌍 Global Recognition",
        "💎 Diamond Hand Rewards"
      ],
      description: "We've reached the moon! Time to build our lunar empire!",
      obstacles: ["👨‍🚀 FOMO Investors", "📰 Media Attention"]
    },
    {
      id: 6,
      title: "🔴 Mars Colony",
      subtitle: "Red Planet Conquest",
      planet: "🔴",
      type: "planet",
      size: "xxl", 
      coordinates: { x: 92, y: 8 },
      color: "#E74C3C",
      glowColor: "#FF6B6B",
      price: "$1.0",
      marketCap: "$1B",
      holders: "1M+",
      duration: "Days 300+",
      status: "planned", 
      achievements: [
        "🚀 Mars Colonization",
        "🌌 Interplanetary Network",
        "👑 Crypto Dominance",
        "🎯 Ultimate HODL"
      ],
      description: "The final frontier! Establishing our empire across the solar system!",
      obstacles: ["🛸 Alien Interference", "⭐ Cosmic Events"]
    }
  ], []);

  // Fixed floating objects - no random values
  const floatingObjects = useMemo(() => [
    { emoji: "🛸", x: 15, y: 40, speed: 3, id: "ufo1" },
    { emoji: "🌟", x: 35, y: 25, speed: 2, id: "star1" },
    { emoji: "☄️", x: 55, y: 50, speed: 4, id: "comet1" },
    { emoji: "🛰️", x: 75, y: 35, speed: 2.5, id: "satellite1" },
    { emoji: "👽", x: 20, y: 70, speed: 1.5, id: "alien1" },
    { emoji: "🌠", x: 85, y: 60, speed: 3.5, id: "meteor1" },
    { emoji: "🚁", x: 45, y: 15, speed: 2.8, id: "helicopter1" },
    { emoji: "💫", x: 65, y: 80, speed: 2.2, id: "sparkle1" }
  ], []);

  // Fixed stars array - no random values
  const stars = useMemo(() => {
    const starArray = [];
    for (let i = 0; i < 100; i++) {
      starArray.push({
        id: `star-${i}`,
        left: `${(i * 7.23) % 100}%`,
        top: `${(i * 13.47) % 100}%`,
        width: `${2 + (i % 3)}px`,
        height: `${2 + (i % 3)}px`,
        animationDelay: `${(i * 0.1) % 3}s`,
        animationDuration: `${2 + (i % 3)}s`
      });
    }
    return starArray;
  }, []);

  // Initialize client state
  useEffect(() => {
    setIsClient(true);
    setRocketPosition(roadmapData[0].coordinates);
  }, [roadmapData]);

  // Auto-advance phases
  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(() => {
      setActivePhase(prev => (prev + 1) % roadmapData.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isClient, roadmapData.length]);

  // Update rocket position when active phase changes
  useEffect(() => {
    if (!isClient) return;
    
    const targetPosition = roadmapData[activePhase].coordinates;
    setRocketPosition(targetPosition);
  }, [activePhase, roadmapData, isClient]);
    //@ts-ignore

  const handlePhaseClick = (index, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const isLocked = !completedPhases.includes(index) && index > Math.max(...completedPhases) + 1;
    if (isLocked) return;

    // Set states
    setActivePhase(index);
        //@ts-ignore

    setSelectedPhase(roadmapData[index]);
    setIsRocketFlying(true);
    
    // Rocket animation
    const targetPosition = roadmapData[index].coordinates;
    setRocketPosition(targetPosition);
    
    // Show explosion effect
    setTimeout(() => {
      setShowExplosion(true);
      setTimeout(() => {
        setShowExplosion(false);
        setIsRocketFlying(false);
      }, 1000);
    }, 500);

    // Unlock phase if not completed
    if (!completedPhases.includes(index)) {
      setCompletedPhases(prev => [...prev, index]);
    }
    
    // Effects
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [roadmapData[index].color, '#FFD700', '#FF6B35']
    });

    toast.success(`🚀 Exploring ${roadmapData[index].title}!`, {
      position: "top-center",
      theme: "dark"
    });
    
    // Show modal with delay to prevent glitches
    setTimeout(() => {
      setShowModal(true);
    }, 100);
  };
    //@ts-ignore

  const handleCloseModal = (event) => {
    event?.stopPropagation();
    setShowModal(false);
    setTimeout(() => {
      setSelectedPhase(null);
    }, 300);
  };
    //@ts-ignore

  const PlanetComponent = ({ phase, index, isActive }) => {
    const isCompleted = completedPhases.includes(index);
    const isLocked = !isCompleted && index > Math.max(...completedPhases) + 1;
    
    const sizeMap = {
      small: 4,
      medium: 5,
      large: 7,
      xl: 9,
      xxl: 11
    };
    //@ts-ignore
    const radius = sizeMap[phase.size];

    return (
      <g className={styles.planetGroup}>
        {/* Planet Glow */}
        <circle
          cx={phase.coordinates.x}
          cy={phase.coordinates.y}
          r={radius + 2}
          fill={phase.glowColor}
          opacity={isActive ? 0.8 : 0.4}
          className={isActive ? styles.activeGlow : styles.planetGlow}
        />
        
        {/* Planet Body */}
        <circle
          cx={phase.coordinates.x}
          cy={phase.coordinates.y}
          r={radius}
          fill={isLocked ? '#555' : phase.color}
          stroke={isActive ? '#FFD700' : isCompleted ? '#00FF00' : '#FFF'}
          strokeWidth={isActive ? 1 : 0.5}
          className={`${styles.planet} ${isLocked ? styles.locked : ''} ${isActive ? styles.active : ''}`}
          onClick={(e) => handlePhaseClick(index, e)}
          style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
        />
        
        {/* Planet Icon */}
        <text
          x={phase.coordinates.x}
          y={phase.coordinates.y + 1}
          textAnchor="middle"
          fontSize={radius * 0.7}
          className={`${styles.planetIcon} ${isActive ? styles.spinning : ''}`}
          onClick={(e) => handlePhaseClick(index, e)}
          style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
        >
          {isLocked ? '🔒' : phase.planet}
        </text>
        
        {/* Status Indicator */}
        {isCompleted && (
          <text
            x={phase.coordinates.x + radius + 2}
            y={phase.coordinates.y - radius - 2}
            textAnchor="middle"
            fontSize="3"
            className={styles.statusIcon}
          >
            ✅
          </text>
        )}
        
        {/* Phase Label */}
        <text
          x={phase.coordinates.x}
          y={phase.coordinates.y + radius + 4}
          textAnchor="middle"
          fill="white"
          fontSize="2.5"
          fontWeight="bold"
          className={styles.phaseLabel}
          onClick={(e) => handlePhaseClick(index, e)}
          style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
        >
          {phase.title.split(' ').slice(-1)[0]}
        </text>
      </g>
    );
  };

  const RocketComponent = () => (
    <g className={styles.rocketGroup}>
      <motion.text
        x={rocketPosition.x}
        y={rocketPosition.y}
        fontSize="5"
        textAnchor="middle"
        className={`${styles.rocket} ${isRocketFlying ? styles.rocketFlying : ''}`}
        animate={isRocketFlying ? {
          rotate: [0, 360],
          scale: [1, 1.5, 1]
        } : {
          rotate: 0,
          scale: 1
        }}
        transition={{ 
          duration: isRocketFlying ? 2 : 0,
          ease: "easeInOut"
        }}
      >
        🚀
      </motion.text>
      
      {/* Rocket Trail */}
      {isRocketFlying && (
        <motion.circle
          cx={rocketPosition.x}
          cy={rocketPosition.y}
          r="2"
          fill="#FF6B35"
          opacity="0.7"
          className={styles.rocketTrail}
          animate={{
            r: [0, 4, 0],
            opacity: [0, 0.8, 0]
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </g>
  );

  const ExplosionEffect = () => (
    showExplosion && (
      <g className={styles.explosionGroup}>
        {Array.from({ length: 8 }, (_, i) => (
          <motion.circle
            key={i}
            cx={rocketPosition.x}
            cy={rocketPosition.y}
            r="1"
            fill={['#FF6B35', '#FFD700', '#FF0000'][i % 3]}
            className={styles.explosionParticle}
            initial={{ r: 0, opacity: 1 }}
            animate={{
              r: 6,
              opacity: 0,
              x: Math.cos(i * 45 * Math.PI / 180) * 8,
              y: Math.sin(i * 45 * Math.PI / 180) * 8
            }}
            transition={{ duration: 1 }}
          />
        ))}
      </g>
    )
  );

  const ModalComponent = () => (
    <AnimatePresence>
      {showModal && selectedPhase && (
        <>
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          />
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.5, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 100 }}
            style={{
              //@ts-ignore
              background: `linear-gradient(135deg, ${selectedPhase.color}20, rgba(26, 31, 58, 0.95))`,
              //@ts-ignore
              borderColor: selectedPhase.colorany
            }}
          >
            <button
              onClick={handleCloseModal}
              className={styles.closeButton}
            >
              ×
            </button>
            
            <div className={styles.modalHeader}>
               {/*@ts-ignore*/}
              <div className={styles.modalIcon}>{selectedPhase.planet}</div>
              <div>
                 {/*@ts-ignore*/}
                <h2 className={styles.modalTitle}>{selectedPhase.title}</h2>
                 {/*@ts-ignore*/}
                <p className={styles.modalSubtitle} style={{ color: selectedPhase.color }}>
                   {/*@ts-ignore*/}
                  {selectedPhase.subtitle}
                </p>
              </div>
            </div>

            <div className={styles.modalStats}>
              <div className={styles.statCard}>
                 {/*@ts-ignore*/}
                <div className={styles.statValue} style={{ color: selectedPhase.color }}>
                   {/*@ts-ignore*/}
                  {selectedPhase.price}
                </div>
                <div className={styles.statLabel}>Token Price</div>
              </div>
              <div className={styles.statCard}> {/*@ts-ignore*/}
                <div className={styles.statValue} style={{ color: selectedPhase.color }}>
                   {/*@ts-ignore*/}
                  {selectedPhase.marketCap}
                </div>
                <div className={styles.statLabel}>Market Cap</div>
              </div>
              <div className={styles.statCard}>
                 {/*@ts-ignore*/}
                <div className={styles.statValue} style={{ color: selectedPhase.color }}>
                   {/*@ts-ignore*/}
                  {selectedPhase.holders}
                </div>
                <div className={styles.statLabel}>Holders</div>
              </div>
            </div>

            <p className={styles.modalDescription}>
               {/*@ts-ignore*/}
              {selectedPhase.description}
            </p>

            <div className={styles.modalSection}>
              <h4 className={styles.sectionTitle}>🎯 Mission Objectives:</h4>
              <ul className={styles.achievementsList}>
                 {/*@ts-ignore*/}
                {selectedPhase.achievements.map((achievement, i) => (
                  <motion.li 
                    key={i}
                    className={styles.achievementItem}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {achievement}
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className={styles.modalSection}>
              <h4 className={styles.sectionTitleDanger}>⚠️ Mission Obstacles:</h4>
              <div className={styles.obstaclesList}>
              {/*@ts-ignore*/}
                {selectedPhase.obstacles.map((obstacle, i) => (
                  <span key={i} className={styles.obstacleTag}>
                    {obstacle}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!isClient) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Animated Background */}
      <div className={styles.background}>
        {/* Fixed Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className={styles.star}
            style={{
              left: star.left,
              top: star.top,
              width: star.width,
              height: star.height,
              animationDelay: star.animationDelay,
              animationDuration: star.animationDuration
            }}
          />
        ))}
        
        {/* Floating Objects */}
        {floatingObjects.map((obj) => (
          <motion.div
            key={obj.id}
            className={styles.floatingObject}
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}%`
            }}
            animate={{
              x: [0, 20, -10, 0],
              y: [0, -15, 10, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: obj.speed * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {obj.emoji}
          </motion.div>
        ))}
      </div>

      <motion.div className={styles.content}>
        {/* Header */}
        <motion.div className={styles.header}>
          <motion.h1 
            className={styles.title}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            🌌 CrazyFox Galaxy Quest
          </motion.h1>
          <motion.p 
            className={styles.subtitle}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            Navigate through the cosmos and conquer planets on our epic journey to crypto domination!
          </motion.p>
        </motion.div>

        {/* Interactive Game Map */}
        <div className={styles.gameContainer}>
          <svg
            width="100%"
            height="600"
            viewBox="0 0 100 100"
            className={styles.gameSvg}
          >
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.8" />
                <stop offset="20%" stopColor="#4ECDC4" stopOpacity="0.8" />
                <stop offset="40%" stopColor="#95A5A6" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#E67E22" stopOpacity="0.8" />
                <stop offset="80%" stopColor="#F39C12" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#E74C3C" stopOpacity="0.8" />
              </linearGradient>
              
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Animated Path */}
            <motion.path
              d={`M ${roadmapData[0].coordinates.x} ${roadmapData[0].coordinates.y} 
                  Q 20 70 ${roadmapData[1].coordinates.x} ${roadmapData[1].coordinates.y}
                  Q 35 55 ${roadmapData[2].coordinates.x} ${roadmapData[2].coordinates.y}
                  Q 52 38 ${roadmapData[3].coordinates.x} ${roadmapData[3].coordinates.y}
                  Q 70 25 ${roadmapData[4].coordinates.x} ${roadmapData[4].coordinates.y}
                  Q 85 15 ${roadmapData[5].coordinates.x} ${roadmapData[5].coordinates.y}`}
              stroke="url(#pathGradient)"
              strokeWidth="1.5"
              fill="none"
              filter="url(#glow)"
              strokeDasharray="4 2"
              className={styles.animatedPath}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { 
                pathLength: 1, 
                opacity: 1 
              } : {}}
              transition={{ duration: 3, ease: "easeInOut" }}
            />

            {/* Planets */}
            {roadmapData.map((phase, index) => (
              <PlanetComponent
                key={phase.id}
                phase={phase}
                index={index}
                isActive={activePhase === index}
              />
            ))}

            {/* Rocket */}
            <RocketComponent />
            
            {/* Explosion Effect */}
            <ExplosionEffect />
          </svg>
        </div>

        {/* Game Controls */}
        <div className={styles.controls}>
          <div className={styles.progressBar}>
            <div className={styles.progressLabel}>Mission Progress</div>
            <div className={styles.progressTrack}>
              <motion.div 
                className={styles.progressFill}
                style={{
                  width: `${(completedPhases.length / roadmapData.length) * 100}%`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${(completedPhases.length / roadmapData.length) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <div className={styles.progressText}>
              {completedPhases.length}/{roadmapData.length} Planets Conquered
            </div>
          </div>
        </div>

        {/* Current Phase Info */}
        <motion.div className={styles.currentPhaseInfo}>
          <div 
            className={styles.currentPhaseCard}
            style={{
              background: `linear-gradient(135deg, ${roadmapData[activePhase].color}20, rgba(26, 31, 58, 0.8))`
            }}
          >
            <div className={styles.phaseHeader}>
              <span className={styles.phaseEmoji}>{roadmapData[activePhase].planet}</span>
              <div>
                <h3 className={styles.phaseTitle} style={{ color: roadmapData[activePhase].color }}>
                  {roadmapData[activePhase].title}
                </h3>
                <p className={styles.phaseSubtitle}>
                  {roadmapData[activePhase].subtitle}
                </p>
              </div>
            </div>
            <p className={styles.phaseDescription}>{roadmapData[activePhase].description}</p>
            <div className={styles.quickStats}>
              <span>💰 {roadmapData[activePhase].price}</span>
              <span>📈 {roadmapData[activePhase].marketCap}</span>
              <span>👥 {roadmapData[activePhase].holders}</span>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div className={styles.cta}>
          <h3 className={styles.ctaTitle}>Ready to Join the Galactic Adventure? 🚀</h3>
          <motion.button
            className={styles.ctaButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.8 },
                colors: ['#FF6B35', '#4ECDC4', '#FFD700']
              });
              toast.success('🚀 Welcome to the CrazyFox Galaxy! 🦊', {
                theme: "dark"
              });
            }}
          >
            🌟 Start Your Space Journey
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Modal */}
      <ModalComponent />
    </div>
  );
};

export default EpicGameRoadmap;