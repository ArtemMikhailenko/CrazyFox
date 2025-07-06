import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './CrazyPartners.module.css';

const CrazyPartners = () => {
  const { getComponentText } = useLanguage();

  // Массив партнеров с локализованными описаниями
  const partners = [
    {
      name: "AZbit",
      logo: "/partners/azbit.jpg",
      category: "Exchange",
      descriptionKey: "partners.azbit"
    },
    {
      name: "Binance",
      logo: "/partners/binance.jpg", 
      category: "Exchange",
      descriptionKey: "partners.binance"
    },
    {
      name: "CoinGecko",
      logo: "/partners/coingeko.jpg",
      category: "Analytics",
      descriptionKey: "partners.coingecko"
    },
    {
      name: "DEX",
      logo: "/partners/dex.jpg",
      category: "Trading",
      descriptionKey: "partners.dex"
    },
    {
      name: "Honeypot",
      logo: "/partners/honeypot.jpg",
      category: "Security",
      descriptionKey: "partners.honeypot"
    },
    {
      name: "Medium",
      logo: "/partners/medium.jpg",
      category: "Media",
      descriptionKey: "partners.medium"
    },
    {
      name: "Totem",
      logo: "/partners/totem.jpg",
      category: "DeFi",
      descriptionKey: "partners.totem"
    }
  ];

  // Дублируем партнеров для бесконечной прокрутки
  const duplicatedPartners = [...partners, ...partners];

  return (
    <section className={styles.partnersSection}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className={styles.partnersHeader}
        >
          <h2 className={styles.sectionTitle}>
            {getComponentText('crazyPartners', 'title')}
          </h2>
          <p className={styles.sectionDescription}>
            {getComponentText('crazyPartners', 'description')}
          </p>
        </motion.div>

        <div className={styles.carouselContainer}>
          <div className={styles.carouselTrack}>
            {duplicatedPartners.map((partner, index) => (
              <motion.div
                key={`${partner.name}-${index}`}
                className={styles.partnerCard}
                whileHover={{ 
                
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.95 }}
                title={getComponentText('crazyPartners', partner.descriptionKey)}
              >
                <div className={styles.cardBorder}></div>
                <div className={styles.cardShine}></div>
                
                <div className={styles.partnerLogo}>
                  <div className={styles.logoGlow}></div>
                  <img 
                    src={partner.logo} 
                    alt={`${partner.name} logo`}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      //@ts-ignore
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className={styles.fallbackLogo} style={{display: 'none'}}>
                    {partner.name.charAt(0)}
                  </div>
                </div>
                
                <div className={styles.cardGradient}></div>
                <div className={`${styles.cornerAccent} ${styles.topLeft}`}></div>
                <div className={`${styles.cornerAccent} ${styles.bottomRight}`}></div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Статистика партнеров */}
        <motion.div
          className={styles.statsRow}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className={styles.statItem}>
            <div className={styles.statNumber}>15+</div>
            <div className={styles.statLabel}>
              {getComponentText('crazyPartners', 'stats.partners')}
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>7</div>
            <div className={styles.statLabel}>
              {getComponentText('crazyPartners', 'stats.categories')}
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>50M+</div>
            <div className={styles.statLabel}>
              {getComponentText('crazyPartners', 'stats.transactions')}
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>99.9%</div>
            <div className={styles.statLabel}>
              {getComponentText('crazyPartners', 'stats.uptime')}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CrazyPartners;