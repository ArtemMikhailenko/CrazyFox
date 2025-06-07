// components/FinalBuyToken.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import { 
  useActiveAccount,
  useReadContract,
  useSendTransaction
} from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { presaleContract } from '../../lib/contracts'; // Импортируем из нашего файла

const FinalBuyToken = () => {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const [buyAmount, setBuyAmount] = useState('0.1');
  const [selectedCurrency, setSelectedCurrency] = useState<'BNB' | 'WETH'>('BNB');
  const [showBuyModal, setShowBuyModal] = useState(false);

  // Fallback цены
  const [fallbackPrices] = useState({
    bnb: 300,
    eth: 2000,
    token: 0.005
  });

  // Read presale info - используем строковый метод
  const { data: presaleInfo, refetch: refetchPresaleInfo } = useReadContract({
    contract: presaleContract,
    //@ts-ignore
    method: "function getPresaleInfo() view returns (uint256, uint256, uint256, address, address, uint256, uint256)",
    params: []
  });

  // Получаем цены
  const getCurrentPrices = () => {
    if (presaleInfo && Array.isArray(presaleInfo) && presaleInfo.length >= 7) {
      try {
        return {
          bnbPrice: Number(presaleInfo[5]) / 10**8 || fallbackPrices.bnb,
          ethPrice: Number(presaleInfo[6]) / 10**8 || fallbackPrices.eth,
          tokenPrice: Number(presaleInfo[2]) / 10**18 || fallbackPrices.token
        };
      } catch (error) {
        console.log('Error parsing prices:', error);
      }
    }
    return {
      bnbPrice: fallbackPrices.bnb,
      ethPrice: fallbackPrices.eth,
      tokenPrice: fallbackPrices.token
    };
  };

  const prices = getCurrentPrices();

  // Calculate USD value
  const calculateUSDValue = (amount: string, currency: 'BNB' | 'WETH') => {
    const amountFloat = parseFloat(amount || '0');
    if (isNaN(amountFloat) || amountFloat <= 0) return 0;
    
    const price = currency === 'BNB' ? prices.bnbPrice : prices.ethPrice;
    return amountFloat * price;
  };

  // Calculate tokens
  const calculateTokenAmount = (amount: string, currency: 'BNB' | 'WETH') => {
    const usdValue = calculateUSDValue(amount, currency);
    if (usdValue <= 0 || prices.tokenPrice <= 0) return 0;
    
    return Math.floor(usdValue / prices.tokenPrice);
  };

  const handleBuyTokens = async () => {
    if (!account) {
      toast.error('Please connect your wallet first! 🦊');
      return;
    }

    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const amountInWei = BigInt(Math.floor(parseFloat(buyAmount) * 10**18));
      
      let transaction;
      
      if (selectedCurrency === 'BNB') {
        // Покупка за BNB - используем строковое определение функции
        transaction = prepareContractCall({
          contract: presaleContract,
          //@ts-ignore
          method: "function buyWithBNB() payable",
          params: [],
          value: amountInWei
        });
      } else {
        // Покупка за WETH
        transaction = prepareContractCall({
          contract: presaleContract,
          //@ts-ignore
          method: "function buyWithWETH(uint256 wethAmount)",
          params: [amountInWei]
        });
      }
//@ts-ignore
      await sendTransaction(transaction);

      // Refresh data
      if (refetchPresaleInfo) {
        setTimeout(() => {
          refetchPresaleInfo();
        }, 2000);
      }

      // Success feedback
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.8 },
        colors: ['#FF6B35', '#4ECDC4', '#45B7D1']
      });
      
      const tokenAmount = calculateTokenAmount(buyAmount, selectedCurrency);
      toast.success(`🎉 Successfully bought ${tokenAmount.toLocaleString()} CRFX tokens!`);
      
      setShowBuyModal(false);
      setBuyAmount('0.1');
    } catch (error: any) {
      console.error('Error buying tokens:', error);
      
      if (error?.message?.includes('user rejected') || error?.message?.includes('User rejected')) {
        toast.warning('Transaction cancelled by user');
      } else if (error?.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction');
      } else if (error?.message?.includes('Token transfer failed')) {
        toast.error('Token transfer failed. Check if token wallet has enough tokens and gave approval to contract.');
      } else if (error?.message?.includes('execution reverted')) {
        toast.error('Transaction failed. Please check your inputs and try again.');
      } else {
        toast.error('Failed to buy tokens. Please try again.');
      }
    }
  };

  const usdValue = calculateUSDValue(buyAmount, selectedCurrency);
  const tokenAmount = calculateTokenAmount(buyAmount, selectedCurrency);

  return (
    <>
      {/* Main Buy Button */}
      <motion.button
        className="buy-button"
        onClick={() => account ? setShowBuyModal(true) : toast.warning('Please connect your wallet first! 🦊')}
        whileHover={account ? { scale: 1.05 } : {}}
        whileTap={account ? { scale: 0.95 } : {}}
        style={{
          padding: '20px 40px',
          background: account ? 
            'linear-gradient(135deg, #FF6B35, #4ECDC4)' : 
            'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '50px',
          color: '#fff',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: account ? 'pointer' : 'not-allowed',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          opacity: !account ? 0.6 : 1,
          transition: 'all 0.3s ease',
          boxShadow: account ? '0 8px 30px rgba(255, 107, 53, 0.4)' : 'none',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Shimmer effect */}
        {account && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            animation: 'shimmer 3s infinite'
          }} />
        )}
        
        <span style={{ fontSize: '20px', position: 'relative', zIndex: 1 }}>🚀</span>
        <span style={{ position: 'relative', zIndex: 1 }}>Buy $CRFX Now</span>
        <span style={{ 
          fontSize: '12px', 
          opacity: 0.9, 
          position: 'relative', 
          zIndex: 1 
        }}>
          ${prices.tokenPrice.toFixed(3)} per token
        </span>
      </motion.button>

      {/* Buy Modal */}
      <AnimatePresence>
        {showBuyModal && (
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
            onClick={() => setShowBuyModal(false)}
          >
            <motion.div 
              style={{
                background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
                borderRadius: '24px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
              }}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px 28px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(78, 205, 196, 0.1))'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>🦊</span>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #FF6B35, #4ECDC4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: 0
                  }}>
                    Buy CRFX Tokens
                  </h3>
                </div>
                <motion.button 
                  onClick={() => setShowBuyModal(false)}
                  whileHover={{ rotate: 90 }}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                >
                  ✕
                </motion.button>
              </div>
              
              <div style={{ padding: '28px', overflowY: 'auto', maxHeight: 'calc(90vh - 100px)' }}>
                {/* Current Price */}
                <motion.div 
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    border: '1px solid rgba(255, 107, 53, 0.3)'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#b0b0b0', fontSize: '14px' }}>
                      Current Token Price:
                    </span>
                    <span style={{
                      color: '#4ECDC4',
                      fontSize: '18px',
                      fontWeight: '700'
                    }}>
                      ${prices.tokenPrice.toFixed(3)}
                    </span>
                  </div>
                </motion.div>

                {/* Currency Selection */}
                <motion.div 
                  style={{ marginBottom: '20px' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div style={{
                    color: '#fff',
                    fontSize: '16px',
                    marginBottom: '12px',
                    fontWeight: '600'
                  }}>
                    Select Currency:
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <motion.button
                      onClick={() => setSelectedCurrency('BNB')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        flex: 1,
                        padding: '16px',
                        background: selectedCurrency === 'BNB' ? 
                          'linear-gradient(135deg, rgba(255, 107, 53, 0.3), rgba(78, 205, 196, 0.3))' : 
                          'rgba(255, 255, 255, 0.05)',
                        border: selectedCurrency === 'BNB' ? 
                          '2px solid #FF6B35' : 
                          '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '16px',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>🔶</span>
                      <span>BNB</span>
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        ${prices.bnbPrice.toFixed(0)}
                      </span>
                    </motion.button>
                    
                    <motion.button
                      onClick={() => setSelectedCurrency('WETH')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        flex: 1,
                        padding: '16px',
                        background: selectedCurrency === 'WETH' ? 
                          'linear-gradient(135deg, rgba(255, 107, 53, 0.3), rgba(78, 205, 196, 0.3))' : 
                          'rgba(255, 255, 255, 0.05)',
                        border: selectedCurrency === 'WETH' ? 
                          '2px solid #FF6B35' : 
                          '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '16px',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>💎</span>
                      <span>WETH</span>
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        ${prices.ethPrice.toFixed(0)}
                      </span>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Amount Input */}
                <motion.div 
                  style={{ marginBottom: '20px' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label style={{
                    color: '#fff',
                    fontSize: '14px',
                    marginBottom: '8px',
                    display: 'block',
                    fontWeight: '600'
                  }}>
                    Amount ({selectedCurrency}):
                  </label>
                  <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    min="0.001"
                    step="0.001"
                    placeholder={`Enter ${selectedCurrency} amount`}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FF6B35';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </motion.div>

                {/* Conversion Info */}
                <motion.div 
                  style={{
                    background: 'rgba(255, 107, 53, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '24px',
                    border: '1px solid rgba(255, 107, 53, 0.2)'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <span style={{ color: '#ccc', fontSize: '14px' }}>USD Value:</span>
                    <span style={{
                      color: '#4ECDC4',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>
                      ${usdValue.toFixed(2)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ color: '#ccc', fontSize: '14px' }}>You will receive:</span>
                    <span style={{
                      color: '#FF6B35',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {tokenAmount.toLocaleString()} CRFX
                    </span>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr',
                    gap: '16px',
                    marginBottom: '20px'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.button
                    onClick={() => setShowBuyModal(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '16px 24px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    onClick={handleBuyTokens}
                    disabled={isPending || !buyAmount || parseFloat(buyAmount) <= 0}
                    whileHover={!isPending && buyAmount && parseFloat(buyAmount) > 0 ? { scale: 1.02 } : {}}
                    whileTap={!isPending && buyAmount && parseFloat(buyAmount) > 0 ? { scale: 0.98 } : {}}
                    style={{
                      padding: '16px 24px',
                      background: (isPending || !buyAmount || parseFloat(buyAmount) <= 0) ? 
                        'rgba(255, 255, 255, 0.2)' : 
                        'linear-gradient(135deg, #FF6B35, #4ECDC4)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: (isPending || !buyAmount || parseFloat(buyAmount) <= 0) ? 'not-allowed' : 'pointer',
                      opacity: (isPending || !buyAmount || parseFloat(buyAmount) <= 0) ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isPending ? (
                      <>
                        <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Buy {tokenAmount.toLocaleString()} CRFX</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>

                {/* Footer Info */}
                <motion.div 
                  style={{
                    textAlign: 'center',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: '20px'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    {[
                      { icon: '🔒', text: 'Secure' },
                      { icon: '⚡', text: 'Instant' },
                      { icon: '✅', text: 'Direct' }
                    ].map((badge, index) => (
                      <motion.div 
                        key={badge.text}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#4ECDC4'
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.text}</span>
                      </motion.div>
                    ))}
                  </div>
                  <p style={{
                    color: '#888',
                    fontSize: '12px',
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                    💰 Payments go directly to treasury<br/>
                    🪙 Tokens sent instantly to your wallet
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add keyframes for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
        }
      `}</style>
    </>
  );
};

export default FinalBuyToken;