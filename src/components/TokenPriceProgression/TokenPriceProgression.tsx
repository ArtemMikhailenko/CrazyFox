'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './TokenPriceProgression.module.css';

interface PriceStage {
  price: string;
  stage: string;
  isActive?: boolean;
  isPast?: boolean;
}

interface TokenPriceProgressionProps {
  currentStage?: number;
  className?: string;
}

const TokenPriceProgression: React.FC<TokenPriceProgressionProps> = ({ 
  currentStage = 2, 
  className = '' 
}) => {
  // Language hook
  const { getComponentText } = useLanguage();

  const priceStages: PriceStage[] = [
    { 
      price: getComponentText('tokenPriceProgression', 'stages.stage1.price'), 
      stage: getComponentText('tokenPriceProgression', 'stages.stage1.stage'), 
      isPast: currentStage > 1 
    },
    { 
      price: getComponentText('tokenPriceProgression', 'stages.stage2.price'), 
      stage: getComponentText('tokenPriceProgression', 'stages.stage2.stage'), 
      isActive: currentStage === 2, 
      isPast: currentStage > 2 
    },
    { 
      price: getComponentText('tokenPriceProgression', 'stages.stage3.price'), 
      stage: getComponentText('tokenPriceProgression', 'stages.stage3.stage'), 
      isActive: currentStage === 3, 
      isPast: currentStage > 3 
    },
    { 
      price: getComponentText('tokenPriceProgression', 'stages.stage4.price'), 
      stage: getComponentText('tokenPriceProgression', 'stages.stage4.stage'), 
      isActive: currentStage === 4, 
      isPast: currentStage > 4 
    },
    { 
      price: getComponentText('tokenPriceProgression', 'stages.stage5.price'), 
      stage: getComponentText('tokenPriceProgression', 'stages.stage5.stage'), 
      isActive: currentStage === 5, 
      isPast: currentStage > 5 
    },
    { 
      price: getComponentText('tokenPriceProgression', 'stages.stage6.price'), 
      stage: getComponentText('tokenPriceProgression', 'stages.stage6.stage'), 
      isActive: currentStage === 6 
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className={`${styles.container} ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className={styles.titleSection}>
        <motion.h2 className={styles.title}>
          <span className={styles.icon}>
            {getComponentText('tokenPriceProgression', 'icon')}
          </span>
          {getComponentText('tokenPriceProgression', 'title')}
        </motion.h2>
      </motion.div>

      <motion.div className={styles.progressionGrid}>
        {priceStages.map((stage, index) => {
          const stageClass = stage.isPast 
            ? styles.stagePast 
            : stage.isActive 
              ? styles.stageActive 
              : styles.stageFuture;

          return (
            <motion.div
              key={index}
              className={`${styles.stageCard} ${stageClass}`}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05, 
                transition: { duration: 0.2 } 
              }}
            >
              <motion.div 
                className={styles.priceSection}
                animate={stage.isActive ? {
                  textShadow: [
                    "0 0 5px rgba(78, 205, 196, 0.5)",
                    "0 0 20px rgba(78, 205, 196, 0.8)",
                    "0 0 5px rgba(78, 205, 196, 0.5)"
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {stage.price}
              </motion.div>
              
              <div className={styles.stageLabel}>
                {stage.stage}
              </div>

              {stage.isActive && (
                <motion.div 
                  className={styles.activeIndicator}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div 
                    className={styles.pulse}
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.7, 0.3, 0.7]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity 
                    }}
                  />
                  <span>{getComponentText('tokenPriceProgression', 'status.current')}</span>
                </motion.div>
              )}

              {stage.isPast && (
                <motion.div 
                  className={styles.completedIndicator}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {getComponentText('tokenPriceProgression', 'status.completed')}
                </motion.div>
              )}

              {/* Connecting line */}
              {index < priceStages.length - 1 && (
                <motion.div 
                  className={styles.connectionLine}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.2 * index, duration: 0.5 }}
                />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div 
        className={styles.progressInfo}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className={styles.currentStageInfo}>
          <span className={styles.infoLabel}>
            {getComponentText('tokenPriceProgression', 'info.currentStage')}
          </span>
          <span className={styles.infoValue}>
            {priceStages[currentStage - 1]?.stage} - {priceStages[currentStage - 1]?.price}
          </span>
        </div>
        <div className={styles.nextStageInfo}>
          <span className={styles.infoLabel}>
            {getComponentText('tokenPriceProgression', 'info.nextStage')}
          </span>
          <span className={styles.infoValue}>
            {priceStages[currentStage] ? 
              `${priceStages[currentStage].stage} - ${priceStages[currentStage].price}` : 
              getComponentText('tokenPriceProgression', 'info.completed')
            }
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TokenPriceProgression;