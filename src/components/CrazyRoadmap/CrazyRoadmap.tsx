import { useState, useRef, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './CrazyFoxSpaceRoadmap.module.css';

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

const CrazyFoxSpaceRoadmap: React.FC = () => {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const galaxyRef = useRef<HTMLDivElement>(null);

  // Language hook - теперь используем getComponentObjectArray для массивов
  const { getComponentText, getComponentObjectArray } = useLanguage();

  const PLANETS_DATA: PlanetData[] = useMemo(() => [
    {
      id: 1,
      name: getComponentText('crazyFoxSpaceRoadmap', 'planets.launchStation.name'),
      phase: getComponentText('crazyFoxSpaceRoadmap', 'planets.launchStation.phase'),
      emoji: getComponentText('crazyFoxSpaceRoadmap', 'planets.launchStation.emoji'),
      size: 70,
      color: '#FF6B35',
      orbitRadius: 110,
      orbitSpeed: '20s',
      status: 'completed',
      price: '$0.005',
      duration: getComponentText('crazyFoxSpaceRoadmap', 'planets.launchStation.duration'),
      tokens: getComponentText('crazyFoxSpaceRoadmap', 'planets.launchStation.tokens'),
      description: getComponentText('crazyFoxSpaceRoadmap', 'planets.launchStation.description'),
      objectives: getComponentObjectArray('crazyFoxSpaceRoadmap', 'planets.launchStation.objectives', [
        'Deploy verified BSC smart contract',
        'Launch website & social channels',
        'Community building & documentation',
        'Complete security audit'
      ]),
      stats: { price: '$0.005', tokens: '150M', progress: '100%', holders: '1.2K' }
    },
    {
      id: 2,
      name: getComponentText('crazyFoxSpaceRoadmap', 'planets.communityHub.name'),
      phase: getComponentText('crazyFoxSpaceRoadmap', 'planets.communityHub.phase'),
      emoji: getComponentText('crazyFoxSpaceRoadmap', 'planets.communityHub.emoji'),
      size: 75,
      color: '#4ECDC4',
      orbitRadius: 160,
      orbitSpeed: '30s',
      status: 'in-progress',
      price: '$0.006',
      duration: getComponentText('crazyFoxSpaceRoadmap', 'planets.communityHub.duration'),
      tokens: getComponentText('crazyFoxSpaceRoadmap', 'planets.communityHub.tokens'),
      description: getComponentText('crazyFoxSpaceRoadmap', 'planets.communityHub.description'),
      objectives: getComponentObjectArray('crazyFoxSpaceRoadmap', 'planets.communityHub.objectives', [
        'Launch aggressive marketing',
        'Partner with crypto KOLs',
        'CoinGecko & CMC listings',
        'Grow to 10K+ members'
      ]),
      stats: { price: '$0.006', tokens: '150M', progress: '75%', holders: '8.5K' }
    },
    {
      id: 3,
      name: getComponentText('crazyFoxSpaceRoadmap', 'planets.viralPlanet.name'),
      phase: getComponentText('crazyFoxSpaceRoadmap', 'planets.viralPlanet.phase'),
      emoji: getComponentText('crazyFoxSpaceRoadmap', 'planets.viralPlanet.emoji'),
      size: 80,
      color: '#9B59B6',
      orbitRadius: 210,
      orbitSpeed: '40s',
      status: 'planned',
      price: '$0.007',
      duration: getComponentText('crazyFoxSpaceRoadmap', 'planets.viralPlanet.duration'),
      tokens: getComponentText('crazyFoxSpaceRoadmap', 'planets.viralPlanet.tokens'),
      description: getComponentText('crazyFoxSpaceRoadmap', 'planets.viralPlanet.description'),
      objectives: getComponentObjectArray('crazyFoxSpaceRoadmap', 'planets.viralPlanet.objectives', [
        'Viral TikTok & YouTube content',
        'Major crypto news coverage',
        'Referral reward programs',
        'Target 50K+ community'
      ]),
      stats: { price: '$0.007', tokens: '100M', progress: '0%', holders: '50K+' }
    },
    {
      id: 4,
      name: getComponentText('crazyFoxSpaceRoadmap', 'planets.exchangeGate.name'),
      phase: getComponentText('crazyFoxSpaceRoadmap', 'planets.exchangeGate.phase'),
      emoji: getComponentText('crazyFoxSpaceRoadmap', 'planets.exchangeGate.emoji'),
      size: 85,
      color: '#2ECC71',
      orbitRadius: 260,
      orbitSpeed: '50s',
      status: 'planned',
      price: '$0.008',
      duration: getComponentText('crazyFoxSpaceRoadmap', 'planets.exchangeGate.duration'),
      tokens: getComponentText('crazyFoxSpaceRoadmap', 'planets.exchangeGate.tokens'),
      description: getComponentText('crazyFoxSpaceRoadmap', 'planets.exchangeGate.description'),
      objectives: getComponentObjectArray('crazyFoxSpaceRoadmap', 'planets.exchangeGate.objectives', [
        'Complete presale phase',
        'PancakeSwap listing',
        'First CEX applications',
        'Advanced tokenomics'
      ]),
      stats: { price: '$0.008', tokens: '75M', progress: '0%', holders: '100K+' }
    },
    {
      id: 5,
      name: getComponentText('crazyFoxSpaceRoadmap', 'planets.utilityCore.name'),
      phase: getComponentText('crazyFoxSpaceRoadmap', 'planets.utilityCore.phase'),
      emoji: getComponentText('crazyFoxSpaceRoadmap', 'planets.utilityCore.emoji'),
      size: 78,
      color: '#F39C12',
      orbitRadius: 310,
      orbitSpeed: '60s',
      status: 'planned',
      price: '$0.009',
      duration: getComponentText('crazyFoxSpaceRoadmap', 'planets.utilityCore.duration'),
      tokens: getComponentText('crazyFoxSpaceRoadmap', 'planets.utilityCore.tokens'),
      description: getComponentText('crazyFoxSpaceRoadmap', 'planets.utilityCore.description'),
      objectives: getComponentObjectArray('crazyFoxSpaceRoadmap', 'planets.utilityCore.objectives', [
        'Launch staking platform',
        'Token burning mechanisms',
        'First CEX listings',
        'High yield rewards'
      ]),
      stats: { price: '$0.009', tokens: '50M', progress: '0%', holders: '200K+' }
    },
    {
      id: 6,
      name: getComponentText('crazyFoxSpaceRoadmap', 'planets.moonBase.name'),
      phase: getComponentText('crazyFoxSpaceRoadmap', 'planets.moonBase.phase'),
      emoji: getComponentText('crazyFoxSpaceRoadmap', 'planets.moonBase.emoji'),
      size: 90,
      color: '#FFD700',
      orbitRadius: 360,
      orbitSpeed: '70s',
      status: 'planned',
      price: '$0.01',
      duration: getComponentText('crazyFoxSpaceRoadmap', 'planets.moonBase.duration'),
      tokens: getComponentText('crazyFoxSpaceRoadmap', 'planets.moonBase.tokens'),
      description: getComponentText('crazyFoxSpaceRoadmap', 'planets.moonBase.description'),
      objectives: getComponentObjectArray('crazyFoxSpaceRoadmap', 'planets.moonBase.objectives', [
        'Major CEX listing achieved',
        '$100M+ market cap target',
        'Supply reduction via burning',
        'Ecosystem planning'
      ]),
      stats: { price: '$0.01', tokens: '25M', progress: '0%', holders: '500K+' }
    },
    {
      id: 7,
      name: getComponentText('crazyFoxSpaceRoadmap', 'planets.ecosystemGalaxy.name'),
      phase: getComponentText('crazyFoxSpaceRoadmap', 'planets.ecosystemGalaxy.phase'),
      emoji: getComponentText('crazyFoxSpaceRoadmap', 'planets.ecosystemGalaxy.emoji'),
      size: 85,
      color: '#E74C3C',
      orbitRadius: 410,
      orbitSpeed: '80s',
      status: 'planned',
      price: 'TBA',
      duration: getComponentText('crazyFoxSpaceRoadmap', 'planets.ecosystemGalaxy.duration'),
      tokens: getComponentText('crazyFoxSpaceRoadmap', 'planets.ecosystemGalaxy.tokens'),
      description: getComponentText('crazyFoxSpaceRoadmap', 'planets.ecosystemGalaxy.description'),
      objectives: getComponentObjectArray('crazyFoxSpaceRoadmap', 'planets.ecosystemGalaxy.objectives', [
        'CrazyFox Heroes NFT collection',
        'P2E game: CrazyFox Adventure',
        'NFT marketplace launch',
        'Mobile app & dashboard'
      ]),
      stats: { price: 'TBA', tokens: 'Utility', progress: '0%', holders: '1M+' }
    }
  ], [getComponentText, getComponentObjectArray]);

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
        <h1 className={styles.mainTitle}>
          {getComponentText('crazyFoxSpaceRoadmap', 'title')}
        </h1>
        <p className={styles.subtitle}>
          {getComponentText('crazyFoxSpaceRoadmap', 'subtitle')}
        </p>
      </div>
      
      {/* Подсказка для взаимодействия */}
      <div className={styles.instructionHint}>
        {getComponentText('crazyFoxSpaceRoadmap', 'instructionHint')}
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
        <div style={{fontSize: '20px'}}>
          {getComponentText('crazyFoxSpaceRoadmap', 'progress.rocket')}
        </div>
        <div className={styles.progressTrack}>
          <div 
            className={styles.progressBar}
            style={{ width: `${totalProgress}%` }}
          >
            <div className={styles.progressGlow}></div>
          </div>
        </div>
        <div className={styles.progressText}>
          {totalProgress.toFixed(0)}% {getComponentText('crazyFoxSpaceRoadmap', 'progress.moon')}
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
                <div className={styles.statLabel}>
                  {getComponentText('crazyFoxSpaceRoadmap', 'modal.stats.price')}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: selectedPlanet.color }}>
                  🪙 {selectedPlanet.stats.tokens}
                </div>
                <div className={styles.statLabel}>
                  {getComponentText('crazyFoxSpaceRoadmap', 'modal.stats.tokens')}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: selectedPlanet.color }}>
                  📊 {selectedPlanet.stats.progress}
                </div>
                <div className={styles.statLabel}>
                  {getComponentText('crazyFoxSpaceRoadmap', 'modal.stats.progress')}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: selectedPlanet.color }}>
                  👥 {selectedPlanet.stats.holders}
                </div>
                <div className={styles.statLabel}>
                  {getComponentText('crazyFoxSpaceRoadmap', 'modal.stats.holders')}
                </div>
              </div>
            </div>
            
            {/* Описание миссии */}
            <div className={styles.missionBrief}>
              <h3 className={styles.missionBriefTitle}>
                {getComponentText('crazyFoxSpaceRoadmap', 'modal.missionBrief.title')}
              </h3>
              <p className={styles.missionBriefText}>
                {selectedPlanet.description}
              </p>
            </div>
            
            {/* Цели миссии */}
            <div>
              <h3 className={styles.objectivesTitle} style={{ color: selectedPlanet.color }}>
                {getComponentText('crazyFoxSpaceRoadmap', 'modal.objectives.title')}
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
                {selectedPlanet.status === 'completed' ? 
                  getComponentText('crazyFoxSpaceRoadmap', 'modal.status.completed') :
                 selectedPlanet.status === 'in-progress' ? 
                  getComponentText('crazyFoxSpaceRoadmap', 'modal.status.inProgress') : 
                  getComponentText('crazyFoxSpaceRoadmap', 'modal.status.planned')
                }
              </div>
              {selectedPlanet.id === 6 && (
                <div className={styles.marsMissionText}>
                  {getComponentText('crazyFoxSpaceRoadmap', 'modal.status.marsMission')}
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