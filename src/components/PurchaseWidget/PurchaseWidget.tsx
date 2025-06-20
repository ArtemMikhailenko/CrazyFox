// components/MobileMetaMaskPurchase.tsx - Simple fixed countdown
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import { 
  useActiveAccount,
  useActiveWalletChain,
  ConnectButton
} from "thirdweb/react";
import { 
  createThirdwebClient
} from "thirdweb";
import { createWallet } from "thirdweb/wallets";
import { bsc } from "thirdweb/chains";
import styles from './MobileMetaMaskPurchase.module.css';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "d28d89a66e8eb5e73d6a9c8eeaa0645a"
});

// Создаем только MetaMask кошелек
const metamaskWallet = createWallet("io.metamask");

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crfx.org";
const API_ENDPOINTS = {
  getTransferAddress: `${API_BASE_URL}/getTransferAddress`,
  getPrice: `${API_BASE_URL}/getPrice`,
  verifyAndDistribute: `${API_BASE_URL}/verifyAndDistributeTokens`
};

// ФИКСИРОВАННАЯ ДАТА ОКОНЧАНИЯ - одинакова для всех пользователей
// 18 сентября 2025, 00:00 UTC (90 дней с 20 июня 2025)
const PRESALE_END_DATE = new Date('2025-09-18T00:00:00.000Z');

// Простой хук таймера с фиксированной датой
const useFixedCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const distance = PRESALE_END_DATE.getTime() - now.getTime();

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Немедленное обновление
    updateTimer();
    
    // Обновление каждую секунду
    const timer = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timer);
  }, []); // Пустой массив зависимостей - таймер не будет сбрасываться

  return timeLeft;
};

const MobileMetaMaskPurchase = () => {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  
  // Используем фиксированный таймер
  const timeLeft = useFixedCountdown();
  
  const [buyAmount, setBuyAmount] = useState('0.1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [tokensPerBnb, setTokensPerBnb] = useState<number>(60000);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    fetchContractAddress();
    fetchTokenPrice();
    checkPendingTransaction();
  }, []);

  const fetchContractAddress = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.getTransferAddress);
      if (response.ok) {
        const data = await response.text();
        setContractAddress(data.replace(/['"]/g, '').trim());
      } else {
        setContractAddress("0xa2c959a7Fbf6d96eA4170e724D871E0556cd8556");
      }
    } catch (error) {
      setContractAddress("0xa2c959a7Fbf6d96eA4170e724D871E0556cd8556");
    }
  };

  const fetchTokenPrice = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.getPrice}?token=BNB`);
      if (response.ok) {
        const data = await response.text();
        const tokensAmount = parseFloat(data.trim());
        if (!isNaN(tokensAmount) && tokensAmount > 0) {
          setTokensPerBnb(tokensAmount);
        }
      }
    } catch (error) {
      console.error('Error fetching token price:', error);
    }
  };

  const checkPendingTransaction = () => {
    if (typeof window === 'undefined') return;
    
    const pendingTx = localStorage.getItem('pendingTransaction');
    if (pendingTx) {
      try {
        const txData = JSON.parse(pendingTx);
        const timeDiff = Date.now() - txData.timestamp;
        if (timeDiff < 15 * 60 * 1000) {
          setPendingTransaction(txData);
        } else {
          localStorage.removeItem('pendingTransaction');
        }
      } catch (error) {
        localStorage.removeItem('pendingTransaction');
      }
    }
  };

  const sendTransactionToBackend = async (txHash: string) => {
    try {
      const payload = {
        txHash: txHash,
        userAddress: account?.address || '',
        amountSent: buyAmount.replace(',', '.'),
        symbol: 'BNB'
      };

      const response = await fetch(API_ENDPOINTS.verifyAndDistribute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('🎉 Transaction processed successfully!');
        clearPendingTransaction();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } else {
        toast.error('Backend processing failed. Contact support with hash: ' + txHash);
      }
    } catch (error) {
      toast.error('Error processing transaction. Please contact support.');
    }
  };

  const handleBuy = async () => {
    if (!account) {
      toast.warning('Please connect your MetaMask wallet first! 🦊');
      return;
    }

    if (!contractAddress) {
      toast.error('Contract address not loaded');
      return;
    }

    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (activeChain?.id !== bsc.id) {
      toast.error('Please switch to BSC network in MetaMask');
      return;
    }

    setIsProcessing(true);

    try {
      const amountWei = BigInt(Math.round(amount * 1e18));
      const hexValue = '0x' + amountWei.toString(16);

      if (window.ethereum) {
        await handleDirectTransaction(hexValue, amount);
      } else {
        toast.error('MetaMask not found. Please install MetaMask extension.');
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed: ' + (error.message || 'Unknown error'));
      setIsProcessing(false);
    }
  };

  const handleDirectTransaction = async (hexValue: string, amount: number) => {
    try {
      const transactionParams = {
        from: account?.address,
        to: contractAddress,
        value: hexValue,
        gas: '0x5208',
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParams],
      });

      const transactionData = {
        txHash: txHash,
        to: contractAddress,
        value: hexValue,
        amount: amount.toString(),
        timestamp: Date.now(),
        userAddress: account?.address,
        status: 'pending'
      };
      
      localStorage.setItem('pendingTransaction', JSON.stringify(transactionData));
      setPendingTransaction(transactionData);
      
      toast.success('🎉 Transaction sent! Hash: ' + txHash.slice(0, 10) + '...');
      await sendTransactionToBackend(txHash);
      setIsProcessing(false);

    } catch (error: any) {
      if (error.code === 4001) {
        toast.warning('Transaction cancelled by user');
      } else {
        toast.error('Transaction failed: ' + (error.message || 'Unknown error'));
      }
      setIsProcessing(false);
      clearPendingTransaction();
    }
  };

  const clearPendingTransaction = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pendingTransaction');
    }
    setPendingTransaction(null);
  };

  const calculateTokens = () => {
    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0 || tokensPerBnb <= 0) return '0';
    
    const tokensReceived = amount * tokensPerBnb;
    return Math.floor(tokensReceived).toLocaleString();
  };

  const quickAmounts = ['0.1', '0.5', '1.0', '2.0'];
  const isOnBSC = activeChain?.id === bsc.id;

  if (!isClient) return null;

  return (
    <motion.div 
      className={styles.presaleContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>
          🦊 CRFX PRESALE
        </h3>
        <div className={styles.subtitle}>
          Moon Mission Starting Soon
        </div>
      </div>

      {/* Countdown Timer - синхронизированный для всех */}
      <div className={styles.countdown}>
        <div className={styles.countdownTitle}>🚀 Mission Launch In:</div>
        <div className={styles.countdownGrid}>
          <div className={styles.countdownItem}>
            <div className={styles.countdownNumber}>{timeLeft.days}</div>
            <div className={styles.countdownLabel}>Days</div>
          </div>
          <div className={styles.countdownItem}>
            <div className={styles.countdownNumber}>{timeLeft.hours}</div>
            <div className={styles.countdownLabel}>Hours</div>
          </div>
          <div className={styles.countdownItem}>
            <div className={styles.countdownNumber}>{timeLeft.minutes}</div>
            <div className={styles.countdownLabel}>Min</div>
          </div>
          <div className={styles.countdownItem}>
            <div className={styles.countdownNumber}>{timeLeft.seconds}</div>
            <div className={styles.countdownLabel}>Sec</div>
          </div>
        </div>
        {/* Показываем дату окончания для прозрачности */}
        <div style={{ 
          fontSize: '0.7rem', 
          color: 'rgba(255,255,255,0.5)', 
          marginTop: '8px',
          textAlign: 'center'
        }}>
          Ends: September 18, 2025 (UTC)
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Progress */}
        <div className={styles.progressSection}>
          <div className={styles.progressInfo}>
            <span>Stage 1/6</span>
            <span>${(325000).toLocaleString()} Raised</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '32.5%' }}></div>
          </div>
          <div className={styles.progressText}>32.5% Complete</div>
        </div>

        {/* Price Info */}
        <div className={styles.priceInfo}>
          <div className={styles.priceRow}>
            <span>Current: $0.005</span>
            <span>Next: $0.006</span>
          </div>
        </div>

        {/* Connection Status */}
        {account && (
          <div className={styles.connectionStatus}>
            🦊 MetaMask: {account.address.slice(0, 6)}...{account.address.slice(-4)}
            {!isOnBSC && <div className={styles.networkWarning}>⚠️ Switch to BSC Network</div>}
          </div>
        )}

        {/* Pending Transaction */}
        {pendingTransaction && (
          <div className={styles.pendingTransaction}>
            <div className={styles.pendingTitle}>⏳ Transaction Pending</div>
            <div className={styles.pendingAmount}>Amount: {pendingTransaction.amount} BNB</div>
            <button onClick={clearPendingTransaction} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        )}

        {/* Connect MetaMask */}
        {!account && (
          <div className={styles.connectSection}>
            <p className={styles.connectText}>Connect your MetaMask wallet:</p>
            <ConnectButton 
              client={client}
              wallets={[metamaskWallet]}
              theme="dark"
              chains={[bsc]}
              connectModal={{ 
                size: isMobile ? "compact" : "wide",
                title: "Connect MetaMask",
                welcomeScreen: {
                  title: "Welcome to CrazyFox",
                  subtitle: "Connect your MetaMask wallet to buy CRFX tokens",
                },
                showThirdwebBranding: false,
              }}
              connectButton={{
                label: "Connect MetaMask 🦊",
                style: {
                  backgroundColor: '#FF6B35',
                  borderRadius: '12px',
                  padding: '14px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '280px'
                }
              }}
            />
            
            {/* MetaMask Installation Link */}
            {typeof window !== 'undefined' && !window.ethereum && (
              <div className={styles.installMetamask}>
                <p>Don't have MetaMask?</p>
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.installLink}
                >
                  Install MetaMask Extension
                </a>
              </div>
            )}
          </div>
        )}

        {/* Main Form */}
        {account && (
          <>
            {/* Quick Amounts */}
            <div className={styles.quickAmounts}>
              <label className={styles.inputLabel}>Quick amounts (BNB):</label>
              <div className={styles.quickButtons}>
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBuyAmount(amount)}
                    disabled={isProcessing}
                    className={`${styles.quickButton} ${buyAmount === amount ? styles.quickButtonActive : ''}`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className={styles.amountInput}>
              <label className={styles.inputLabel}>Amount (BNB):</label>
              <input
                type="number"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                disabled={isProcessing}
                className={styles.input}
                placeholder="0.0"
                min="0.01"
                max="10"
                step="0.01"
              />
            </div>

            {/* You Receive */}
            <div className={styles.receiveSection}>
              <div className={styles.receiveLabel}>You receive:</div>
              <div className={styles.receiveAmount}>
                {calculateTokens()} CRFX 🦊
              </div>
              <div className={styles.receiveRate}>
                Rate: {tokensPerBnb.toLocaleString()} CRFX per BNB
              </div>
            </div>

            {/* Buy Button */}
            <motion.button
              onClick={handleBuy}
              disabled={isProcessing || !isOnBSC || !!pendingTransaction}
              whileHover={{ scale: (isProcessing || !isOnBSC || !!pendingTransaction) ? 1 : 1.02 }}
              whileTap={{ scale: (isProcessing || !isOnBSC || !!pendingTransaction) ? 1 : 0.98 }}
              className={styles.buyButton}
            >
              {isProcessing ? (
                '🔄 Processing...'
              ) : !isOnBSC ? (
                '⚠️ Switch to BSC Network'
              ) : !!pendingTransaction ? (
                '⏳ Transaction Pending'
              ) : (
                '🚀 Buy with MetaMask'
              )}
            </motion.button>

            {/* Instructions */}
            <div className={styles.instructions}>
              💡 Transaction will be sent directly through MetaMask. Make sure you're on BSC network.
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default MobileMetaMaskPurchase;