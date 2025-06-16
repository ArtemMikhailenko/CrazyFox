// components/Footer/Footer.tsx
'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from './Footer.module.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address!');
      return;
    }

    setIsSubscribing(true);
    
    try {
      // Simulate newsletter subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('🎉 Thanks for subscribing! Welcome to the CrazyFox family!');
      setEmail('');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSocialClick = (platform: string, url: string) => {
    window.open(url, '_blank');
    toast.info(`Opening ${platform}...`);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const contractData = {
    address: "0xa2c959a7Fbf6d96eA4170e724D871E0556cd8556",
    network: "BSC (Binance Smart Chain)",
    decimals: 9,
    symbol: "CRFX"
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <footer className={styles.footer}>
      {/* Background Effects */}
      <div className={styles.footerBackground}>
        <div className={styles.gradientOverlay}></div>
        <div className={styles.particles}></div>
      </div>

      <div className={styles.footerContainer}>
        {/* Main Footer Content */}
        <div className={styles.footerContent}>
          {/* Brand Section */}
          <motion.div 
            className={styles.brandSection}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className={styles.logoContainer}>
              <div className={styles.logoIcon}>🦊</div>
              <h3 className={styles.brandName}>CrazyFox</h3>
            </div>
            <p className={styles.brandDescription}>
              The wildest meme coin on BSC that's taking the crypto world by storm! 
              Join our revolution and ride the fox to the moon! 🚀
            </p>
            
            {/* Social Links */}
            <div className={styles.socialLinks}>
              <motion.button
                className={styles.socialLink}
                onClick={() => handleSocialClick('Telegram', 'https://t.me/MemeCrazyFox')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className={styles.socialIcon}>📱</span>
                <span>Telegram</span>
              </motion.button>
              
              <motion.button
                className={styles.socialLink}
                onClick={() => handleSocialClick('Twitter', 'https://x.com/crazyfoxmeme?s=21')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className={styles.socialIcon}>🐦</span>
                <span>Twitter</span>
              </motion.button>
              
              
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div 
            className={styles.linksSection}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className={styles.sectionTitle}>Quick Links</h4>
            <ul className={styles.linksList}>
              <li><a href="#about" className={styles.footerLink}>About</a></li>
              <li><a href="#tokenomics" className={styles.footerLink}>Tokenomics</a></li>
              <li><a href="#roadmap" className={styles.footerLink}>Roadmap</a></li>
              <li><a href="#community" className={styles.footerLink}>Community</a></li>
              <li><a href="/whitepaper" className={styles.footerLink}>Whitepaper</a></li>
              <li><a href="/audit" className={styles.footerLink}>Audit Report</a></li>
            </ul>
          </motion.div>

          

          {/* Contract Info */}
          <motion.div 
            className={styles.contractSection}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className={styles.sectionTitle}>Contract Info</h4>
            <div className={styles.contractInfo}>
              <div className={styles.contractItem}>
                <span className={styles.contractLabel}>Network:</span>
                <span className={styles.contractValue}>{contractData.network}</span>
              </div>
              <div className={styles.contractItem}>
                <span className={styles.contractLabel}>Symbol:</span>
                <span className={styles.contractValue}>{contractData.symbol}</span>
              </div>
              <div className={styles.contractItem}>
                <span className={styles.contractLabel}>Decimals:</span>
                <span className={styles.contractValue}>{contractData.decimals}</span>
              </div>
              <div className={styles.contractItem}>
                <span className={styles.contractLabel}>Contract:</span>
                <button 
                  className={styles.contractAddress}
                  onClick={() => copyToClipboard(contractData.address, 'Contract address')}
                  title="Click to copy contract address"
                >
                  {contractData.address.slice(0, 8)}...{contractData.address.slice(-6)}
                  <span className={styles.copyIcon}>📋</span>
                </button>
              </div>
            </div>

            {/* Security Badges */}
            <div className={styles.securityBadges}>
              <div className={styles.badge}>
                <span className={styles.badgeIcon}>🔒</span>
                <span>Liquidity Locked</span>
              </div>
              <div className={styles.badge}>
                <span className={styles.badgeIcon}>✅</span>
                <span>Contract Verified</span>
              </div>
              <div className={styles.badge}>
                <span className={styles.badgeIcon}>🛡️</span>
                <span>Audit Passed</span>
              </div>
            </div>
          </motion.div>

          {/* Newsletter */}
          <motion.div 
            className={styles.newsletterSection}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h4 className={styles.sectionTitle}>Stay Updated</h4>
            <p className={styles.newsletterDescription}>
              Get the latest updates, announcements, and exclusive content!
            </p>
            
           

            {/* Quick Stats */}
            <div className={styles.quickStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>$0.005</span>
                <span className={styles.statLabel}>Current Price</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>1000+</span>
                <span className={styles.statLabel}>Holders</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>$300K+</span>
                <span className={styles.statLabel}>Market Cap</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomContent}>
            <div className={styles.copyright}>
              <p>© 2025 CrazyFox. All rights reserved. Built with 🦊 by the CrazyFox team.</p>
              <p className={styles.disclaimer}>
                Disclaimer: Cryptocurrency investments carry risk. Always DYOR (Do Your Own Research).
              </p>
            </div>
            
            <div className={styles.footerActions}>
             
              <button 
                onClick={handleScrollToTop}
                className={styles.scrollTopButton}
                aria-label="Scroll to top"
              >
                <span className={styles.scrollIcon}>⬆️</span>
                <span>Back to Top</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      
    </footer>
  );
};

export default Footer;