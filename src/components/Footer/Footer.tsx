// components/Footer/Footer.tsx
'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './Footer.module.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Language hook
  const { getComponentText } = useLanguage();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error(getComponentText('footer', 'messages.emailRequired'));
      return;
    }

    setIsSubscribing(true);
    
    try {
      // Simulate newsletter subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(getComponentText('footer', 'messages.subscriptionSuccess'));
      setEmail('');
    } catch (error) {
      toast.error(getComponentText('footer', 'messages.subscriptionError'));
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSocialClick = (platform: string, url: string) => {
    window.open(url, '_blank');
    toast.info(getComponentText('footer', 'messages.socialOpening').replace('{platform}', platform));
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
    toast.success(getComponentText('footer', 'messages.contractCopied').replace('{label}', label));
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
              <h3 className={styles.brandName}>
                {getComponentText('footer', 'brand.name')}
              </h3>
            </div>
            <p className={styles.brandDescription}>
              {getComponentText('footer', 'brand.description')}
            </p>
            
            {/* Social Links */}
            <div className={styles.socialLinks}>
              <motion.button
                className={styles.socialLink}
                onClick={() => handleSocialClick(
                  getComponentText('footer', 'socialLinks.telegram'), 
                  'https://t.me/MemeCrazyFox'
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className={styles.socialIcon}>📱</span>
                <span>{getComponentText('footer', 'socialLinks.telegram')}</span>
              </motion.button>
              
              <motion.button
                className={styles.socialLink}
                onClick={() => handleSocialClick(
                  getComponentText('footer', 'socialLinks.twitter'), 
                  'https://x.com/crazyfoxmeme?s=21'
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className={styles.socialIcon}>🐦</span>
                <span>{getComponentText('footer', 'socialLinks.twitter')}</span>
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
            <h4 className={styles.sectionTitle}>
              {getComponentText('footer', 'navigation.title')}
            </h4>
            <ul className={styles.linksList}>
              <li>
                <a href="#about" className={styles.footerLink}>
                  {getComponentText('footer', 'navigation.about')}
                </a>
              </li>
              <li>
                <a href="#tokenomics" className={styles.footerLink}>
                  {getComponentText('footer', 'navigation.tokenomics')}
                </a>
              </li>
              <li>
                <a href="#roadmap" className={styles.footerLink}>
                  {getComponentText('footer', 'navigation.roadmap')}
                </a>
              </li>
              <li>
                <a href="#community" className={styles.footerLink}>
                  {getComponentText('footer', 'navigation.community')}
                </a>
              </li>
              <li>
                <a href="/whitepaper" className={styles.footerLink}>
                  {getComponentText('footer', 'navigation.whitepaper')}
                </a>
              </li>
              <li>
                <a href="/audit" className={styles.footerLink}>
                  {getComponentText('footer', 'navigation.auditReport')}
                </a>
              </li>
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
            <h4 className={styles.sectionTitle}>
              {getComponentText('footer', 'contract.title')}
            </h4>
            <div className={styles.contractInfo}>
              <div className={styles.contractItem}>
                <span className={styles.contractLabel}>
                  {getComponentText('footer', 'contract.network')}
                </span>
                <span className={styles.contractValue}>{contractData.network}</span>
              </div>
              <div className={styles.contractItem}>
                <span className={styles.contractLabel}>
                  {getComponentText('footer', 'contract.symbol')}
                </span>
                <span className={styles.contractValue}>{contractData.symbol}</span>
              </div>
              <div className={styles.contractItem}>
                <span className={styles.contractLabel}>
                  {getComponentText('footer', 'contract.decimals')}
                </span>
                <span className={styles.contractValue}>{contractData.decimals}</span>
              </div>
              <div className={styles.contractItem}>
                <span className={styles.contractLabel}>
                  {getComponentText('footer', 'contract.contractAddress')}
                </span>
                <button 
                  className={styles.contractAddress}
                  onClick={() => copyToClipboard(
                    contractData.address, 
                    getComponentText('footer', 'contract.contractAddress')
                  )}
                  title={getComponentText('footer', 'contract.copyTooltip')}
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
                <span>{getComponentText('footer', 'securityBadges.liquidityLocked')}</span>
              </div>
              <div className={styles.badge}>
                <span className={styles.badgeIcon}>✅</span>
                <span>{getComponentText('footer', 'securityBadges.contractVerified')}</span>
              </div>
              <div className={styles.badge}>
                <span className={styles.badgeIcon}>🛡️</span>
                <span>{getComponentText('footer', 'securityBadges.auditPassed')}</span>
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
            <h4 className={styles.sectionTitle}>
              {getComponentText('footer', 'newsletter.title')}
            </h4>
            <p className={styles.newsletterDescription}>
              {getComponentText('footer', 'newsletter.description')}
            </p>

            {/* Quick Stats */}
            <div className={styles.quickStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {getComponentText('footer', 'quickStats.currentPrice.value')}
                </span>
                <span className={styles.statLabel}>
                  {getComponentText('footer', 'quickStats.currentPrice.label')}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {getComponentText('footer', 'quickStats.holders.value')}
                </span>
                <span className={styles.statLabel}>
                  {getComponentText('footer', 'quickStats.holders.label')}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {getComponentText('footer', 'quickStats.marketCap.value')}
                </span>
                <span className={styles.statLabel}>
                  {getComponentText('footer', 'quickStats.marketCap.label')}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomContent}>
            <div className={styles.copyright}>
              <p>{getComponentText('footer', 'bottomBar.copyright')}</p>
              <p className={styles.disclaimer}>
                {getComponentText('footer', 'bottomBar.disclaimer')}
              </p>
            </div>
            
            <div className={styles.footerActions}>
              <button 
                onClick={handleScrollToTop}
                className={styles.scrollTopButton}
                aria-label="Scroll to top"
              >
                <span className={styles.scrollIcon}>⬆️</span>
                <span>{getComponentText('footer', 'bottomBar.backToTop')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;