'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { bsc } from 'viem/chains';
import LanguageSwitcher from '@/components/LanguageSwitcher/LanguageSwitcher';
import styles from './Header.module.css';
import { useLanguage } from '@/hooks/useLanguage';

interface HeaderProps {
  activeSection: string;
  scrollToSection: (sectionId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeSection, scrollToSection }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showWhitePaper, setShowWhitePaper] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollPositionRef = useRef<number>(0);
  
  // Wagmi hooks для состояния подключения
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();

  // Language hook
  const { getComponentText, getComponentArray } = useLanguage();

  // Проверка правильной сети
  const isOnBSC = chainId === bsc.id;

  // Проверка мобильного устройства
  useEffect(() => {
    const checkIsMobile = () => {
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isSmallScreen);
    };

    checkIsMobile();
    
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

  // Обработка скролла
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

  // Блокировка скролла при открытом меню
  useEffect(() => {
    if (isMenuOpen) {
      scrollPositionRef.current = window.pageYOffset;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      const scrollY = scrollPositionRef.current;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
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
    { id: 'hero', label: getComponentText('header', 'navigation.home'), icon: '🏠' },
    { id: 'about', label: getComponentText('header', 'navigation.about'), icon: '📋' },
    { id: 'tokenomics', label: getComponentText('header', 'navigation.tokenomics'), icon: '💰' },
    { id: 'roadmap', label: getComponentText('header', 'navigation.roadmap'), icon: '🗺️' },
    { id: 'community', label: getComponentText('header', 'navigation.community'), icon: '👥' }
  ];

  const handleNavClick = useCallback((sectionId: string) => {
    setIsMenuOpen(false);

    setTimeout(() => {
      const element = document.getElementById(sectionId);
      
      if (element) {
        const headerHeight = isMobile ? 75 : 80;
        const elementPosition = element.offsetTop - headerHeight;
        
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        });
      } else {
        scrollToSection(sectionId);
      }
    }, isMenuOpen ? 150 : 0);
  }, [isMobile, isMenuOpen, scrollToSection]);

  const toggleMobileMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  // Анимации для мобильного меню
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
            <img src="/fox.png" alt={getComponentText('header', 'logo.alt')} />
            <span className={styles.logoText}>{getComponentText('header', 'logo.text')}</span>
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
            {/* Language Switcher */}
            <LanguageSwitcher className={styles.languageSwitcher} />

            {/* White Paper Button - только на десктопе */}
            {!isMobile && (
              <motion.button
                className={styles.whitePaperButton}
                onClick={() => setShowWhitePaper(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className={styles.buttonIcon}>📄</span>
                <span className={styles.buttonText}>{getComponentText('header', 'buttons.whitePaper')}</span>
              </motion.button>
            )}

            {/* RainbowKit Connect Button */}
            <div className={styles.connectWallet}>
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  authenticationStatus,
                  mounted,
                }) => {
                  const ready = mounted && authenticationStatus !== 'loading';
                  const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <motion.button
                              onClick={openConnectModal}
                              type="button"
                              className={styles.connectButton}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              🌈 {getComponentText('header', 'buttons.connectWallet')}
                            </motion.button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <motion.button
                              onClick={openChainModal}
                              type="button"
                              className={styles.wrongNetworkButton}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              ⚠️ {getComponentText('header', 'buttons.wrongNetwork')}
                            </motion.button>
                          );
                        }

                        return (
                          <div className={styles.connectedWallet}>
                            {/* Chain Button */}
                            <motion.button
                              onClick={openChainModal}
                              style={{ display: 'flex', alignItems: 'center' }}
                              type="button"
                              className={styles.chainButton}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {chain.hasIcon && (
                                <div
                                  style={{
                                    background: chain.iconBackground,
                                    width: isMobile ? 16 : 20,
                                    height: isMobile ? 16 : 20,
                                    borderRadius: 999,
                                    overflow: 'hidden',
                                    marginRight: 4,
                                  }}
                                >
                                  {chain.iconUrl && (
                                    <img
                                      alt={chain.name ?? 'Chain icon'}
                                      src={chain.iconUrl}
                                      style={{ width: isMobile ? 16 : 20, height: isMobile ? 16 : 20 }}
                                    />
                                  )}
                                </div>
                              )}
                              {isMobile ? chain.name?.slice(0, 3) : chain.name}
                            </motion.button>

                            {/* Account Button */}
                            <motion.button
                              onClick={openAccountModal}
                              type="button"
                              className={styles.accountButton}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {isMobile 
                                ? `${account.displayName?.slice(0, 6)}...${account.displayName?.slice(-4)}`
                                : account.displayName
                              }
                              {!isMobile && account.displayBalance
                                ? ` (${account.displayBalance})`
                                : ''}
                            </motion.button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className={styles.mobileMenuButton}
              onClick={toggleMobileMenu}
              whileTap={{ scale: 0.95 }}
              aria-label={getComponentText('header', 'aria.toggleMenu')}
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

        {/* Мобильное меню */}
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
                {/* Language Switcher в мобильном меню */}
                <motion.div
                  className={styles.mobileLanguageSwitcher}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <LanguageSwitcher variant="compact" />
                </motion.div>

                {/* Статус подключения в мобильном меню */}
                {isConnected && address && (
                  <motion.div
                    className={styles.mobileConnectionStatus}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <div className={styles.connectionInfo}>
                      <span className={styles.connectionIcon}>
                        {isOnBSC ? '🌈' : '⚠️'}
                      </span>
                      <div className={styles.connectionDetails}>
                        <div className={styles.walletName}>
                          {connector?.name} {getComponentText('header', 'wallet.connected')}
                        </div>
                        <div className={styles.walletAddress}>
                          {address.slice(0, 6)}...{address.slice(-4)}
                        </div>
                        {!isOnBSC && (
                          <div className={styles.networkWarning}>
                            {getComponentText('header', 'wallet.switchToBSC')}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Навигация */}
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
                
                {/* White Paper в мобильном меню */}
                <motion.div 
                  className={styles.mobileActions}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    transition: {
                      delay: 0.25,
                      duration: 0.2,
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
                    📄 {getComponentText('header', 'buttons.whitePaper')}
                  </button>
                </motion.div>

                {/* Wallet Info для неподключенных пользователей */}
                {!isConnected && (
                  <motion.div
                    className={styles.mobileWalletPrompt}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className={styles.promptText}>
                      🌈 {getComponentText('header', 'wallet.connectPrompt')}
                    </p>
                    <div className={styles.supportedWallets}>
                      <span>{getComponentText('header', 'wallet.supportedWallets')}</span>
                    </div>
                  </motion.div>
                )}
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
                  <h3>{getComponentText('header', 'whitePaper.title')}</h3>
                </div>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowWhitePaper(false)}
                  aria-label={getComponentText('header', 'aria.closeModal')}
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
                    <h4>{getComponentText('header', 'whitePaper.subtitle')}</h4>
                    <p>
                      {getComponentText('header', 'whitePaper.description')}
                    </p>
                    <ul>
                    {getComponentArray('header', 'whitePaper', 5).map((feature: string, index: number) => (
                        <li key={index}>{feature}</li>
                      ))}
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
                    {getComponentText('header', 'whitePaper.actions.download')}
                  </motion.a>
                  
                  <motion.button
                    className={styles.viewOnlineButton}
                    onClick={() => window.open('/whitepaper.pdf', '_blank')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={styles.viewIcon}>👁️</span>
                    {getComponentText('header', 'whitePaper.actions.viewOnline')}
                  </motion.button>
                </div>

                <div className={styles.socialShare}>
                  <p>{getComponentText('header', 'whitePaper.actions.share')}</p>
                  <div className={styles.shareButtons}>
                    <motion.button
                      className={styles.shareButton}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const url = `https://twitter.com/intent/tweet?text=Check out the CrazyFox White Paper! 🦊🚀&url=${window.location.origin}/whitepaper`;
                        window.open(url, '_blank');
                      }}
                      aria-label={getComponentText('header', 'whitePaper.shareLabels.twitter')}
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
                      aria-label={getComponentText('header', 'whitePaper.shareLabels.telegram')}
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
                      aria-label={getComponentText('header', 'whitePaper.shareLabels.copy')}
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