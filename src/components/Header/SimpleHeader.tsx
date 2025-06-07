// components/Header/SimpleHeader.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

interface HeaderProps {
  activeSection: string;
  scrollToSection: (sectionId: string) => void;
}

const SimpleHeader: React.FC<HeaderProps> = ({ activeSection, scrollToSection }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showWhitePaper, setShowWhitePaper] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check wallet connection on load
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.log('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setWalletAddress('');
          setIsConnected(false);
        }
      });
    }
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        toast.success('Wallet connected! 🦊');
      }
    } catch (error: any) {
      if (error.code === 4001) {
        toast.warning('Connection cancelled by user');
      } else {
        toast.error('Failed to connect wallet');
      }
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress('');
    setIsConnected(false);
    toast.info('Wallet disconnected');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
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
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: isScrolled ? 
            'rgba(15, 15, 25, 0.98)' : 
            'rgba(20, 20, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: isScrolled ? 
            '1px solid rgba(255, 107, 53, 0.3)' : 
            '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          boxShadow: isScrolled ? 
            '0 4px 20px rgba(0, 0, 0, 0.3)' : 
            '0 2px 20px rgba(0, 0, 0, 0.2)'
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '80px'
        }}>
          {/* Logo */}
          <motion.div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            whileHover={{ scale: 1.05, rotate: 5 }}
            onClick={() => scrollToSection('hero')}
          >
            <img 
              src="/fox.png" 
              alt="CrazyFox Logo" 
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #FF6B35',
                boxShadow: '0 0 20px rgba(255, 107, 53, 0.3)'
              }}
            />
            <span style={{
              fontSize: '24px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #FF6B35, #4ECDC4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              CrazyFox
            </span>
          </motion.div>
          
          {/* Desktop Navigation */}
          <nav style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            {navigationItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: activeSection === item.id ? 
                    'linear-gradient(135deg, #FF6B35, #4ECDC4)' : 
                    'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  borderRadius: '50px',
                  transition: 'all 0.3s ease',
                  fontSize: '14px',
                  fontWeight: '600',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: activeSection === item.id ? 
                    '0 4px 15px rgba(255, 107, 53, 0.3)' : 
                    'none'
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
              </motion.button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* White Paper Button */}
            <motion.button
              onClick={() => setShowWhitePaper(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                fontSize: '14px'
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span style={{ fontSize: '16px' }}>📄</span>
              <span>White Paper</span>
            </motion.button>

            {/* Connect Wallet Button */}
            <motion.button
              onClick={isConnected ? disconnectWallet : connectWallet}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: isConnected ? 
                  'linear-gradient(135deg, #10b981, #059669)' : 
                  'linear-gradient(135deg, #FF6B35, #4ECDC4)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
                fontSize: '14px',
                minWidth: isConnected ? '140px' : '130px',
                justifyContent: 'center'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span style={{ fontSize: '16px' }}>
                {isConnected ? '🔗' : '🦊'}
              </span>
              <span>
                {isConnected ? 
                  `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 
                  'Connect Wallet'
                }
              </span>
            </motion.button>

            {/* Mobile Menu Button */}
            <motion.button
              className="mobile-menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                display: 'none',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '44px',
                height: '44px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                width: '20px',
                height: '20px',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: '20px',
                      height: '2px',
                      background: '#ffffff',
                      transition: 'all 0.3s ease',
                      borderRadius: '2px',
                      display: 'block',
                      transform: isMenuOpen ? 
                        (i === 0 ? 'rotate(45deg) translate(4px, 3px)' :
                         i === 1 ? 'opacity: 0; transform: translateX(20px)' :
                         'rotate(-45deg) translate(7px, -6px)') : 
                        'none',
                      backgroundColor: isMenuOpen ? '#FF6B35' : '#ffffff'
                    }}
                  />
                ))}
              </div>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="mobile-menu"
              style={{
                display: 'none',
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'rgba(15, 15, 25, 0.98)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
              }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{
                padding: '24px 20px',
                margin: '0 auto'
              }}>
                {navigationItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      width: '100%',
                      padding: '20px 24px',
                      background: activeSection === item.id ? 
                        'linear-gradient(135deg, rgba(255, 107, 53, 0.2), rgba(78, 205, 196, 0.2))' :
                        'rgba(255, 255, 255, 0.05)',
                      border: activeSection === item.id ? 
                        '1px solid rgba(255, 107, 53, 0.4)' :
                        '1px solid rgba(255, 255, 255, 0.1)',
                      color: activeSection === item.id ? '#FF6B35' : '#ffffff',
                      cursor: 'pointer',
                      borderRadius: '16px',
                      transition: 'all 0.3s ease',
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      textAlign: 'left',
                      backdropFilter: 'blur(10px)'
                    }}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span style={{
                      fontSize: '20px',
                      minWidth: '24px',
                      textAlign: 'center'
                    }}>
                      {item.icon}
                    </span>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      {item.label}
                    </span>
                  </motion.button>
                ))}
                
                <motion.div 
                  style={{
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={() => {
                      setShowWhitePaper(true);
                      setIsMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '20px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      border: 'none',
                      borderRadius: '16px',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '18px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                      backdropFilter: 'blur(10px)',
                      marginBottom: '16px'
                    }}
                  >
                    📄 White Paper
                  </button>

                  <button
                    onClick={() => {
                      if (isConnected) {
                        disconnectWallet();
                      } else {
                        connectWallet();
                      }
                      setIsMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '20px',
                      background: isConnected ? 
                        'linear-gradient(135deg, #10b981, #059669)' : 
                        'linear-gradient(135deg, #FF6B35, #4ECDC4)',
                      border: 'none',
                      borderRadius: '16px',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '18px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 20px rgba(255, 107, 53, 0.3)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {isConnected ? 
                      `🔗 ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 
                      '🦊 Connect Wallet'
                    }
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
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWhitePaper(false)}
          >
            <motion.div 
              style={{
                background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
                borderRadius: '20px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '30px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(78, 205, 196, 0.1))'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '28px' }}>📄</span>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #FF6B35, #4ECDC4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    margin: 0
                  }}>
                    CrazyFox White Paper
                  </h3>
                </div>
                <button 
                  onClick={() => setShowWhitePaper(false)}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{
                padding: '30px',
                overflowY: 'auto',
                maxHeight: 'calc(90vh - 120px)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr',
                  gap: '30px',
                  marginBottom: '30px'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px'
                  }}>
                    <div style={{
                      fontSize: '64px',
                      opacity: 0.5
                    }}>
                      📄
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{
                      color: '#FF6B35',
                      fontSize: '20px',
                      fontWeight: '700',
                      marginBottom: '15px'
                    }}>
                      Comprehensive Project Overview
                    </h4>
                    <p style={{
                      color: '#b0b0b0',
                      lineHeight: '1.6',
                      marginBottom: '20px'
                    }}>
                      Discover the future of meme coins with CrazyFox. Our white paper covers:
                    </p>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0
                    }}>
                      {[
                        '🚀 Simple and secure presale system',
                        '💰 Direct payment to treasury wallet',
                        '⚡ Instant token delivery to buyers',
                        '🛡️ Maximum security with MetaMask',
                        '📊 Real-time price feeds from Chainlink',
                        '🎮 Complete ecosystem roadmap'
                      ].map((item, index) => (
                        <li key={index} style={{
                          color: '#ffffff',
                          marginBottom: '10px',
                          paddingLeft: '0px'
                        }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '30px'
                }}>
                  <motion.a
                    href="/whitepaper.pdf"
                    download="whitepaper.pdf"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '16px 24px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '600',
                      textDecoration: 'none',
                      fontSize: '16px'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span style={{ fontSize: '18px' }}>⬇️</span>
                    Download PDF
                  </motion.a>
                  
                  <motion.button
                    onClick={() => window.open('/whitepaper.pdf', '_blank')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '16px 24px',
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span style={{ fontSize: '18px' }}>👁️</span>
                    View Online
                  </motion.button>
                </div>

                <div style={{
                  textAlign: 'center',
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <p style={{
                    color: '#b0b0b0',
                    marginBottom: '15px'
                  }}>
                    Share with your community:
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px'
                  }}>
                    {[
                      { icon: '🐦', action: () => window.open(`https://twitter.com/intent/tweet?text=Check out the CrazyFox White Paper! 🦊🚀&url=${window.location.origin}/whitepaper`, '_blank') },
                      { icon: '📱', action: () => window.open(`https://t.me/share/url?url=${window.location.origin}/whitepaper&text=CrazyFox White Paper 🦊`, '_blank') },
                      { icon: '📋', action: () => navigator.clipboard.writeText(`${window.location.origin}/whitepaper`) }
                    ].map((share, index) => (
                      <motion.button
                        key={index}
                        onClick={share.action}
                        style={{
                          width: '50px',
                          height: '50px',
                          border: 'none',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontSize: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {share.icon}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          nav {
            display: none !important;
          }
          
          .mobile-menu-button {
            display: flex !important;
          }
          
          .mobile-menu {
            display: block !important;
          }
        }
        
        @media (max-width: 480px) {
          .heroContent {
            padding: 0 12px !important;
          }
        }
      `}</style>
    </>
  );
};

export default SimpleHeader;