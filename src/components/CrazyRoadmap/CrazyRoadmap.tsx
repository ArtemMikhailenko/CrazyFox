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
  
  @keyframes nebula {
    0% { transform: translateX(0) scale(1); opacity: 0.6; }
    50% { transform: translateX(50px) scale(1.2); opacity: 0.8; }
    100% { transform: translateX(0) scale(1); opacity: 0.6; }
  }
`;

// Стили космической темы
const styles: { [key: string]: React.CSSProperties } = {
  galaxy: {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
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
  
  nebula: {
    position: 'absolute' as const,
    width: '300px',
    height: '200px',
    background: 'radial-gradient(ellipse, rgba(255, 107, 53, 0.3), rgba(78, 205, 196, 0.2), transparent)',
    borderRadius: '50%',
    filter: 'blur(40px)',
    animation: 'nebula 15s ease-in-out infinite'
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
    fontSize: 'clamp(2.5rem, 8vw, 5rem)',
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
    fontSize: 'clamp(1rem, 3vw, 1.5rem)',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '300',
    letterSpacing: '2px'
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
    width: 'min(90vw, 90vh)',
    height: 'min(90vw, 90vh)',
    maxWidth: '800px',
    maxHeight: '800px'
  },
  
  orbitRing: {
    position: 'absolute' as const,
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none' as const  // Орбитальные кольца не должны блокировать клики
  },
  
  planet: {
    position: 'absolute' as const,
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
    animation: 'planet-glow 3s ease-in-out infinite',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    pointerEvents: 'auto' as const,  // Важно! Планета должна получать события мыши
    zIndex: 20  // Высокий z-index чтобы быть выше других элементов
  },
  
  planetHover: {
    transform: 'scale(1.3)',
    zIndex: 100,  // Еще более высокий z-index при hover
    boxShadow: '0 0 40px currentColor, 0 0 80px currentColor'
  },
  
  planetOrbit: {
    position: 'absolute' as const,
    borderRadius: '50%',
    animation: 'orbit 60s linear infinite',
    pointerEvents: 'none' as const  // Важно! Орбита не должна блокировать события мыши
  },
  
  foxRocket: {
    position: 'absolute' as const,
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    zIndex: 50,
    animation: 'float 4s ease-in-out infinite',
    cursor: 'pointer',
    filter: 'drop-shadow(0 0 10px #FF6B35)'
  },
  
  progressRocket: {
    position: 'absolute' as const,
    top: '85%',
    left: '5%',
    width: '90%',
    height: '60px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '30px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    zIndex: 100
  },
  
  progressTrack: {
    flex: 1,
    height: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    marginLeft: '15px',
    position: 'relative' as const,
    overflow: 'hidden' as const
  },
  
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #4ECDC4, #FF6B35, #FFD700)',
    borderRadius: '10px',
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
  
  planetInfo: {
    position: 'absolute' as const,
    background: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '15px',
    borderRadius: '15px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(20px)',
    minWidth: '250px',
    zIndex: 1000,
    fontSize: '14px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
  },
  
  planetTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    paddingBottom: '8px'
  },
  
  planetDescription: {
    fontSize: '0.9rem',
    lineHeight: '1.4',
    color: 'rgba(255, 255, 255, 0.9)'
  },
  
  planetStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '12px',
    fontSize: '0.8rem'
  },
  
  statItem: {
    padding: '5px 8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    textAlign: 'center' as const
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
    padding: '20px',
    backdropFilter: 'blur(20px)'
  },
  
  modalContent: {
    background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95))',
    borderRadius: '25px',
    padding: 'clamp(20px, 4vw, 40px)',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    border: '2px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(30px)',
    color: 'white',
    position: 'relative' as const,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
  },
  
  modalClose: {
    position: 'absolute' as const,
    top: '15px',
    right: '15px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: 'white',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  missionBrief: {
    background: 'rgba(255, 107, 53, 0.1)',
    border: '1px solid rgba(255, 107, 53, 0.3)',
    borderRadius: '15px',
    padding: '20px',
    margin: '20px 0'
  },
  
  objectivesList: {
    listStyle: 'none',
    padding: 0
  },
  
  objective: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  }
};

// Данные о планетах-этапах с полной информацией
const PLANETS_DATA = [
  {
    id: 1,
    name: 'Launch Station Alpha',
    phase: 'Phase 1',
    emoji: '🚀',
    size: 80,
    color: '#FF6B35',
    orbitRadius: 120,
    orbitSpeed: '20s',
    status: 'completed',
    price: '0.005¢',
    priceUSD: 0.00005,
    duration: 'Days 1-90',
    tokensAvailable: '100,000,000',
    percentage: 10,
    description: 'The beginning of our cosmic journey! Building the foundation for CrazyFox\'s interstellar mission.',
    objectives: [
      'Deploy smart contract and launch token on blockchain',
      'Launch website and establish social media presence',
      'Begin community formation and engagement',
      'Create comprehensive documentation and whitepaper',
      'Conduct initial private sale for early supporters'
    ],
    tasks: [
      { week: '1-2', task: 'Smart contract development and security audit' },
      { week: '3-4', task: 'Beta website launch and social channel setup' },
      { week: '5-8', task: 'Initial marketing campaign and community outreach' },
      { week: '9-12', task: 'Private sale for early investors and supporters' },
      { week: '13', task: 'Phase 1 completion review and assessment' }
    ],
    distribution: '10% of total supply (100,000,000 tokens) + 2% bonus for early community members',
    landmark: '🏁 Launch Pad',
    stats: { tokens: '100M', progress: '100%', explorers: '1.2K', price: '$50 μUSD' }
  },
  {
    id: 2,
    name: 'Development Nebula',
    phase: 'Phase 2',
    emoji: '🛠️',
    size: 90,
    color: '#4ECDC4',
    orbitRadius: 180,
    orbitSpeed: '30s',
    status: 'in-progress',
    price: '0.006¢',
    priceUSD: 0.00006,
    duration: 'Days 91-180',
    tokensAvailable: '150,000,000',
    percentage: 15,
    description: 'Traveling through the development nebula, expanding our cosmic infrastructure and building advanced systems.',
    objectives: [
      'Expand development team with top talent',
      'Launch MVP (Minimum Viable Product)',
      'Establish strategic partnerships',
      'Scale marketing and community efforts',
      'Implement advanced tokenomics features'
    ],
    tasks: [
      { week: '14-16', task: 'Team expansion and talent acquisition' },
      { week: '17-20', task: 'MVP development and beta testing' },
      { week: '21-24', task: 'Partnership integration and collaboration' },
      { week: '25-26', task: 'Second public token sale at new price point' }
    ],
    distribution: '15% of total supply (150,000,000 tokens) + 3% for marketing initiatives',
    landmark: '🏭 Innovation Factory',
    stats: { tokens: '150M', progress: '75%', explorers: '2.8K', price: '$60 μUSD' }
  },
  {
    id: 3,
    name: 'Utility Asteroid Belt',
    phase: 'Phase 3',
    emoji: '💎',
    size: 85,
    color: '#9B59B6',
    orbitRadius: 240,
    orbitSpeed: '40s',
    status: 'planned',
    price: '0.007¢',
    priceUSD: 0.00007,
    duration: 'Days 181-270',
    tokensAvailable: '200,000,000',
    percentage: 20,
    description: 'Mining the utility asteroid belt for precious cosmic resources and implementing real-world applications.',
    objectives: [
      'Deploy user feedback improvements',
      'Launch native wallet application',
      'Implement staking and rewards program',
      'Integrate with major ecosystem projects',
      'Expand global market presence'
    ],
    tasks: [
      { week: '27-30', task: 'Product refinement based on user feedback' },
      { week: '31-34', task: 'Native wallet development and deployment' },
      { week: '35-38', task: 'Staking mechanism and reward system launch' }
    ],
    distribution: '20% of total supply (200,000,000 tokens) + 5% for staking rewards',
    landmark: '💎 Diamond Mines',
    stats: { tokens: '200M', progress: '0%', explorers: '5K+', price: '$70 μUSD' }
  },
  {
    id: 4,
    name: 'Ecosystem Planet Verde',
    phase: 'Phase 4',
    emoji: '🌍',
    size: 95,
    color: '#2ECC71',
    orbitRadius: 300,
    orbitSpeed: '50s',
    status: 'planned',
    price: '0.008¢',
    priceUSD: 0.00008,
    duration: 'Days 271-360',
    tokensAvailable: '200,000,000',
    percentage: 20,
    description: 'Colonizing Planet Verde and building a comprehensive DeFi ecosystem for all space foxes.',
    objectives: [
      'Develop advanced utility features',
      'Create decentralized applications (dApps)',
      'Prepare for DEX listings and liquidity provision',
      'Expand geographical reach globally',
      'Launch governance token features'
    ],
    tasks: [
      { week: '39-42', task: 'First dApps development and integration' },
      { week: '43-46', task: 'DEX listing preparation and documentation' },
      { week: '47-50', task: 'Global marketing campaign expansion' },
      { week: '51-52', task: 'Phase 4 completion and progress review' }
    ],
    distribution: '20% of total supply (200,000,000 tokens) + 5% for DEX liquidity',
    landmark: '🌳 Forest of Opportunities',
    stats: { tokens: '200M', progress: '0%', explorers: '10K+', price: '$80 μUSD' }
  },
  {
    id: 5,
    name: 'Exchange Gateway Station',
    phase: 'Phase 5',
    emoji: '🌌',
    size: 88,
    color: '#F39C12',
    orbitRadius: 360,
    orbitSpeed: '60s',
    status: 'planned',
    price: '0.009¢',
    priceUSD: 0.00009,
    duration: 'Days 361-450',
    tokensAvailable: '150,000,000',
    percentage: 15,
    description: 'Building the gateway to the greater galactic exchange network and preparing for major CEX listings.',
    objectives: [
      'Complete comprehensive security audits',
      'Prepare for centralized exchange (CEX) listings',
      'Expand team and ecosystem infrastructure',
      'Establish major partnerships and collaborations',
      'Implement advanced governance features'
    ],
    tasks: [
      { week: '53-56', task: 'Comprehensive security audit completion' },
      { week: '57-60', task: 'CEX listing documentation and preparation' },
      { week: '61-64', task: 'Exchange negotiations and listing preparation' }
    ],
    distribution: '15% of total supply (150,000,000 tokens) + 10% CEX liquidity reserve',
    landmark: '🏛️ Palace of Preparation',
    stats: { tokens: '150M', progress: '0%', explorers: '25K+', price: '$90 μUSD' }
  },
  {
    id: 6,
    name: 'Moon Base Alpha',
    phase: 'Phase 6',
    emoji: '🌙',
    size: 100,
    color: '#FFD700',
    orbitRadius: 420,
    orbitSpeed: '70s',
    status: 'planned',
    price: '0.01¢',
    priceUSD: 0.0001,
    duration: 'Days 451-540',
    tokensAvailable: '100,000,000',
    percentage: 10,
    description: 'The ultimate destination - establishing our legendary moon base and achieving galactic recognition!',
    objectives: [
      'Official listing on major centralized exchanges',
      'Launch comprehensive marketing campaign',
      'Ensure token price stability and growth',
      'Prepare long-term development strategy',
      'Establish CrazyFox as a major crypto player'
    ],
    tasks: [
      { week: '65-68', task: 'First centralized exchange listings go live' },
      { week: '69-72', task: 'Global marketing campaign execution' },
      { week: '73-76', task: 'Additional exchange listings expansion' },
      { week: '77-78', task: 'Long-term strategy presentation and roadmap 2026' }
    ],
    distribution: '10% of total supply (100,000,000 tokens) + 5% marketing reserve',
    landmark: '🌙 TO THE MOON!',
    stats: { tokens: '100M', progress: '0%', explorers: '100K+', price: '$100 μUSD' }
  }
];

const statusColors = {
  completed: '#2ECC71',
  'in-progress': '#F39C12',
  planned: '#95A5A6'
};

const CrazyFoxSpaceRoadmap = () => {
  const [selectedPlanet, setSelectedPlanet] = useState<any>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const completedCount = PLANETS_DATA.filter(p => p.status === 'completed').length;
  const inProgressCount = PLANETS_DATA.filter(p => p.status === 'in-progress').length;
  const totalProgress = ((completedCount + inProgressCount * 0.75) / PLANETS_DATA.length) * 100;

  const handlePlanetClick = (planet: any) => {
    setSelectedPlanet(planet);
    setIsModalOpen(true);
  };

  const getTooltipPosition = () => {
    if (!hoveredPlanet) return {};
    
    return {
      left: `${mousePos.x + 20}px`,
      top: `${mousePos.y - 50}px`
    };
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
      
      {/* Туманности */}
      <div style={{...styles.nebula, top: '10%', left: '10%'}}></div>
      <div style={{...styles.nebula, top: '60%', right: '10%', animationDelay: '7s'}}></div>
      
      {/* Заголовок */}
      <div style={styles.spaceTitle}>
        <h1 style={styles.mainTitle}>🦊 CRAZYFOX GALAXY</h1>
        <p style={styles.subtitle}>SPACE ROADMAP 2025</p>
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
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FFD700, #FF6B35)',
            animation: 'pulse 2s ease-in-out infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 0 30px #FFD700'
          }}>
            ☀️
          </div>
          
          {/* Планеты */}
          {PLANETS_DATA.map((planet, index) => {
            const angle = (index / PLANETS_DATA.length) * 360;
            const x = Math.cos((angle * Math.PI) / 180) * planet.orbitRadius;
            const y = Math.sin((angle * Math.PI) / 180) * planet.orbitRadius;
            
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
                    ...(hoveredPlanet?.id === planet.id ? styles.planetHover : {})
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Planet clicked:', planet.name); // Debug
                    handlePlanetClick(planet);
                  }}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    console.log('Planet hovered:', planet.name); // Debug
                    setHoveredPlanet(planet);
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    setHoveredPlanet(null);
                  }}
                >
                  {planet.emoji}
                </div>
              </div>
            );
          })}          
        </div>
      </div>
      
      {/* Прогресс-бар внизу */}
      <div style={styles.progressRocket}>
        <div style={{fontSize: '24px'}}>🚀</div>
        <div style={styles.progressTrack}>
          <div style={{
            ...styles.progressBar,
            width: `${totalProgress}%`
          }}>
            <div style={styles.progressGlow}></div>
          </div>
        </div>
        <div style={{color: '#4ECDC4', fontWeight: 'bold', marginLeft: '15px'}}>
          {totalProgress.toFixed(1)}%
        </div>
      </div>
      
      {/* Тултип планеты */}
      {hoveredPlanet && (
        <div style={{
          ...styles.planetInfo,
          ...getTooltipPosition()
        }}>
          <div style={{...styles.planetTitle, color: hoveredPlanet.color}}>
            {hoveredPlanet.emoji} {hoveredPlanet.name}
          </div>
          <div style={{fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginBottom: '8px'}}>
            {hoveredPlanet.phase} • {hoveredPlanet.duration}
          </div>
          <div style={styles.planetDescription}>
            {hoveredPlanet.description}
          </div>
          <div style={styles.planetStats}>
            <div style={styles.statItem}>💰 {hoveredPlanet.price}</div>
            <div style={styles.statItem}>🪙 {hoveredPlanet.tokensAvailable}</div>
            <div style={styles.statItem}>📊 {hoveredPlanet.percentage}%</div>
            <div style={styles.statItem}>👥 {hoveredPlanet.stats.explorers}</div>
          </div>
          <div style={{
            marginTop: '8px', 
            fontSize: '0.7rem', 
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center' as const
          }}>
            Click to explore mission details 🚀
          </div>
        </div>
      )}
      
      {/* Модальное окно */}
      {isModalOpen && selectedPlanet && (
        <div style={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setIsModalOpen(false)}>×</button>
            
            <div style={{textAlign: 'center' as const, marginBottom: '30px'}}>
              <div style={{fontSize: '4rem', marginBottom: '10px'}}>{selectedPlanet.emoji}</div>
              <h2 style={{color: selectedPlanet.color, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', margin: 0}}>
                {selectedPlanet.name}
              </h2>
              <p style={{color: 'rgba(255,255,255,0.7)', margin: '10px 0', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)'}}>
                {selectedPlanet.phase} • {selectedPlanet.duration} • {selectedPlanet.landmark}
              </p>
            </div>
            
            <div style={styles.missionBrief}>
              <h3 style={{color: '#FF6B35', marginBottom: '15px', fontSize: 'clamp(1.1rem, 3vw, 1.4rem)'}}>
                🎯 Mission Briefing
              </h3>
              <p style={{lineHeight: '1.6', fontSize: 'clamp(0.9rem, 2.2vw, 1.1rem)'}}>
                {selectedPlanet.description}
              </p>
            </div>
            
            {/* Статистика миссии */}
            <div style={{
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '15px',
              marginBottom: '25px'
            }}>
              <div style={{background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', textAlign: 'center' as const}}>
                <div style={{fontSize: 'clamp(1.5rem, 4vw, 2rem)'}}>💰</div>
                <div style={{color: selectedPlanet.color, fontWeight: 'bold', fontSize: 'clamp(1rem, 2.5vw, 1.3rem)'}}>{selectedPlanet.price}</div>
                <div style={{fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: 'rgba(255,255,255,0.7)'}}>Token Price</div>
              </div>
              <div style={{background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', textAlign: 'center' as const}}>
                <div style={{fontSize: 'clamp(1.5rem, 4vw, 2rem)'}}>🪙</div>
                <div style={{color: selectedPlanet.color, fontWeight: 'bold', fontSize: 'clamp(1rem, 2.5vw, 1.3rem)'}}>{selectedPlanet.tokensAvailable}</div>
                <div style={{fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: 'rgba(255,255,255,0.7)'}}>Available Tokens</div>
              </div>
              <div style={{background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', textAlign: 'center' as const}}>
                <div style={{fontSize: 'clamp(1.5rem, 4vw, 2rem)'}}>📊</div>
                <div style={{color: selectedPlanet.color, fontWeight: 'bold', fontSize: 'clamp(1rem, 2.5vw, 1.3rem)'}}>{selectedPlanet.percentage}%</div>
                <div style={{fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: 'rgba(255,255,255,0.7)'}}>Supply Share</div>
              </div>
              <div style={{background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', textAlign: 'center' as const}}>
                <div style={{fontSize: 'clamp(1.5rem, 4vw, 2rem)'}}>👥</div>
                <div style={{color: selectedPlanet.color, fontWeight: 'bold', fontSize: 'clamp(1rem, 2.5vw, 1.3rem)'}}>{selectedPlanet.stats.explorers}</div>
                <div style={{fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: 'rgba(255,255,255,0.7)'}}>Explorers</div>
              </div>
            </div>
            
            <div style={{marginBottom: '25px'}}>
              <h3 style={{color: selectedPlanet.color, marginBottom: '15px', fontSize: 'clamp(1.1rem, 3vw, 1.4rem)'}}>
                📋 Mission Objectives
              </h3>
              <ul style={styles.objectivesList}>
                {selectedPlanet.objectives.map((objective: string, index: number) => (
                  <li key={index} style={styles.objective}>
                    <span style={{fontSize: 'clamp(1rem, 2.5vw, 1.2rem)'}}>🦊</span>
                    <span style={{fontSize: 'clamp(0.85rem, 2.1vw, 0.95rem)'}}>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Детальные задачи по неделям */}
            {selectedPlanet.tasks && (
              <div style={{marginBottom: '25px'}}>
                <h3 style={{color: selectedPlanet.color, marginBottom: '15px', fontSize: 'clamp(1.1rem, 3vw, 1.4rem)'}}>
                  🗓️ Weekly Mission Timeline
                </h3>
                <div style={{display: 'grid', gap: '12px'}}>
                  {selectedPlanet.tasks.map((task: any, index: number) => (
                    <div key={index} style={{
                      display: 'flex',
                      gap: 'clamp(10px, 2.5vw, 15px)',
                      padding: 'clamp(12px, 2.5vw, 15px)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      flexWrap: 'wrap' as const
                    }}>
                      <div style={{
                        background: `rgba(${selectedPlanet.color === '#FF6B35' ? '255, 107, 53' : 
                          selectedPlanet.color === '#4ECDC4' ? '78, 205, 196' :
                          selectedPlanet.color === '#9B59B6' ? '155, 89, 182' :
                          selectedPlanet.color === '#2ECC71' ? '46, 204, 113' :
                          selectedPlanet.color === '#F39C12' ? '243, 156, 18' : '255, 215, 0'}, 0.25)`,
                        color: selectedPlanet.color,
                        padding: '4px 12px',
                        borderRadius: '15px',
                        fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                        fontWeight: '600',
                        whiteSpace: 'nowrap' as const,
                        flexShrink: 0
                      }}>
                        Week {task.week}
                      </div>
                      <div style={{
                        fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                        lineHeight: '1.5',
                        color: 'rgba(255, 255, 255, 0.8)',
                        flex: 1
                      }}>
                        {task.task}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Распределение токенов */}
            {selectedPlanet.distribution && (
              <div style={{marginBottom: '20px'}}>
                <h3 style={{color: selectedPlanet.color, marginBottom: '15px', fontSize: 'clamp(1.1rem, 3vw, 1.4rem)'}}>
                  💎 Token Distribution Strategy
                </h3>
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  padding: 'clamp(15px, 3vw, 20px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 'clamp(0.85rem, 2.1vw, 0.95rem)',
                  lineHeight: '1.6',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  {selectedPlanet.distribution}
                </div>
              </div>
            )}
            
            {/* Статус миссии */}
            <div style={{
              textAlign: 'center' as const,
              padding: '15px',
              borderRadius: '12px',
              background: `rgba(${
                selectedPlanet.status === 'completed' ? '46, 204, 113' :
                selectedPlanet.status === 'in-progress' ? '243, 156, 18' : '149, 165, 166'
              }, 0.2)`,
              border: `1px solid rgba(${
                selectedPlanet.status === 'completed' ? '46, 204, 113' :
                selectedPlanet.status === 'in-progress' ? '243, 156, 18' : '149, 165, 166'
              }, 0.3)`
            }}>
              <div style={{fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', marginBottom: '5px'}}>
                {selectedPlanet.status === 'completed' ? '✅ Mission Completed' :
                 selectedPlanet.status === 'in-progress' ? '🔄 Mission In Progress' : '📅 Mission Planned'}
              </div>
              <div style={{fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: 'rgba(255,255,255,0.8)'}}>
                Status: {selectedPlanet.status.charAt(0).toUpperCase() + selectedPlanet.status.slice(1).replace('-', ' ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrazyFoxSpaceRoadmap;