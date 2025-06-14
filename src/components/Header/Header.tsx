'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import styles from './Header.module.css';

// ThirdWeb client configuration
const client = createThirdwebClient({
  clientId: "d28d89a66e8eb5e73d6a9c8eeaa0645a" // Замените на ваш Client ID
});

interface HeaderProps {
  activeSection: string;
  scrollToSection: (sectionId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeSection, scrollToSection }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showWhitePaper, setShowWhitePaper] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollPositionRef = useRef<number>(0);

  // Оптимизированная проверка мобильного устройства
  useEffect(() => {
    const checkIsMobile = () => {
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isSmallScreen);
    };

    checkIsMobile();
    
    // Добавляем debounce для resize
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkIsMobile, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Оптимизированная обработка скролла
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          setIsScrolled(scrollPosition > 50);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ИСПРАВЛЕНО: Предотвращение скролла при открытии меню
  useEffect(() => {
    if (isMenuOpen) {
      // Сохраняем текущую позицию скролла
      scrollPositionRef.current = window.pageYOffset;
      
      // Блокируем скролл
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      // Восстанавливаем скролл без изменения позиции
      const scrollY = scrollPositionRef.current;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      
      // Восстанавливаем позицию без анимации
      window.scrollTo(0, scrollY);
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
    };
  }, [isMenuOpen]);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest(`.${styles.mobileMenu}`) && !target.closest(`.${styles.mobileMenuButton}`)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Закрытие меню на escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setShowWhitePaper(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const navigationItems = [
    { id: 'hero', label: 'Home', icon: '🏠' },
    { id: 'about', label: 'About', icon: '📋' },
    { id: 'tokenomics', label: 'Tokenomics', icon: '💰' },
    { id: 'roadmap', label: 'Roadmap', icon: '🗺️' },
    { id: 'community', label: 'Community', icon: '👥' }
  ];

  // ИСПРАВЛЕНО: Навигация без автоматического скролла
  const handleNavClick = useCallback((sectionId: string) => {
    console.log('Navigation clicked:', sectionId);
    
    // Закрываем меню
    setIsMenuOpen(false);

    // Небольшая задержка для завершения анимации закрытия меню
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      
      if (element) {
        const headerHeight = isMobile ? 75 : 80;
        const elementPosition = element.offsetTop - headerHeight;
        
        // Плавный скролл к секции
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        });
      } else {
        // Fallback к оригинальной функции
        scrollToSection(sectionId);
      }
    }, isMenuOpen ? 150 : 0); // Уменьшенная задержка
  }, [isMobile, isMenuOpen, scrollToSection]);

  const toggleMobileMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  // Упрощенные анимации для мобильных устройств
  const mobileMenuVariants = {
    hidden: { 
      height: 0, 
      opacity: 0,
      transition: {
        duration: isMobile ? 0.2 : 0.3,
        ease: "easeInOut"
      }
    },
    visible: { 
      height: 'auto', 
      opacity: 1,
      transition: {
        duration: isMobile ? 0.2 : 0.3,
        ease: "easeInOut"
      }
    }
  };

  const mobileNavItemVariants = {
    hidden: { 
      x: -20, 
      opacity: 0 
    },
    visible: (index: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: isMobile ? index * 0.05 : index * 0.08,
        duration: isMobile ? 0.2 : 0.4,
        ease: "easeOut"
      }
    })
  };

  return (
    <>
      <motion.header 
        className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className={styles.container}>
          {/* Logo */}
          <motion.div 
            className={styles.logo}
            whileHover={!isMobile ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavClick('hero')}
          >
            <img src="/fox.png" alt="CrazyFox Logo" />
            <span className={styles.logoText}>CrazyFox</span>
          </motion.div>
          
          {/* Desktop Navigation */}
          <nav className={styles.desktopNav}>
            {navigationItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`${styles.navLink} ${activeSection === item.id ? styles.active : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </motion.button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className={styles.actions}>
            {/* White Paper Button */}
            <motion.button
              className={styles.whitePaperButton}
              onClick={() => setShowWhitePaper(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className={styles.buttonIcon}>📄</span>
              <span className={styles.buttonText}>White Paper</span>
            </motion.button>

            {/* Connect Wallet */}
            <div className={styles.connectWallet}>
              <ConnectButton 
                client={client}
                theme="dark"
                connectModal={{
                  size: "wide",
                  title: "Connect to CrazyFox",
                  welcomeScreen: {
                    title: "Welcome to CrazyFox",
                    subtitle: "Connect your wallet to start buying CRFX tokens",
                  },
                }}
              />
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className={styles.mobileMenuButton}
              onClick={toggleMobileMenu}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle mobile menu"
              aria-expanded={isMenuOpen}
            >
              <div className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </motion.button>
          </div>
        </div>

        {/* ОПТИМИЗИРОВАННОЕ Мобильное меню */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className={styles.mobileMenu}
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className={styles.mobileMenuContent}>
                {navigationItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`${styles.mobileNavLink} ${activeSection === item.id ? styles.active : ''}`}
                    custom={index}
                    variants={mobileNavItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </motion.button>
                ))}
                
                <motion.div 
                  className={styles.mobileActions}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    transition: {
                      delay: isMobile ? 0.25 : 0.4,
                      duration: isMobile ? 0.2 : 0.4,
                      ease: "easeOut"
                    }
                  }}
                  exit={{
                    y: 10,
                    opacity: 0,
                    transition: {
                      duration: 0.2
                    }
                  }}
                >
                  <button
                    className={styles.mobileWhitePaperButton}
                    onClick={() => {
                      setShowWhitePaper(true);
                      setIsMenuOpen(false);
                    }}
                  >
                    📄 White Paper
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* White Paper Modal */}
      <AnimatePresence>
        {showWhitePaper && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWhitePaper(false)}
          >
            <motion.div 
              className={styles.whitePaperModal}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>
                  <span className={styles.titleIcon}>📄</span>
                  <h3>CrazyFox White Paper</h3>
                </div>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowWhitePaper(false)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              
              <div className={styles.modalContent}>
                <div className={styles.whitePaperPreview}>
                  <div className={styles.previewImage}>
                    <div style={{ 
                      width: '100%', 
                      height: '200px', 
                      background: 'linear-gradient(135deg, #FF6B35, #4ECDC4)', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px'
                    }}>
                      📄
                    </div>
                  </div>
                  
                  <div className={styles.previewContent}>
                    <h4>Comprehensive Project Overview</h4>
                    <p>
                      Discover the future of meme coins with CrazyFox. Our white paper covers:
                    </p>
                    <ul>
                      <li>🚀 Revolutionary tokenomics with 65% liquidity lock</li>
                      <li>💰 Aggressive marketing strategy (150M tokens)</li>
                      <li>🛡️ Maximum security features</li>
                      <li>🎮 Complete ecosystem roadmap</li>
                      <li>📊 Technical analysis and comparisons</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.downloadActions}>
                  <motion.a
                    href="/whitepaper.pdf"
                    download="whitepaper.pdf"
                    className={styles.downloadButton}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={styles.downloadIcon}>⬇️</span>
                    Download PDF
                  </motion.a>
                  
                  <motion.button
                    className={styles.viewOnlineButton}
                    onClick={() => window.open('/whitepaper.pdf', '_blank')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={styles.viewIcon}>👁️</span>
                    View Online
                  </motion.button>
                </div>

                <div className={styles.socialShare}>
                  <p>Share with your community:</p>
                  <div className={styles.shareButtons}>
                    <motion.button
                      className={styles.shareButton}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const url = `https://twitter.com/intent/tweet?text=Check out the CrazyFox White Paper! 🦊🚀&url=${window.location.origin}/whitepaper`;
                        window.open(url, '_blank');
                      }}
                      aria-label="Share on Twitter"
                    >
                      🐦
                    </motion.button>
                    <motion.button
                      className={styles.shareButton}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const url = `https://t.me/share/url?url=${window.location.origin}/whitepaper&text=CrazyFox White Paper 🦊`;
                        window.open(url, '_blank');
                      }}
                      aria-label="Share on Telegram"
                    >
                      📱
                    </motion.button>
                    <motion.button
                      className={styles.shareButton}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/whitepaper`);
                      }}
                      aria-label="Copy link"
                    >
                      📋
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;