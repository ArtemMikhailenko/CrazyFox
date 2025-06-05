// components/Header/Header.tsx
'use client';

import { useState, useEffect } from 'react';
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

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.mobileMenu}`) && !target.closest(`.${styles.mobileMenuButton}`)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  const navigationItems = [
    { id: 'hero', label: 'Home', icon: '🏠' },
    { id: 'about', label: 'About', icon: '📋' },
    { id: 'tokenomics', label: 'Tokenomics', icon: '💰' },
    { id: 'roadmap', label: 'Roadmap', icon: '🗺️' },
    { id: 'community', label: 'Community', icon: '👥' }
  ];

  const handleNavClick = (sectionId: string) => {
    scrollToSection(sectionId);
    setIsMenuOpen(false);
  };

  return (
    <>
      <motion.header 
        className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className={styles.container}>
          {/* Logo */}
          <motion.div 
            className={styles.logo}
            whileHover={{ scale: 1.1, rotate: 10 }}
            onClick={() => scrollToSection('hero')}
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
                whileHover={{ scale: 1.1 }}
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className={styles.mobileMenu}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.mobileMenuContent}>
                {navigationItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`${styles.mobileNavLink} ${activeSection === item.id ? styles.active : ''}`}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </motion.button>
                ))}
                
                <motion.div 
                  className={styles.mobileActions}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
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
                >
                  ✕
                </button>
              </div>
              
              <div className={styles.modalContent}>
                <div className={styles.whitePaperPreview}>
                  
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
                      onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out the CrazyFox White Paper! 🦊🚀&url=${window.location.origin}/whitepaper`, '_blank')}
                    >
                      🐦
                    </motion.button>
                    <motion.button
                      className={styles.shareButton}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => window.open(`https://t.me/share/url?url=${window.location.origin}/whitepaper&text=CrazyFox White Paper 🦊`, '_blank')}
                    >
                      📱
                    </motion.button>
                    <motion.button
                      className={styles.shareButton}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/whitepaper`)}
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