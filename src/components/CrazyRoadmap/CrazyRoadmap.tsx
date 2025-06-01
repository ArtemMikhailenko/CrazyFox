// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence, useInView } from 'framer-motion';
// import confetti from 'canvas-confetti';
// import { toast } from 'react-toastify';
// import styles from './CrazyRoadmapMap.module.css';

// // Complete roadmap data with all information
// const ROADMAP_DATA = [
//   {
//     id: 1,
//     phase: 'Етап 1',
//     title: 'Запуск і початкове фінансування',
//     duration: 'Дні 1-90',
//     price: '0.005¢',
//     priceUSD: 0.00005,
//     tokensAvailable: '100,000,000',
//     percentage: 10,
//     status: 'completed',
//     description: 'Створення фундаменту для майбутнього успіху CrazyFox',
//     color: '#FF6B35',
//     gradient: 'linear-gradient(135deg, #FF6B35, #FF8E53)',
//     icon: '🚀',
//     position: { x: 10, y: 85 },
//     goals: [
//       'Створення смарт-контракту та розгортання токена на блокчейні',
//       'Запуск веб-сайту та соціальних медіа',
//       'Початок формування спільноти',
//       'Створення документації та білого паперу',
//       'Проведення початкового приватного продажу'
//     ],
//     tasks: [
//       { week: '1-2', task: 'Розробка смарт-контракту та аудит безпеки' },
//       { week: '3-4', task: 'Запуск бета-версії веб-сайту та соціальних каналів' },
//       { week: '5-8', task: 'Перший етап маркетингової кампанії' },
//       { week: '9-12', task: 'Початковий приватний продаж для ранніх інвесторів' },
//       { week: '13', task: 'Підведення підсумків першого етапу' }
//     ],
//     distribution: '10% від загальної кількості (100,000,000 токенів) + 2% для винагороди ранніх членів спільноти',
//     landmark: '🏁 Стартова площадка'
//   },
//   {
//     id: 2,
//     phase: 'Етап 2',
//     title: 'Розвиток продукту',
//     duration: 'Дні 91-180',
//     price: '0.006¢',
//     priceUSD: 0.00006,
//     tokensAvailable: '150,000,000',
//     percentage: 15,
//     status: 'in-progress',
//     description: 'Розбудова екосистеми та розширення функціоналу проекту',
//     color: '#4ECDC4',
//     gradient: 'linear-gradient(135deg, #4ECDC4, #44A08D)',
//     icon: '🛠️',
//     position: { x: 85, y: 70 },
//     goals: [
//       'Розширення команди розробників',
//       'Запуск MVP (мінімально життєздатного продукту)',
//       'Створення перших партнерств',
//       'Розширення маркетингової кампанії'
//     ],
//     tasks: [
//       { week: '14-16', task: 'Розширення команди, найм додаткових спеціалістів' },
//       { week: '17-20', task: 'Розробка та запуск MVP функціоналу' },
//       { week: '21-24', task: 'Інтеграція з першими партнерами' },
//       { week: '25-26', task: 'Другий публічний продаж токенів за новою ціною' }
//     ],
//     distribution: '15% від загальної кількості (150,000,000 токенів) + 3% для маркетингових заходів',
//     landmark: '🏭 Завод інновацій'
//   },
//   {
//     id: 3,
//     phase: 'Етап 3',
//     title: 'Розширення використання',
//     duration: 'Дні 181-270',
//     price: '0.007¢',
//     priceUSD: 0.00007,
//     tokensAvailable: '200,000,000',
//     percentage: 20,
//     status: 'planned',
//     description: 'Впровадження корисних функцій та розширення можливостей екосистеми',
//     color: '#45B7D1',
//     gradient: 'linear-gradient(135deg, #45B7D1, #2980B9)',
//     icon: '💎',
//     position: { x: 25, y: 45 },
//     goals: [
//       'Удосконалення продукту на основі відгуків користувачів',
//       'Запуск першої версії гаманця',
//       'Впровадження програми стейкінгу',
//       'Інтеграція з більшими проектами екосистеми'
//     ],
//     tasks: [
//       { week: '27-30', task: 'Оновлення системи на основі відгуків користувачів' },
//       { week: '31-34', task: 'Розробка та запуск гаманця для токена' },
//       { week: '35-38', task: 'Впровадження механізму стейкінгу та винагород' }
//     ],
//     distribution: '20% від загальної кількості (200,000,000 токенів) + 5% для програми стейкінгу',
//     landmark: '💎 Діамантові копальні'
//   },
//   {
//     id: 4,
//     phase: 'Етап 4',
//     title: 'Зростання екосистеми',
//     duration: 'Дні 271-360',
//     price: '0.008¢',
//     priceUSD: 0.00008,
//     tokensAvailable: '200,000,000',
//     percentage: 20,
//     status: 'planned',
//     description: 'Розбудова DeFi екосистеми та підготовка до децентралізованих бірж',
//     color: '#96CEB4',
//     gradient: 'linear-gradient(135deg, #96CEB4, #85C1A4)',
//     icon: '🌱',
//     position: { x: 75, y: 30 },
//     goals: [
//       'Розробка додаткових корисних функцій',
//       'Створення децентралізованих додатків (dApps)',
//       'Підготовка до лістингу на перших децентралізованих біржах (DEX)',
//       'Розширення географічного охоплення'
//     ],
//     tasks: [
//       { week: '39-42', task: 'Розробка перших dApps з використанням токена' },
//       { week: '43-46', task: 'Підготовка документації для лістингу на DEX' },
//       { week: '47-50', task: 'Глобальна маркетингова кампанія' },
//       { week: '51-52', task: 'Підведення підсумків четвертого етапу' }
//     ],
//     distribution: '20% від загальної кількості (200,000,000 токенів) + 5% для забезпечення ліквідності на DEX',
//     landmark: '🌳 Ліс можливостей'
//   },
//   {
//     id: 5,
//     phase: 'Етап 5',
//     title: 'Передбіржовий етап',
//     duration: 'Дні 361-450',
//     price: '0.009¢',
//     priceUSD: 0.00009,
//     tokensAvailable: '150,000,000',
//     percentage: 15,
//     status: 'planned',
//     description: 'Підготовка до великих централізованих бірж та масштабування проекту',
//     color: '#FECA57',
//     gradient: 'linear-gradient(135deg, #FECA57, #F39C12)',
//     icon: '🏆',
//     position: { x: 40, y: 15 },
//     goals: [
//       'Аудит безпеки від провідних фірм',
//       'Підготовка до лістингу на централізованих біржах (CEX)',
//       'Розширення команди та екосистеми',
//       'Великі партнерства та колаборації'
//     ],
//     tasks: [
//       { week: '53-56', task: 'Проведення комплексного аудиту безпеки' },
//       { week: '57-60', task: 'Підготовка документації для лістингу на CEX' },
//       { week: '61-64', task: 'Переговори з біржами та підготовка до лістингу' }
//     ],
//     distribution: '15% від загальної кількості (150,000,000 токенів) + 10% резерв для ліквідності на CEX',
//     landmark: '🏛️ Палац підготовки'
//   },
//   {
//     id: 6,
//     phase: 'Етап 6',
//     title: 'Вихід на біржу',
//     duration: 'Дні 451-540',
//     price: '0.01¢',
//     priceUSD: 0.0001,
//     tokensAvailable: '100,000,000',
//     percentage: 10,
//     status: 'planned',
//     description: 'Досягнення головної мети та вихід на світовий криптовалютний ринок',
//     color: '#E74C3C',
//     gradient: 'linear-gradient(135deg, #E74C3C, #C0392B)',
//     icon: '🌟',
//     position: { x: 90, y: 5 },
//     goals: [
//       'Офіційний лістинг на централізованих біржах',
//       'Запуск комплексної маркетингової кампанії',
//       'Забезпечення стабільності та зростання вартості токена',
//       'Підготовка довгострокової стратегії розвитку'
//     ],
//     tasks: [
//       { week: '65-68', task: 'Лістинг на перших централізованих біржах' },
//       { week: '69-72', task: 'Глобальна маркетингова кампанія' },
//       { week: '73-76', task: 'Розширення лістингів на додаткові біржі' },
//       { week: '77-78', task: 'Представлення довгострокової стратегії на наступні роки' }
//     ],
//     distribution: '10% від загальної кількості (100,000,000 токенів) + 5% для маркетингових заходів',
//     landmark: '🌙 МІСЯЦЬ - НАША ЦІЛЬ!'
//   }
// ];

// // Fixed landmarks positions to avoid conflicts with phases
// const LANDMARKS = [
//   { id: 'crypto-volcano', position: { x: 55, y: 75 }, icon: '🌋', name: 'Crypto Volcano', description: 'Де народжуються токени' },
//   { id: 'defi-castle', position: { x: 12, y: 25 }, icon: '🏰', name: 'DeFi Castle', description: 'Фортеця децентралізації' },
//   { id: 'nft-gallery', position: { x: 82, y: 45 }, icon: '🖼️', name: 'NFT Gallery', description: 'Музей цифрового мистецтва' },
//   { id: 'whale-island', position: { x: 60, y: 55 }, icon: '🐋', name: 'Whale Island', description: 'Острів великих інвесторів' },
//   { id: 'meme-factory', position: { x: 35, y: 25 }, icon: '🏭', name: 'Meme Factory', description: 'Фабрика мемів' },
// ];

// // FIXED STATIC PATH - Aligned properly with phases
// const STATIC_PATH = `M 10 85 
//                      Q 50 75 25 45 
//                      Q 5 25 40 15 
//                      Q 60 10 75 30 
//                      Q 85 20 90 5`;

// // Weather Effects Component
// const WeatherEffects = ({ selectedPhase }) => {
//   const [particles, setParticles] = useState([]);

//   useEffect(() => {
//     if (!selectedPhase) return;

//     const generateParticles = () => {
//       const newParticles = [];
//       const particleCount = 15;
      
//       for (let i = 0; i < particleCount; i++) {
//         newParticles.push({
//           id: i,
//           x: Math.random() * 100,
//           y: Math.random() * 100,
//           size: Math.random() * 3 + 1,
//           speed: Math.random() * 2 + 1,
//           color: selectedPhase.color
//         });
//       }
//       setParticles(newParticles);
//     };

//     generateParticles();
//     const interval = setInterval(generateParticles, 3000);
    
//     return () => clearInterval(interval);
//   }, [selectedPhase]);

//   if (!selectedPhase) return null;

//   return (
//     <div className={styles.weatherEffect}>
//       {particles.map((particle) => (
//         <motion.div
//           key={particle.id}
//           className={styles.particle}
//           style={{
//             backgroundColor: particle.color,
//             width: `${particle.size}px`,
//             height: `${particle.size}px`,
//             left: `${particle.x}%`,
//             top: `${particle.y}%`,
//           }}
//           animate={{
//             y: [0, -100],
//             opacity: [0, 1, 0],
//             scale: [0, 1, 0]
//           }}
//           transition={{
//             duration: particle.speed,
//             repeat: Infinity,
//             ease: "easeOut"
//           }}
//         />
//       ))}
//     </div>
//   );
// };

// // Roadmap Phase Component with improved hover positioning
// const RoadmapPhase = ({ phase, index, isActive, onClick, selectedPhase }) => {
//   const ref = useRef(null);
//   const isInView = useInView(ref, { once: true });
//   const [isHovered, setIsHovered] = useState(false);

//   const statusConfig = {
//     completed: { color: '#2ECC71', icon: '✅', glow: '#2ECC7140' },
//     'in-progress': { color: '#F39C12', icon: '🔄', glow: '#F39C1240' },
//     planned: { color: '#95A5A6', icon: '📅', glow: '#95A5A640' }
//   };

//   const isSelected = selectedPhase?.id === phase.id;

//   const handleClick = () => {
//     onClick(phase);
//     confetti({
//       particleCount: 100,
//       spread: 70,
//       origin: { 
//         x: phase.position.x / 100, 
//         y: 1 - phase.position.y / 100 
//       },
//       colors: [phase.color, '#FF6B35', '#4ECDC4']
//     });
//   };

//   // Improved smart positioning for hover cards to prevent clipping
//   const getHoverCardStyle = () => {
//     const { x, y } = phase.position;
//     let style = {
//       position: 'absolute',
//       zIndex: 1000,
//     };

//     // More conservative positioning to prevent clipping
//     if (x > 65) {
//       // Right side - show card to the left with more margin
//       style = { ...style, right: '120%', top: '-100%' };
//     } else if (x < 35) {
//       // Left side - show card to the right with more margin
//       style = { ...style, left: '120%', top: '-100%' };
//     } else if (y < 30) {
//       // Top - show card below with safe margin
//       style = { ...style, top: '120%', left: '-100%' };
//     } else if (y > 70) {
//       // Bottom - show card above with safe margin
//       style = { ...style, bottom: '120%', left: '-100%' };
//     } else {
//       // Middle - show to the side based on x position
//       if (x < 50) {
//         style = { ...style, left: '120%', top: '-50%' };
//       } else {
//         style = { ...style, right: '120%', top: '-50%' };
//       }
//     }

//     return style;
//   };

//   return (
//     <motion.div
//       ref={ref}
//       className={styles.roadmapPhase}
//       style={{
//         left: `${phase.position.x}%`,
//         top: `${phase.position.y}%`,
//         zIndex: isSelected ? 1000 : isHovered ? 100 : 10
//       }}
//       initial={{ opacity: 0, scale: 0, rotate: -180 }}
//       animate={isInView ? { 
//         opacity: 1, 
//         scale: isSelected ? 1.3 : 1, 
//         rotate: 0
//       } : {}}
//       transition={{ 
//         duration: 0.8, 
//         delay: index * 0.2,
//         type: "spring",
//         stiffness: 100 
//       }}
//       whileHover={{ 
//         scale: isSelected ? 1.4 : 1.2,
//         transition: { duration: 0.2 }
//       }}
//       onClick={handleClick}
//       onHoverStart={() => setIsHovered(true)}
//       onHoverEnd={() => setIsHovered(false)}
//     >
//       {/* Enhanced Glow effect */}
//       <motion.div 
//         className={styles.phaseGlow}
//         animate={{
//           scale: isSelected ? [1.2, 1.8, 1.2] : [1, 1.2, 1],
//           opacity: isSelected ? [0.8, 1, 0.8] : [0.5, 0.8, 0.5]
//         }}
//         transition={{
//           duration: isSelected ? 1 : 2,
//           repeat: Infinity,
//           ease: "easeInOut"
//         }}
//         style={{ 
//           background: `radial-gradient(circle, ${isSelected ? phase.color + '80' : statusConfig[phase.status].glow} 0%, transparent 70%)`
//         }}
//       />

//       {/* Main phase circle */}
//       <motion.div 
//         className={styles.phaseCircle}
//         style={{ 
//           background: phase.gradient,
//           borderColor: isSelected ? '#FFD700' : statusConfig[phase.status].color,
//           borderWidth: isSelected ? '4px' : '2px'
//         }}
//         animate={phase.status === 'in-progress' || isSelected ? {
//           rotate: 360,
//           transition: { duration: isSelected ? 5 : 10, repeat: Infinity, ease: "linear" }
//         } : {}}
//       >
//         <div className={styles.phaseIcon}>{phase.icon}</div>
//         <div className={styles.phaseNumber}>{phase.id}</div>
//       </motion.div>

//       {/* Status indicator */}
//       <motion.div 
//         className={styles.statusIndicator}
//         style={{ 
//           backgroundColor: isSelected ? '#FFD700' : statusConfig[phase.status].color,
//           boxShadow: isSelected ? '0 0 20px #FFD700' : 'none'
//         }}
//         animate={{
//           scale: (phase.status === 'in-progress' || isSelected) ? [1, 1.2, 1] : 1
//         }}
//         transition={{
//           duration: 1,
//           repeat: (phase.status === 'in-progress' || isSelected) ? Infinity : 0
//         }}
//       >
//         {isSelected ? '⭐' : statusConfig[phase.status].icon}
//       </motion.div>

//       {/* Improved hover info card with smart positioning */}
//       <AnimatePresence>
//         {isHovered && !isSelected && (
//           <motion.div 
//             className={styles.hoverCard}
//             style={getHoverCardStyle()}
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             exit={{ opacity: 0, scale: 0.8 }}
//             transition={{ duration: 0.2 }}
//           >
//             <div 
//               className={styles.cardBackground}
//               style={{ background: phase.gradient }}
//             />
//             <div className={styles.cardContent}>
//               <div className={styles.cardHeader}>
//                 <div className={styles.cardPhase}>{phase.phase}</div>
//                 <div className={styles.cardPrice}>{phase.price}</div>
//               </div>
//               <div className={styles.cardTitle}>{phase.title}</div>
//               <div className={styles.cardDuration}>{phase.duration}</div>
//               <div className={styles.cardTokens}>
//                 <span className={styles.cardTokensLabel}>Токенів:</span>
//                 <span className={styles.cardTokensValue}>{phase.tokensAvailable}</span>
//               </div>
//               <div className={styles.cardLandmark}>{phase.landmark}</div>
//               <div className={styles.cardAction}>
//                 <span>🔍 Клікни для деталей</span>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// };

// // Landmark Component with better positioning
// const Landmark = ({ landmark, index, selectedPhase }) => {
//   const [isHovered, setIsHovered] = useState(false);
  
//   const isAffectedByPhase = selectedPhase && Math.abs(landmark.position.x - selectedPhase.position.x) < 30;

//   return (
//     <motion.div
//       className={styles.landmark}
//       style={{
//         left: `${landmark.position.x}%`,
//         top: `${landmark.position.y}%`,
//       }}
//       initial={{ opacity: 0, scale: 0 }}
//       animate={{ 
//         opacity: isAffectedByPhase ? 1 : 0.7, 
//         scale: isAffectedByPhase ? 1.2 : 1,
//         y: [0, -5, 0],
//         filter: isAffectedByPhase ? `drop-shadow(0 0 20px ${selectedPhase?.color || '#FFF'})` : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
//       }}
//       transition={{ 
//         duration: 0.8, 
//         delay: index * 0.3,
//         y: {
//           duration: 3,
//           repeat: Infinity,
//           ease: "easeInOut"
//         }
//       }}
//       whileHover={{ 
//         scale: 1.3, 
//         opacity: 1,
//         zIndex: 100
//       }}
//       onHoverStart={() => setIsHovered(true)}
//       onHoverEnd={() => setIsHovered(false)}
//     >
//       <div className={styles.landmarkIcon}>{landmark.icon}</div>
      
//       <AnimatePresence>
//         {isHovered && (
//           <motion.div 
//             className={styles.landmarkTooltip}
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 10 }}
//           >
//             <div className={styles.tooltipTitle}>{landmark.name}</div>
//             <div className={styles.tooltipDesc}>{landmark.description}</div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// };

// // FIXED Static Path Component - No more mouse jitter!
// const StaticPath = ({ selectedPhase }) => {
//   const pathRef = useRef(null);
//   const isInView = useInView(pathRef, { once: true });

//   return (
//     <svg className={styles.pathSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
//       <defs>
//         <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
//           <stop offset="0%" stopColor="#FF6B35" />
//           <stop offset="20%" stopColor="#4ECDC4" />
//           <stop offset="40%" stopColor="#45B7D1" />
//           <stop offset="60%" stopColor="#96CEB4" />
//           <stop offset="80%" stopColor="#FECA57" />
//           <stop offset="100%" stopColor="#E74C3C" />
//         </linearGradient>
        
//         <linearGradient id="selectedPathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
//           <stop offset="0%" stopColor={selectedPhase?.color || "#FF6B35"} />
//           <stop offset="50%" stopColor={selectedPhase?.color || "#4ECDC4"} stopOpacity="0.8" />
//           <stop offset="100%" stopColor={selectedPhase?.color || "#E74C3C"} />
//         </linearGradient>
        
//         <filter id="pathGlow">
//           <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
//           <feMerge> 
//             <feMergeNode in="coloredBlur"/>
//             <feMergeNode in="SourceGraphic"/>
//           </feMerge>
//         </filter>
        
//         <filter id="selectedPathGlow">
//           <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
//           <feMerge> 
//             <feMergeNode in="coloredBlur"/>
//             <feMergeNode in="SourceGraphic"/>
//           </feMerge>
//         </filter>
//       </defs>
      
//       <path
//         d={STATIC_PATH}
//         fill="none"
//         stroke="rgba(255, 255, 255, 0.1)"
//         strokeWidth="0.3"
//         strokeDasharray="1,1"
//       />
      
//       <motion.path
//         ref={pathRef}
//         d={STATIC_PATH}
//         fill="none"
//         stroke={selectedPhase ? "url(#selectedPathGradient)" : "url(#pathGradient)"}
//         strokeWidth={selectedPhase ? "1.2" : "0.6"}
//         filter={selectedPhase ? "url(#selectedPathGlow)" : "url(#pathGlow)"}
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         initial={{ pathLength: 0, opacity: 0 }}
//         animate={isInView ? { 
//           pathLength: 1, 
//           opacity: 1,
//           strokeWidth: selectedPhase ? [1.2, 1.8, 1.2] : 0.6
//         } : {}}
//         transition={{ 
//           duration: 3, 
//           ease: "easeInOut", 
//           delay: 0.5,
//           strokeWidth: {
//             duration: 2,
//             repeat: selectedPhase ? Infinity : 0,
//             ease: "easeInOut"
//           }
//         }}
//       />
      
//       <motion.g
//         initial={{ opacity: 0 }}
//         animate={isInView ? { 
//           opacity: 1,
//           offsetDistance: ["0%", "100%"]
//         } : {}}
//         transition={{
//           opacity: { duration: 0.5, delay: 2 },
//           offsetDistance: { 
//             duration: selectedPhase ? 4 : 6, 
//             repeat: Infinity, 
//             ease: "linear", 
//             delay: 2 
//           }
//         }}
//         style={{ offsetPath: `path('${STATIC_PATH}')` }}
//       >
//         <text 
//           x="0" 
//           y="0" 
//           fontSize="2" 
//           textAnchor="middle"
//           fill={selectedPhase?.color || "#FFD700"}
//         >
//           🚀
//         </text>
//       </motion.g>
      
//       {selectedPhase && (
//         <motion.circle
//           cx={selectedPhase.position.x}
//           cy={selectedPhase.position.y}
//           r="0"
//           fill="none"
//           stroke={selectedPhase.color}
//           strokeWidth="0.2"
//           opacity="0.6"
//           initial={{ r: 0 }}
//           animate={{ r: [0, 15, 0] }}
//           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
//         />
//       )}
//     </svg>
//   );
// };

// // Enhanced Modal with all roadmap information
// const EnhancedModal = ({ phase, isOpen, onClose }) => {
//   if (!phase || !isOpen) return null;

//   return (
//     <AnimatePresence>
//       <motion.div 
//         className={styles.modalBackdrop}
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         onClick={onClose}
//       >
//         <motion.div 
//           className={styles.enhancedModal}
//           initial={{ opacity: 0, scale: 0.8, y: 100 }}
//           animate={{ opacity: 1, scale: 1, y: 0 }}
//           exit={{ opacity: 0, scale: 0.8, y: 100 }}
//           onClick={(e) => e.stopPropagation()}
//         >
//           <div 
//             className={styles.modalHeader}
//             style={{ background: phase.gradient }}
//           >
//             <div className={styles.modalHeaderContent}>
//               <div className={styles.modalIcon}>{phase.icon}</div>
//               <div className={styles.modalTitleSection}>
//                 <h2>{phase.phase}: {phase.title}</h2>
//                 <p>{phase.duration}</p>
//                 <div className={styles.modalLandmark}>{phase.landmark}</div>
//               </div>
//               <button className={styles.closeButton} onClick={onClose}>✕</button>
//             </div>
//           </div>

//           <div className={styles.modalContent}>
//             <div className={styles.modalSection}>
//               <h3>📍 Опис етапу</h3>
//               <p>{phase.description}</p>
//             </div>

//             <div className={styles.modalStats}>
//               <div className={styles.modalStatCard}>
//                 <div className={styles.modalStatIcon}>💰</div>
//                 <div className={styles.modalStatValue}>{phase.price}</div>
//                 <div className={styles.modalStatLabel}>Ціна токена</div>
//                 <div className={styles.modalStatSubLabel}>${phase.priceUSD.toFixed(6)}</div>
//               </div>
//               <div className={styles.modalStatCard}>
//                 <div className={styles.modalStatIcon}>🪙</div>
//                 <div className={styles.modalStatValue}>{phase.tokensAvailable}</div>
//                 <div className={styles.modalStatLabel}>Доступно токенів</div>
//                 <div className={styles.modalStatSubLabel}>{phase.percentage}% від загальної кількості</div>
//               </div>
//               <div className={styles.modalStatCard}>
//                 <div className={styles.modalStatIcon}>📊</div>
//                 <div className={styles.modalStatValue}>{phase.percentage}%</div>
//                 <div className={styles.modalStatLabel}>Частка розподілу</div>
//                 <div className={styles.modalStatSubLabel}>Від 1 мільярда токенів</div>
//               </div>
//             </div>

//             <div className={styles.modalSection}>
//               <h3>🎯 Основні цілі етапу</h3>
//               <ul className={styles.modalList}>
//                 {phase.goals.map((goal, i) => (
//                   <motion.li 
//                     key={i}
//                     initial={{ opacity: 0, x: -20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: i * 0.1 }}
//                   >
//                     <span className={styles.listIcon}>🦊</span>
//                     {goal}
//                   </motion.li>
//                 ))}
//               </ul>
//             </div>

//             <div className={styles.modalSection}>
//               <h3>📋 Ключові завдання</h3>
//               <div className={styles.tasksList}>
//                 {phase.tasks.map((task, i) => (
//                   <motion.div
//                     key={i}
//                     className={styles.taskItem}
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: i * 0.1 }}
//                   >
//                     <div className={styles.taskWeek}>Тиждень {task.week}</div>
//                     <div className={styles.taskDescription}>{task.task}</div>
//                   </motion.div>
//                 ))}
//               </div>
//             </div>

//             <div className={styles.modalSection}>
//               <h3>💎 Розподіл токенів</h3>
//               <p className={styles.distributionText}>{phase.distribution}</p>
//             </div>

//             <motion.button 
//               className={styles.exploreButton}
//               style={{ background: phase.gradient }}
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               onClick={() => {
//                 toast.success(`Досліджуємо ${phase.landmark}! 🗺️`);
//                 confetti({
//                   particleCount: 50,
//                   spread: 60,
//                   origin: { y: 0.8 }
//                 });
//               }}
//             >
//               🔍 Дослідити {phase.phase}
//             </motion.button>
//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// };

// // Simplified Price Progression Component
// const PriceProgression = ({ handlePhaseClick }) => {
//   return (
//     <motion.div 
//       className={styles.priceProgression}
//       initial={{ opacity: 0, y: 30 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.8 }}
//       style={{
//         maxWidth: '1000px',
//         margin: '3rem auto',
//         padding: '2rem',
//         background: 'rgba(255, 255, 255, 0.05)',
//         borderRadius: '20px',
//         textAlign: 'center'
//       }}
//     >
//       <h3 style={{
//         fontSize: '2rem',
//         marginBottom: '2rem',
//         background: 'linear-gradient(45deg, #FECA57, #F39C12)',
//         WebkitBackgroundClip: 'text',
//         WebkitTextFillColor: 'transparent',
//         backgroundClip: 'text'
//       }}>
//         💰 Прогресія ціни токена
//       </h3>
//       <div style={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         gap: '1rem',
//         flexWrap: 'wrap'
//       }}>
//         {ROADMAP_DATA.map((phase, index) => (
//           <motion.div
//             key={index}
//             style={{
//               background: phase.gradient,
//               borderRadius: '15px',
//               padding: '1rem',
//               minWidth: '120px',
//               cursor: 'pointer',
//               transition: 'all 0.3s ease'
//             }}
//             initial={{ scale: 0, opacity: 0 }}
//             whileInView={{ scale: 1, opacity: 1 }}
//             transition={{ delay: index * 0.1 }}
//             whileHover={{ scale: 1.05 }}
//             onClick={() => handlePhaseClick && handlePhaseClick(phase)}
//           >
//             <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
//               {phase.price}
//             </div>
//             <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
//               {phase.phase}
//             </div>
//           </motion.div>
//         ))}
//       </div>
//     </motion.div>
//   );
// };

// // Background Animation Component
// const BackgroundElement = ({ element }) => {
//   const elementIcons = {
//     cloud: '☁️',
//     star: '⭐'
//   };

//   return (
//     <motion.div
//       className={styles.backgroundElement}
//       style={{
//         left: `${element.position.x}%`,
//         top: `${element.position.y}%`,
//       }}
//       animate={{
//         x: [0, 50, 0],
//         opacity: [0.3, 0.6, 0.3]
//       }}
//       transition={{
//         duration: 20 / element.speed,
//         repeat: Infinity,
//         ease: "easeInOut"
//       }}
//     >
//       {elementIcons[element.type]}
//     </motion.div>
//   );
// };

// // Background elements
// const BACKGROUND_ELEMENTS = [
//   { id: 'clouds-1', type: 'cloud', position: { x: 20, y: 10 }, speed: 0.5 },
//   { id: 'clouds-2', type: 'cloud', position: { x: 60, y: 20 }, speed: 0.3 },
//   { id: 'clouds-3', type: 'cloud', position: { x: 80, y: 15 }, speed: 0.4 },
//   { id: 'stars-1', type: 'star', position: { x: 10, y: 5 }, speed: 0.2 },
//   { id: 'stars-2', type: 'star', position: { x: 90, y: 10 }, speed: 0.1 },
// ];

// // Main Component
// const CrazyRoadmapMap = () => {
//   const [selectedPhase, setSelectedPhase] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [viewMode, setViewMode] = useState('map');

//   const handlePhaseClick = (phase) => {
//     setSelectedPhase(phase);
//     setIsModalOpen(true);
//     toast.success(`🗺️ Досліджуємо ${phase.phase}!`, {
//       position: "top-center",
//       theme: "dark"
//     });
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setTimeout(() => setSelectedPhase(null), 300);
//   };

//   const toggleViewMode = () => {
//     const newMode = viewMode === 'map' ? 'satellite' : 'map';
//     setViewMode(newMode);
//     toast.info(`Перемикаємо на ${newMode === 'satellite' ? 'супутниковий' : 'карта'} режим! 🛰️`);
//   };

//   // Calculate overall progress
//   const completedPhases = ROADMAP_DATA.filter(phase => phase.status === 'completed').length;
//   const inProgressPhases = ROADMAP_DATA.filter(phase => phase.status === 'in-progress').length;
//   const overallProgress = ((completedPhases + inProgressPhases * 0.5) / ROADMAP_DATA.length) * 100;

//   return (
//     <div className={`${styles.roadmapContainer} ${styles[viewMode]}`}>
//       {/* Header */}
//       <motion.div 
//         className={styles.mapHeader}
//         initial={{ opacity: 0, y: -50 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8 }}
//       >
//         <div className={styles.headerContent}>
//           <h1 className={styles.mapTitle}>
//             🗺️ CrazyFox Journey Map
//             <motion.span 
//               className={styles.compass}
//               animate={{ rotate: 360 }}
//               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
//             >
//               🧭
//             </motion.span>
//           </h1>
//           <p className={styles.mapSubtitle}>
//             Інтерактивна карта нашої подорожі до Місяця! 🚀
//           </p>
          
//           <div className={styles.mapControls}>
//             <motion.button 
//               className={styles.viewToggle}
//               onClick={toggleViewMode}
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               style={{
//                 background: viewMode === 'satellite' ? 'linear-gradient(45deg, #4ECDC4, #45B7D1)' : 'linear-gradient(45deg, #FF6B35, #F7931E)',
//                 border: 'none',
//                 color: 'white',
//                 padding: '0.8rem 1.5rem',
//                 borderRadius: '25px',
//                 fontSize: '1rem',
//                 fontWeight: 'bold',
//                 cursor: 'pointer',
//                 transition: 'all 0.3s ease',
//                 boxShadow: viewMode === 'satellite' ? '0 8px 25px rgba(78, 205, 196, 0.3)' : '0 8px 25px rgba(255, 107, 53, 0.3)'
//               }}
//             >
//               {viewMode === 'map' ? '🛰️ Супутник' : '🗺️ Карта'}
//             </motion.button>
            
//             <div className={styles.mapLegend}>
//               <div className={styles.legendItem}>
//                 <div className={styles.legendColor} style={{ background: '#2ECC71', width: '12px', height: '12px', borderRadius: '50%', marginRight: '8px' }}></div>
//                 <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>Завершено</span>
//               </div>
//               <div className={styles.legendItem}>
//                 <div className={styles.legendColor} style={{ background: '#F39C12', width: '12px', height: '12px', borderRadius: '50%', marginRight: '8px' }}></div>
//                 <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>В процесі</span>
//               </div>
//               <div className={styles.legendItem}>
//                 <div className={styles.legendColor} style={{ background: '#95A5A6', width: '12px', height: '12px', borderRadius: '50%', marginRight: '8px' }}></div>
//                 <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>Заплановано</span>
//               </div>
//             </div>
//           </div>

//           {/* Overall Progress */}
//           <div className={styles.overallProgress}>
//             <div className={styles.progressInfo}>
//               <span>🦊 Загальний прогрес подорожі</span>
//               <span className={styles.progressPercentage}>{overallProgress.toFixed(1)}%</span>
//             </div>
//             <div className={styles.progressBar}>
//               <motion.div 
//                 className={styles.progressFill}
//                 initial={{ width: "0%" }}
//                 animate={{ width: `${overallProgress}%` }}
//                 transition={{ duration: 2, ease: "easeOut", delay: 1 }}
//               />
//             </div>
//           </div>
//         </div>
//       </motion.div>

//       {/* Distribution Overview */}
//       <div className={styles.distributionOverview}>
//         <h3>💰 Розподіл токенів по етапах</h3>
//         <div className={styles.distributionGrid}>
//           {ROADMAP_DATA.map((phase, index) => (
//             <motion.div
//               key={phase.id}
//               className={styles.distributionCard}
//               initial={{ opacity: 0, y: 50 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//               whileHover={{ scale: 1.05 }}
//               onClick={() => handlePhaseClick(phase)}
//               style={{ cursor: 'pointer' }}
//             >
//               <div className={styles.distributionIcon}>{phase.icon}</div>
//               <div className={styles.distributionValue}>{phase.percentage}%</div>
//               <div className={styles.distributionLabel}>{phase.phase}</div>
//               <div className={styles.distributionAmount}>{phase.tokensAvailable} токенів</div>
//             </motion.div>
//           ))}
//         </div>
//       </div>

//       {/* Price Evolution */}
//       <div className={styles.priceEvolution}>
//         <h3>📈 Еволюція ціни токена</h3>
//         <div className={styles.priceChart}>
//           {ROADMAP_DATA.map((phase, index) => (
//             <motion.div
//               key={phase.id}
//               className={styles.priceStep}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.2, duration: 0.8 }}
//             >
//               <motion.div
//                 className={styles.priceBar}
//                 style={{ 
//                   background: phase.gradient,
//                   height: `${30 + (index * 25)}px`, // Простая прогрессивная высота
//                   width: '40px',
//                   borderRadius: '20px 20px 0 0',
//                   cursor: 'pointer',
//                   transition: 'all 0.3s ease'
//                 }}
//                 whileHover={{ scale: 1.1 }}
//                 onClick={() => handlePhaseClick(phase)}
//                 initial={{ height: 0 }}
//                 animate={{ height: `${30 + (index * 25)}px` }}
//                 transition={{ delay: index * 0.3, duration: 0.6 }}
//               />
//               <div className={styles.priceLabel}>
//                 <div className={styles.pricePhase}>{phase.phase}</div>
//                 <div className={styles.priceValue}>{phase.price}</div>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       </div>

//       {/* Price Progression - Updated to receive handlePhaseClick */}
//       <PriceProgression handlePhaseClick={handlePhaseClick} />

//       {/* Main Map Container with view mode effects */}
//       <div className={`${styles.mapContainer} ${viewMode === 'satellite' ? styles.satelliteView : ''}`}>
//         {/* Weather Effects */}
//         <WeatherEffects selectedPhase={selectedPhase} />
        
//         {/* Satellite overlay effect */}
//         {viewMode === 'satellite' && (
//           <motion.div 
//             className={styles.satelliteOverlay}
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 0.3 }}
//             transition={{ duration: 1 }}
//           />
//         )}

//         {/* Background elements */}
//         {BACKGROUND_ELEMENTS.map((element, index) => (
//           <BackgroundElement key={element.id} element={element} />
//         ))}

//         {/* Fixed Static Path */}
//         <StaticPath selectedPhase={selectedPhase} />

//         {/* Landmarks */}
//         {LANDMARKS.map((landmark, index) => (
//           <Landmark 
//             key={landmark.id} 
//             landmark={landmark} 
//             index={index}
//             selectedPhase={selectedPhase}
//           />
//         ))}

//         {/* Roadmap Phases */}
//         {ROADMAP_DATA.map((phase, index) => (
//           <RoadmapPhase
//             key={phase.id}
//             phase={phase}
//             index={index}
//             isActive={selectedPhase?.id === phase.id}
//             onClick={handlePhaseClick}
//             selectedPhase={selectedPhase}
//           />
//         ))}

//         {/* Moon Destination */}
//         <motion.div
//           className={styles.moonDestination}
//           style={{ left: '90%', top: '5%' }}
//           initial={{ opacity: 0, scale: 0 }}
//           animate={{ 
//             opacity: 1, 
//             scale: selectedPhase?.id === 6 ? 1.2 : 1,
//             filter: selectedPhase?.id === 6 ? 'drop-shadow(0 0 30px #FFD700)' : 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))'
//           }}
//           transition={{ delay: 2, duration: 0.8 }}
//         >
//           <div className={styles.moonIcon}>🌙</div>
//           <div className={styles.moonText}>ДО МІСЯЦЯ!</div>
//           <div className={styles.moonSubtext}>Наша кінцева ціль</div>
//         </motion.div>

//         {/* Animated rocket */}
//         <motion.div 
//           className={styles.rocket}
//           style={{
//             position: 'absolute',
//             fontSize: '2rem',
//             zIndex: 20,
//             pointerEvents: 'none'
//           }}
//           animate={{
//             offsetDistance: ["0%", "100%"]
//           }}
//           transition={{
//             duration: 8,
//             repeat: Infinity,
//             ease: "linear"
//           }}
//           style={{ offsetPath: `path('${STATIC_PATH}')` }}
//         >
//           🚀
//         </motion.div>
//       </div>

//       {/* Simplified Stats Dashboard */}
//       <motion.div 
//         initial={{ opacity: 0, y: 50 }}
//         whileInView={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8 }}
//         style={{
//           maxWidth: '1000px',
//           margin: '4rem auto',
//           padding: '0 2rem',
//           textAlign: 'center'
//         }}
//       >
//         <div style={{
//           fontSize: '2.5rem',
//           fontWeight: 'bold',
//           marginBottom: '2rem',
//           background: 'linear-gradient(45deg, #E74C3C, #C0392B)',
//           WebkitBackgroundClip: 'text',
//           WebkitTextFillColor: 'transparent',
//           backgroundClip: 'text'
//         }}>
//           📊 Mission Statistics
//         </div>
//         <div style={{
//           display: 'grid',
//           gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//           gap: '1.5rem'
//         }}>
//           {[
//             { icon: '🎯', value: `${completedPhases}/6`, label: 'Етапів завершено' },
//             { icon: '⏰', value: '540', label: 'Днів місії' },
//             { icon: '🪙', value: '1B', label: 'Загальні токени' },
//             { icon: '📈', value: '100x', label: 'Потенціал зростання' }
//           ].map((stat, index) => (
//             <motion.div
//               key={index}
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//               whileHover={{ scale: 1.05 }}
//               style={{
//                 background: 'rgba(255, 255, 255, 0.05)',
//                 backdropFilter: 'blur(20px)',
//                 borderRadius: '20px',
//                 padding: '1.5rem',
//                 border: '1px solid rgba(231, 76, 60, 0.1)',
//                 transition: 'all 0.3s ease',
//                 cursor: 'pointer'
//               }}
//             >
//               <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
//               <div style={{
//                 fontSize: '2rem',
//                 fontWeight: 'bold',
//                 color: '#E74C3C',
//                 marginBottom: '0.5rem'
//               }}>
//                 {stat.value}
//               </div>
//               <div style={{ color: 'white', fontSize: '1rem' }}>{stat.label}</div>
//             </motion.div>
//           ))}
//         </div>
//       </motion.div>

//       {/* Simplified CTA Section */}
//       <motion.div 
//         initial={{ opacity: 0, scale: 0.8 }}
//         whileInView={{ opacity: 1, scale: 1 }}
//         transition={{ duration: 0.8 }}
//         style={{
//           textAlign: 'center',
//           margin: '4rem auto',
//           maxWidth: '600px',
//           padding: '0 2rem'
//         }}
//       >
//         <h3 style={{
//           fontSize: '2.2rem',
//           marginBottom: '1rem',
//           background: 'linear-gradient(45deg, #FF6B35, #4ECDC4)',
//           WebkitBackgroundClip: 'text',
//           WebkitTextFillColor: 'transparent',
//           backgroundClip: 'text'
//         }}>
//           Готовий розпочати пригоду? 🦊
//         </h3>
//         <p style={{
//           fontSize: '1.1rem',
//           color: 'rgba(255, 255, 255, 0.7)',
//           marginBottom: '2rem'
//         }}>
//           Приєднуйся до найепічнішої криптоподорожі!
//         </p>
//         <motion.button 
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           onClick={() => {
//             confetti({
//               particleCount: 300,
//               spread: 100,
//               origin: { y: 0.8 }
//             });
//           }}
//           style={{
//             background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
//             border: 'none',
//             color: 'white',
//             padding: '1.2rem 2.5rem',
//             borderRadius: '50px',
//             fontSize: '1.2rem',
//             fontWeight: 'bold',
//             cursor: 'pointer',
//             transition: 'all 0.3s ease',
//             boxShadow: '0 10px 30px rgba(255, 107, 53, 0.3)'
//           }}
//         >
//           🗺️ Розпочати пригоду!
//         </motion.button>
//       </motion.div>

//       {/* Enhanced Modal */}
//       <EnhancedModal 
//         phase={selectedPhase} 
//         isOpen={isModalOpen} 
//         onClose={handleCloseModal} 
//       />
//     </div>
//   );
// };

// export default CrazyRoadmapMap;