import { useState, useRef } from 'react';
import styles from './CrazyFoxSpaceRoadmap.module.css'; // Импорт CSS модулей

interface PlanetData {
  id: number;
  name: string;
  phase: string;
  emoji: string;
  size: number;
  color: string;
  orbitRadius: number;
  orbitSpeed: string;
  status: 'completed' | 'in-progress' | 'planned';
  price: string;
  duration: string;
  tokens: string;
  description: string;
  objectives: string[];
  stats: {
    price: string;
    tokens: string;
    progress: string;
    holders: string;
  };
}

const PLANETS_DATA: PlanetData[] = [
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
    price: '$0.005',
    duration: 'Days 1-15',
    tokens: '150M CRFX',
    description: 'Foundation launch phase with verified smart contract deployment.',
    objectives: [
      'Deploy verified BSC smart contract',
      'Launch website & social channels',
      'Community building & documentation',
      'Complete security audit'
    ],
    stats: { price: '$0.005', tokens: '150M', progress: '100%', holders: '1.2K' }
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
    price: '$0.006',
    duration: 'Days 16-30',
    tokens: '150M CRFX',
    description: 'Community expansion with marketing campaigns and influencer partnerships.',
    objectives: [
      'Launch aggressive marketing',
      'Partner with crypto KOLs',
      'CoinGecko & CMC listings',
      'Grow to 10K+ members'
    ],
    stats: { price: '$0.006', tokens: '150M', progress: '75%', holders: '8.5K' }
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
    price: '$0.007',
    duration: 'Days 31-45',
    tokens: '100M CRFX',
    description: 'Explosive viral growth with TikTok/YouTube campaigns and referral programs.',
    objectives: [
      'Viral TikTok & YouTube content',
      'Major crypto news coverage',
      'Referral reward programs',
      'Target 50K+ community'
    ],
    stats: { price: '$0.007', tokens: '100M', progress: '0%', holders: '50K+' }
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
    price: '$0.008',
    duration: 'Days 46-60',
    tokens: '75M CRFX',
    description: 'Complete presale and launch on PancakeSwap with first CEX applications.',
    objectives: [
      'Complete presale phase',
      'PancakeSwap listing',
      'First CEX applications',
      'Advanced tokenomics'
    ],
    stats: { price: '$0.008', tokens: '75M', progress: '0%', holders: '100K+' }
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
    price: '$0.009',
    duration: 'Days 61-75',
    tokens: '50M CRFX',
    description: 'Launch staking platform, token burning mechanisms, and first CEX listings.',
    objectives: [
      'Launch staking platform',
      'Token burning mechanisms',
      'First CEX listings',
      'High yield rewards'
    ],
    stats: { price: '$0.009', tokens: '50M', progress: '0%', holders: '200K+' }
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
    price: '$0.01',
    duration: 'Days 76-90',
    tokens: '25M CRFX',
    description: '🌙 MOON ACHIEVED! Major CEX listing and $100M+ market cap target.',
    objectives: [
      'Major CEX listing achieved',
      '$100M+ market cap target',
      'Supply reduction via burning',
      'Ecosystem planning'
    ],
    stats: { price: '$0.01', tokens: '25M', progress: '0%', holders: '500K+' }
  },
  {
    id: 7,
    name: 'Ecosystem Galaxy',
    phase: 'Q4 2025',
    emoji: '🎮',
    size: 85,
    color: '#E74C3C',
    orbitRadius: 410,
    orbitSpeed: '80s',
    status: 'planned',
    price: 'TBA',
    duration: 'Q4 2025',
    tokens: 'Ecosystem',
    description: 'Full ecosystem launch: NFT collection, P2E game, and mobile app.',
    objectives: [
      'CrazyFox Heroes NFT collection',
      'P2E game: CrazyFox Adventure',
      'NFT marketplace launch',
      'Mobile app & dashboard'
    ],
    stats: { price: 'TBA', tokens: 'Utility', progress: '0%', holders: '1M+' }
  }
];

const CrazyFoxSpaceRoadmap: React.FC = () => {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const galaxyRef = useRef<HTMLDivElement>(null);

  const completedCount = PLANETS_DATA.filter(p => p.status === 'completed').length;
  const inProgressCount = PLANETS_DATA.filter(p => p.status === 'in-progress').length;
  const totalProgress = ((completedCount + inProgressCount * 0.6) / PLANETS_DATA.length) * 100;

  const handlePlanetClick = (planet: PlanetData) => {
    setSelectedPlanet(planet);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPlanet(null);
  };

  return (
    <div className={styles.galaxy} ref={galaxyRef}>
      {/* Звездное небо */}
      <div className={styles.stars}></div>
      
      {/* Падающие звезды */}
      <div className={styles.shootingStars}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={styles.shootingStar}
            style={{
              top: `${20 + i * 30}%`,
              animationDelay: `${i * 3}s`
            }}
          ></div>
        ))}
      </div>
      
      {/* Заголовок */}
      <div className={styles.spaceTitle}>
        <h1 className={styles.mainTitle}>🦊 CRAZYFOX GALAXY</h1>
        <p className={styles.subtitle}>90-DAY MOON MISSION</p>
      </div>
      
      {/* Подсказка для взаимодействия */}
      <div className={styles.instructionHint}>
        👆 Tap planets to explore missions
      </div>
      
      {/* Солнечная система роадмапа */}
      <div className={styles.galaxyMap}>
        <div className={styles.solarSystem}>
          {/* Орбитальные кольца */}
          {PLANETS_DATA.map((planet) => (
            <div
              key={`orbit-${planet.id}`}
              className={styles.orbitRing}
              style={{
                width: `${planet.orbitRadius * 2}px`,
                height: `${planet.orbitRadius * 2}px`
              }}
            ></div>
          ))}
          
          {/* Центральное солнце */}
          <div className={styles.centralSun}>
            ☀️
          </div>
          
          {/* Планеты */}
          {PLANETS_DATA.map((planet) => (
            <div
              key={planet.id}
              className={styles.planetOrbit}
              style={{
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
                className={styles.planet}
                style={{
                  width: `${planet.size}px`,
                  height: `${planet.size}px`,
                  background: `radial-gradient(circle at 30% 30%, ${planet.color}, ${planet.color}88)`,
                  color: planet.color,
                  top: '0',
                  left: '50%',
                  marginLeft: `-${planet.size / 2}px`,
                  marginTop: `-${planet.size / 2}px`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanetClick(planet);
                }}
              >
                {planet.emoji}
                {/* Индикатор касания */}
                <div className={styles.tapIndicator}></div>
              </div>
            </div>
          ))}          
        </div>
      </div>
      
      {/* Прогресс-бар внизу */}
      <div className={styles.progressRocket}>
        <div style={{fontSize: '20px'}}>🚀</div>
        <div className={styles.progressTrack}>
          <div 
            className={styles.progressBar}
            style={{ width: `${totalProgress}%` }}
          >
            <div className={styles.progressGlow}></div>
          </div>
        </div>
        <div className={styles.progressText}>
          {totalProgress.toFixed(0)}% 🌙
        </div>
      </div>
      
      {/* Модальное окно */}
      {isModalOpen && selectedPlanet && (
        <div className={styles.modal} onClick={handleModalClose}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={handleModalClose}>×</button>
            
            <div className={styles.modalHeader}>
              <div className={styles.modalEmoji}>{selectedPlanet.emoji}</div>
              <h2 className={styles.modalTitle} style={{ color: selectedPlanet.color }}>
                {selectedPlanet.name}
              </h2>
              <p className={styles.modalPhase}>
                {selectedPlanet.phase} • {selectedPlanet.duration}
              </p>
            </div>
            
            {/* Краткая статистика */}
            <div className={styles.quickStats}>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: selectedPlanet.color }}>
                  💰 {selectedPlanet.stats.price}
                </div>
                <div className={styles.statLabel}>Price</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: selectedPlanet.color }}>
                  🪙 {selectedPlanet.stats.tokens}
                </div>
                <div className={styles.statLabel}>Tokens</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: selectedPlanet.color }}>
                  📊 {selectedPlanet.stats.progress}
                </div>
                <div className={styles.statLabel}>Progress</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: selectedPlanet.color }}>
                  👥 {selectedPlanet.stats.holders}
                </div>
                <div className={styles.statLabel}>Holders</div>
              </div>
            </div>
            
            {/* Описание миссии */}
            <div className={styles.missionBrief}>
              <h3 className={styles.missionBriefTitle}>
                🎯 Mission Brief
              </h3>
              <p className={styles.missionBriefText}>
                {selectedPlanet.description}
              </p>
            </div>
            
            {/* Цели миссии */}
            <div>
              <h3 className={styles.objectivesTitle} style={{ color: selectedPlanet.color }}>
                📋 Key Objectives
              </h3>
              <ul className={styles.objectivesList}>
                {selectedPlanet.objectives.map((objective: string, index: number) => (
                  <li key={index} className={styles.objective}>
                    <span className={styles.objectiveIcon}>🦊</span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Статус миссии */}
            <div className={`${styles.missionStatus} ${styles[selectedPlanet.status.replace('-', '')]}`}>
              <div className={styles.statusText}>
                {selectedPlanet.status === 'completed' ? '✅ Completed' :
                 selectedPlanet.status === 'in-progress' ? '🔄 In Progress' : '📅 Planned'}
              </div>
              {selectedPlanet.id === 6 && (
                <div className={styles.marsMissionText}>
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