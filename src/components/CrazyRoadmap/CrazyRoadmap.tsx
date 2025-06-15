import { useState, useEffect, useRef } from 'react';

// Анимации и эффекты
const keyframes = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  
  @keyframes orbit {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.8; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  
  @keyframes rocket-fly {
    0% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(50px, -30px) rotate(15deg); }
    50% { transform: translate(100px, -10px) rotate(-5deg); }
    75% { transform: translate(150px, -40px) rotate(10deg); }
    100% { transform: translate(200px, 0px) rotate(0deg); }
  }
  
  @keyframes planet-glow {
    0%, 100% { box-shadow: 0 0 20px currentColor; }
    50% { box-shadow: 0 0 40px currentColor, 0 0 60px currentColor; }
  }
  
  @keyframes shooting-star {
    0% { transform: translateX(-100px) translateY(100px) rotate(45deg); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateX(1000px) translateY(-100px) rotate(45deg); opacity: 0; }
  }
  
  @keyframes clickHint {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  @keyframes tapIndicator {
    0% { opacity: 0; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
    100% { opacity: 0; transform: scale(1.4); }
  }
`;

// Стили космической темы
const styles: { [key: string]: React.CSSProperties } = {
  galaxy: {
    minHeight: '100vh',
    position: 'relative' as const,
    fontFamily: '"Orbitron", monospace'
  },
  
  stars: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `
      radial-gradient(2px 2px at 20px 30px, #eee, transparent),
      radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 90px 40px, #fff, transparent),
      radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
      radial-gradient(2px 2px at 160px 30px, #fff, transparent)
    `,
    backgroundRepeat: 'repeat',
    backgroundSize: '200px 100px',
    animation: 'twinkle 4s ease-in-out infinite alternate'
  },
  
  shootingStars: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const
  },
  
  shootingStar: {
    position: 'absolute' as const,
    width: '3px',
    height: '3px',
    background: 'linear-gradient(45deg, #4ECDC4, #FF6B35)',
    borderRadius: '50%',
    animation: 'shooting-star 8s ease-in-out infinite'
  },
  
  spaceTitle: {
    position: 'absolute' as const,
    top: '5%',
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center' as const,
    zIndex: 100,
    color: '#fff'
  },
  
  mainTitle: {
    fontSize: 'clamp(2rem, 6vw, 3.5rem)',
    fontWeight: '900',
    background: 'linear-gradient(45deg, #4ECDC4, #FF6B35, #FFD700)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 30px rgba(255, 255, 255, 0.5)',
    marginBottom: '10px',
    fontFamily: '"Orbitron", monospace'
  },
  
  subtitle: {
    fontSize: 'clamp(0.8rem, 2.5vw, 1.2rem)',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '300',
    letterSpacing: '1px'
  },
  
  instructionHint: {
    position: 'absolute' as const,
    top: '22%',
    left: '22%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.7)',
    color: '#4ECDC4',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
    border: '1px solid rgba(78, 205, 196, 0.3)',
    animation: 'clickHint 2s ease-in-out infinite',
    zIndex: 90
  },
  
  galaxyMap: {
    position: 'relative' as const,
    width: '100%',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box' as const
  },
  
  solarSystem: {
    position: 'relative' as const,
    width: 'min(85vw, 85vh)',
    height: 'min(85vw, 85vh)',
    maxWidth: '700px',
    maxHeight: '700px'
  },
  
  orbitRing: {
    position: 'absolute' as const,
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none' as const
  },
  
  planet: {
    position: 'absolute' as const,
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: 'clamp(1.2rem, 3.5vw, 2rem)',
    animation: 'planet-glow 3s ease-in-out infinite',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(10px)',
    pointerEvents: 'auto' as const,
    zIndex: 20
  },
  
  planetHover: {
    transform: 'scale(1.2)',
    zIndex: 100,
    boxShadow: '0 0 30px currentColor, 0 0 50px currentColor'
  },
  
  planetOrbit: {
    position: 'absolute' as const,
    borderRadius: '50%',
    animation: 'orbit 60s linear infinite',
    pointerEvents: 'none' as const
  },
  
  tapIndicator: {
    position: 'absolute' as const,
    top: '-10px',
    right: '-10px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#4ECDC4',
    animation: 'tapIndicator 2s ease-in-out infinite',
    pointerEvents: 'none' as const
  },
  
  progressRocket: {
    position: 'absolute' as const,
    bottom: '10%',
    left: '5%',
    width: '90%',
    height: '50px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '25px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 15px',
    zIndex: 100
  },
  
  progressTrack: {
    flex: 1,
    height: '16px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    marginLeft: '10px',
    position: 'relative' as const,
    overflow: 'hidden' as const
  },
  
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #4ECDC4, #FF6B35, #FFD700)',
    borderRadius: '8px',
    position: 'relative' as const,
    transition: 'width 2s ease-out'
  },
  
  progressGlow: {
    position: 'absolute' as const,
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
    animation: 'rocket-fly 3s ease-in-out infinite'
  },
  
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '15px',
    backdropFilter: 'blur(20px)'
  },
  
  modalContent: {
    background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95))',
    borderRadius: '20px',
    padding: 'clamp(15px, 4vw, 25px)',
    maxWidth: '95vw',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    border: '2px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(30px)',
    color: 'white',
    position: 'relative' as const,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
  },
  
  modalClose: {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: 'white',
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  quickStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginTop: '15px'
  },
  
  statCard: {
    background: 'rgba(255, 255, 255, 0.08)',
    padding: '10px',
    borderRadius: '10px',
    textAlign: 'center' as const,
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  
  statValue: {
    fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  
  statLabel: {
    fontSize: 'clamp(0.65rem, 1.8vw, 0.75rem)',
    opacity: 0.7
  },
  
  objectivesList: {
    listStyle: 'none',
    padding: 0,
    margin: '15px 0'
  },
  
  objective: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)'
  }
};

const PLANETS_DATA = [
  {
    id: 1,
    name: 'Launch Station',
    phase: 'Phase 1',
    emoji: '🚀',
    size: 70,
    color: '#FF6B35',
    orbitRadius: 110,
    orbitSpeed: '20s',
    status: 'completed',
    price: '0.005¢',
    duration: 'Days 1-15',
    percentage: 20,
    description: 'Foundation launch phase. Smart contract deployment, website creation, and initial community building.',
    objectives: [
      'Deploy verified smart contract on BSC',
      'Launch website and social channels',
      'Create community and documentation',
      'Security audit completion'
    ],
    stats: { price: '0.005¢', tokens: '200M', progress: '100%', holders: '1.2K' }
  },
  {
    id: 2,
    name: 'Community Hub',
    phase: 'Phase 2',
    emoji: '👥',
    size: 75,
    color: '#4ECDC4',
    orbitRadius: 160,
    orbitSpeed: '30s',
    status: 'in-progress',
    price: '0.006¢',
    duration: 'Days 16-30',
    percentage: 20,
    description: 'Community expansion phase. Marketing campaigns, influencer partnerships, and exchange listings.',
    objectives: [
      'Launch marketing campaigns',
      'Partner with crypto influencers',
      'CoinGecko & CMC listings',
      'Grow to 10K+ members'
    ],
    stats: { price: '0.006¢', tokens: '200M', progress: '60%', holders: '5.2K' }
  },
  {
    id: 3,
    name: 'Viral Planet',
    phase: 'Phase 3',
    emoji: '📈',
    size: 80,
    color: '#9B59B6',
    orbitRadius: 210,
    orbitSpeed: '40s',
    status: 'planned',
    price: '0.007¢',
    duration: 'Days 31-45',
    percentage: 20,
    description: 'Explosive growth phase. Viral content creation, mass marketing, and international expansion.',
    objectives: [
      'Viral TikTok & YouTube campaigns',
      'Major crypto news coverage',
      'Referral reward programs',
      'Target 50K+ community'
    ],
    stats: { price: '0.007¢', tokens: '200M', progress: '0%', holders: '25K+' }
  },
  {
    id: 4,
    name: 'Exchange Gate',
    phase: 'Phase 4',
    emoji: '💱',
    size: 85,
    color: '#2ECC71',
    orbitRadius: 260,
    orbitSpeed: '50s',
    status: 'planned',
    price: '0.008¢',
    duration: 'Days 46-60',
    percentage: 20,
    description: 'Exchange integration phase. Major DEX/CEX listings and liquidity expansion.',
    objectives: [
      'Major DEX listings (Uniswap)',
      'First CEX applications',
      'Advanced tokenomics',
      'Staking platform launch'
    ],
    stats: { price: '0.008¢', tokens: '200M', progress: '0%', holders: '100K+' }
  },
  {
    id: 5,
    name: 'Utility Core',
    phase: 'Phase 5',
    emoji: '⚡',
    size: 78,
    color: '#F39C12',
    orbitRadius: 310,
    orbitSpeed: '60s',
    status: 'planned',
    price: '0.009¢',
    duration: 'Days 61-75',
    percentage: 10,
    description: 'Utility implementation phase. NFTs, mobile app, and governance features.',
    objectives: [
      'CrazyFox NFT collection',
      'Token burning mechanisms',
      'Mobile app launch',
      'Governance implementation'
    ],
    stats: { price: '0.009¢', tokens: '100M', progress: '0%', holders: '200K+' }
  },
  {
    id: 6,
    name: 'Moon Base',
    phase: 'Phase 6',
    emoji: '🌙',
    size: 90,
    color: '#FFD700',
    orbitRadius: 360,
    orbitSpeed: '70s',
    status: 'planned',
    price: '0.01¢',
    duration: 'Days 76-90',
    percentage: 10,
    description: '🌙 MOON ACHIEVED! Major CEX listing, $100M+ market cap, and Mars mission planning.',
    objectives: [
      'Major CEX listing (Binance goal)',
      '$100M+ market cap target',
      'Supply reduction via burning',
      'Advanced DeFi features',
      'Mars roadmap 2026 🔴'
    ],
    stats: { price: '0.01¢', tokens: '100M', progress: '0%', holders: '500K+' }
  }
];

const statusColors = {
  completed: '#2ECC71',
  'in-progress': '#F39C12',
  planned: '#95A5A6'
};

const CrazyFoxSpaceRoadmap = () => {
  const [selectedPlanet, setSelectedPlanet] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const galaxyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = keyframes;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const completedCount = PLANETS_DATA.filter(p => p.status === 'completed').length;
  const inProgressCount = PLANETS_DATA.filter(p => p.status === 'in-progress').length;
  const totalProgress = ((completedCount + inProgressCount * 0.6) / PLANETS_DATA.length) * 100;

  const handlePlanetClick = (planet: any) => {
    setSelectedPlanet(planet);
    setIsModalOpen(true);
  };

  return (
    <div style={styles.galaxy} ref={galaxyRef}>
      {/* Звездное небо */}
      <div style={styles.stars}></div>
      
      {/* Падающие звезды */}
      <div style={styles.shootingStars}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.shootingStar,
              top: `${20 + i * 30}%`,
              animationDelay: `${i * 3}s`
            }}
          ></div>
        ))}
      </div>
      
      {/* Заголовок */}
      <div style={styles.spaceTitle}>
        <h1 style={styles.mainTitle}>🦊 CRAZYFOX GALAXY</h1>
        <p style={styles.subtitle}>90-DAY MOON MISSION</p>
      </div>
      
      {/* Подсказка для взаимодействия */}
      <div style={styles.instructionHint}>
        👆 Tap planets to explore missions
      </div>
      
      {/* Солнечная система роадмапа */}
      <div style={styles.galaxyMap}>
        <div style={styles.solarSystem}>
          {/* Орбитальные кольца */}
          {PLANETS_DATA.map((planet, index) => (
            <div
              key={`orbit-${planet.id}`}
              style={{
                ...styles.orbitRing,
                width: `${planet.orbitRadius * 2}px`,
                height: `${planet.orbitRadius * 2}px`
              }}
            ></div>
          ))}
          
          {/* Центральное солнце */}
          <div style={{
            position: 'absolute' as const,
            top: '45%',
            left: '45%',
            transform: 'translate(-50%, -50%)',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FFD700, #FF6B35)',
            animation: 'pulse 2s ease-in-out infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 0 20px #FFD700'
          }}>
            ☀️
          </div>
          
          {/* Планеты */}
          {PLANETS_DATA.map((planet, index) => {
            const angle = (index / PLANETS_DATA.length) * 360;
            
            return (
              <div
                key={planet.id}
                style={{
                  ...styles.planetOrbit,
                  width: `${planet.orbitRadius * 2}px`,
                  height: `${planet.orbitRadius * 2}px`,
                  top: '50%',
                  left: '50%',
                  marginTop: `-${planet.orbitRadius}px`,
                  marginLeft: `-${planet.orbitRadius}px`,
                  animationDuration: planet.orbitSpeed
                }}
              >
                <div
                  style={{
                    ...styles.planet,
                    width: `${planet.size}px`,
                    height: `${planet.size}px`,
                    background: `radial-gradient(circle at 30% 30%, ${planet.color}, ${planet.color}88)`,
                    color: statusColors[planet.status as keyof typeof statusColors],
                    top: '0',
                    left: '50%',
                    marginLeft: `-${planet.size / 2}px`,
                    marginTop: `-${planet.size / 2}px`,
                    position: 'relative' as const
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlanetClick(planet);
                  }}
                >
                  {planet.emoji}
                  {/* Индикатор касания */}
                  <div style={styles.tapIndicator}></div>
                </div>
              </div>
            );
          })}          
        </div>
      </div>
      
      {/* Прогресс-бар внизу */}
      <div style={styles.progressRocket}>
        <div style={{fontSize: '20px'}}>🚀</div>
        <div style={styles.progressTrack}>
          <div style={{
            ...styles.progressBar,
            width: `${totalProgress}%`
          }}>
            <div style={styles.progressGlow}></div>
          </div>
        </div>
        <div style={{color: '#4ECDC4', fontWeight: 'bold', marginLeft: '10px', fontSize: 'clamp(0.8rem, 2vw, 1rem)'}}>
          {totalProgress.toFixed(0)}% 🌙
        </div>
      </div>
      
      {/* Модальное окно */}
      {isModalOpen && selectedPlanet && (
        <div style={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setIsModalOpen(false)}>×</button>
            
            <div style={{textAlign: 'center' as const, marginBottom: '20px'}}>
              <div style={{fontSize: 'clamp(2.5rem, 8vw, 4rem)', marginBottom: '8px'}}>{selectedPlanet.emoji}</div>
              <h2 style={{color: selectedPlanet.color, fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', margin: 0}}>
                {selectedPlanet.name}
              </h2>
              <p style={{color: 'rgba(255,255,255,0.7)', margin: '8px 0', fontSize: 'clamp(0.8rem, 2.2vw, 1rem)'}}>
                {selectedPlanet.phase} • {selectedPlanet.duration}
              </p>
            </div>
            
            {/* Краткая статистика */}
            <div style={styles.quickStats}>
              <div style={styles.statCard}>
                <div style={{...styles.statValue, color: selectedPlanet.color}}>💰 {selectedPlanet.stats.price}</div>
                <div style={styles.statLabel}>Price</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statValue, color: selectedPlanet.color}}>🪙 {selectedPlanet.stats.tokens}</div>
                <div style={styles.statLabel}>Tokens</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statValue, color: selectedPlanet.color}}>📊 {selectedPlanet.percentage}%</div>
                <div style={styles.statLabel}>Supply</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statValue, color: selectedPlanet.color}}>👥 {selectedPlanet.stats.holders}</div>
                <div style={styles.statLabel}>Holders</div>
              </div>
            </div>
            
            {/* Описание миссии */}
            <div style={{
              background: 'rgba(255, 107, 53, 0.1)',
              border: '1px solid rgba(255, 107, 53, 0.3)',
              borderRadius: '12px',
              padding: '15px',
              margin: '15px 0'
            }}>
              <h3 style={{color: '#FF6B35', marginBottom: '10px', fontSize: 'clamp(1rem, 3vw, 1.2rem)'}}>
                🎯 Mission Brief
              </h3>
              <p style={{lineHeight: '1.5', fontSize: 'clamp(0.8rem, 2.2vw, 0.9rem)', margin: 0}}>
                {selectedPlanet.description}
              </p>
            </div>
            
            {/* Цели миссии */}
            <div>
              <h3 style={{color: selectedPlanet.color, marginBottom: '10px', fontSize: 'clamp(1rem, 3vw, 1.2rem)'}}>
                📋 Key Objectives
              </h3>
              <ul style={styles.objectivesList}>
                {selectedPlanet.objectives.map((objective: string, index: number) => (
                  <li key={index} style={styles.objective}>
                    <span style={{fontSize: 'clamp(0.8rem, 2vw, 1rem)', minWidth: '16px'}}>🦊</span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Статус миссии */}
            <div style={{
              textAlign: 'center' as const,
              padding: '12px',
              borderRadius: '10px',
              background: `rgba(${
                selectedPlanet.status === 'completed' ? '46, 204, 113' :
                selectedPlanet.status === 'in-progress' ? '243, 156, 18' : '149, 165, 166'
              }, 0.2)`,
              border: `1px solid rgba(${
                selectedPlanet.status === 'completed' ? '46, 204, 113' :
                selectedPlanet.status === 'in-progress' ? '243, 156, 18' : '149, 165, 166'
              }, 0.3)`,
              marginTop: '15px'
            }}>
              <div style={{fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', marginBottom: '4px'}}>
                {selectedPlanet.status === 'completed' ? '✅ Completed' :
                 selectedPlanet.status === 'in-progress' ? '🔄 In Progress' : '📅 Planned'}
              </div>
              {selectedPlanet.id === 6 && (
                <div style={{
                  fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                  color: '#FFD700',
                  fontWeight: 'bold'
                }}>
                  🌙 Next: Mars Mission 2026! 🔴
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrazyFoxSpaceRoadmap;