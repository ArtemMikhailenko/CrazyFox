// components/MobileMetaMaskPurchase.tsx - Mobile-optimized with reliable API calls
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

const metamaskWallet = createWallet("io.metamask");

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crfx.org";
const API_ENDPOINTS = {
  getTransferAddress: `${API_BASE_URL}/getTransferAddress`,
  getPrice: `${API_BASE_URL}/getPrice`,
  verifyAndDistribute: `${API_BASE_URL}/verifyAndDistributeTokens`
};

// ФИКСИРОВАННАЯ ДАТА ОКОНЧАНИЯ - 18 сентября 2025, 00:00 UTC
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

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
};

// Mobile-optimized API retry function
const executeApiWithRetry = async (url: string, options: any, maxRetries = 3): Promise<any> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API attempt ${attempt + 1}/${maxRetries + 1} to ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for mobile
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`API success on attempt ${attempt + 1}`);
        return result;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      lastError = error;
      console.log(`API attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('API call failed after all retries');
};

// Mobile-optimized transaction receipt waiting
const waitForTransactionReceipt = async (txHash: string, maxWaitTime = 60000): Promise<any> => {
  const startTime = Date.now();
  let receipt = null;
  
  while (!receipt && (Date.now() - startTime) < maxWaitTime) {
    try {
      if (window.ethereum) {
        receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        });
      }
      
      if (!receipt) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2s
      }
    } catch (error) {
      console.log('Receipt check failed, retrying...', error);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  return receipt;
};

const MobileMetaMaskPurchase = () => {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  
  const timeLeft = useFixedCountdown();
  
  const [buyAmount, setBuyAmount] = useState('0.1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [tokensPerBnb, setTokensPerBnb] = useState<number>(60000);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);

  // Refs to prevent state issues during async operations
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    setIsClient(true);
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    fetchContractAddress();
    fetchTokenPrice();
    loadPendingTransactions();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchContractAddress = async () => {
    try {
      const response = await executeApiWithRetry(API_ENDPOINTS.getTransferAddress, {
        method: 'GET'
      }, 2);
      
      if (mountedRef.current) {
        const address = typeof response === 'string' ? response : response.address || "0xa2c959a7Fbf6d96eA4170e724D871E0556cd8556";
        setContractAddress(address.replace(/['"]/g, '').trim());
      }
    } catch (error) {
      console.error('Failed to fetch contract address:', error);
      if (mountedRef.current) {
        setContractAddress("0xa2c959a7Fbf6d96eA4170e724D871E0556cd8556");
      }
    }
  };

  const fetchTokenPrice = async () => {
    try {
      const response = await executeApiWithRetry(`${API_ENDPOINTS.getPrice}?token=BNB`, {
        method: 'GET'
      }, 2);
      
      const tokensAmount = typeof response === 'string' ? parseFloat(response.trim()) : response.tokensPerBnb || response.amount;
      
      if (mountedRef.current && !isNaN(tokensAmount) && tokensAmount > 0) {
        setTokensPerBnb(tokensAmount);
      }
    } catch (error) {
      console.error('Error fetching token price:', error);
    }
  };

  const loadPendingTransactions = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('pendingTransactions');
      if (stored) {
        const transactions = JSON.parse(stored);
        const validTransactions = transactions.filter((tx: any) => {
          const timeDiff = Date.now() - tx.timestamp;
          return timeDiff < 20 * 60 * 1000; // 20 minutes
        });
        
        setPendingTransactions(validTransactions);
        
        // Clean up expired transactions
        if (validTransactions.length !== transactions.length) {
          localStorage.setItem('pendingTransactions', JSON.stringify(validTransactions));
        }
      }
    } catch (error) {
      console.error('Error loading pending transactions:', error);
      localStorage.removeItem('pendingTransactions');
    }
  };

  const addPendingTransaction = (txData: any) => {
    if (typeof window === 'undefined') return;
    
    try {
      const newTransaction = {
        ...txData,
        timestamp: Date.now(),
        status: 'pending'
      };
      
      const updated = [...pendingTransactions, newTransaction];
      setPendingTransactions(updated);
      localStorage.setItem('pendingTransactions', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving pending transaction:', error);
    }
  };

  const removePendingTransaction = (txHash: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const updated = pendingTransactions.filter(tx => tx.txHash !== txHash);
      setPendingTransactions(updated);
      localStorage.setItem('pendingTransactions', JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing pending transaction:', error);
    }
  };

  // Mobile-optimized backend call with event-driven pattern
  const processTransactionWithBackend = (txHash: string, amount: string) => {
    return new Promise<void>((resolve, reject) => {
      console.log('Starting backend processing for tx:', txHash);
      
      // Wait for transaction receipt first
      waitForTransactionReceipt(txHash)
        .then(receipt => {
          if (!receipt) {
            throw new Error('Transaction receipt not found');
          }
          
          console.log('Transaction confirmed, calling backend...');
          
          // Add delay for mobile state consistency
          setTimeout(() => {
            const payload = {
              txHash: txHash,
              userAddress: account?.address || '',
              amountSent: amount.replace(',', '.'),
              symbol: 'BNB'
            };

            executeApiWithRetry(API_ENDPOINTS.verifyAndDistribute, {
              method: 'POST',
              body: JSON.stringify(payload)
            }, 3)
            .then(() => {
              console.log('Backend API call successful');
              toast.success('🎉 Tokens distributed successfully!');
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              removePendingTransaction(txHash);
              resolve();
            })
            .catch(error => {
              console.error('Backend API call failed:', error);
              toast.error(`API processing failed: ${error.message}. Transaction: ${txHash.slice(0, 10)}...`);
              reject(error);
            });
          }, 2000); // 2 second delay for mobile state consistency
        })
        .catch(error => {
          console.error('Transaction receipt error:', error);
          toast.error('Transaction confirmation failed. Please check manually.');
          reject(error);
        });
    });
  };

  const handleBuy = async () => {
    if (processingRef.current) {
      toast.warning('Transaction already in progress...');
      return;
    }

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

    if (!window.ethereum) {
      toast.error('MetaMask not found. Please install MetaMask extension.');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    try {
      console.log('Starting transaction process...');
      
      const amountWei = BigInt(Math.round(amount * 1e18));
      const hexValue = '0x' + amountWei.toString(16);

      const transactionParams = {
        from: account.address,
        to: contractAddress,
        value: hexValue,
        gas: '0x5208', // 21000
      };

      console.log('Sending transaction with params:', transactionParams);

      // Use event-driven pattern instead of async/await chain
      window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParams],
      })
      .then((txHash: string) => {
        console.log('Transaction sent successfully:', txHash);
        
        toast.success(`🎉 Transaction sent! Hash: ${txHash.slice(0, 10)}...`);
        
        // Add to pending transactions immediately
        addPendingTransaction({
          txHash: txHash,
          to: contractAddress,
          value: hexValue,
          amount: amount.toString(),
          userAddress: account.address
        });

        // Process with backend in background (non-blocking)
        processTransactionWithBackend(txHash, amount.toString())
          .catch(error => {
            console.error('Backend processing failed:', error);
            // Don't throw - transaction was successful, backend issue is separate
          })
          .finally(() => {
            if (mountedRef.current) {
              processingRef.current = false;
              setIsProcessing(false);
            }
          });
      })
      .catch((error: any) => {
        console.error('Transaction failed:', error);
        
        if (error.code === 4001) {
          toast.warning('Transaction cancelled by user');
        } else if (error.code === -32002) {
          toast.error('MetaMask is busy. Please try again in a moment.');
        } else {
          toast.error(`Transaction failed: ${error.message || 'Unknown error'}`);
        }
        
        processingRef.current = false;
        setIsProcessing(false);
      });

    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed: ' + (error.message || 'Unknown error'));
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const retryPendingTransaction = (tx: any) => {
    console.log('Retrying pending transaction:', tx.txHash);
    
    processTransactionWithBackend(tx.txHash, tx.amount)
      .catch(error => {
        console.error('Retry failed:', error);
        toast.error('Retry failed. Please contact support with your transaction hash.');
      });
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

      {/* Countdown Timer */}
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

        {/* Pending Transactions */}
        {pendingTransactions.length > 0 && (
          <div className={styles.pendingTransactions}>
            <div className={styles.pendingTitle}>⏳ Pending Transactions</div>
            {pendingTransactions.map((tx, index) => (
              <div key={tx.txHash} className={styles.pendingTransaction}>
                <div className={styles.pendingAmount}>Amount: {tx.amount} BNB</div>
                <div className={styles.pendingHash}>Hash: {tx.txHash.slice(0, 10)}...</div>
                <div className={styles.pendingActions}>
                  <button onClick={() => retryPendingTransaction(tx)} className={styles.retryButton}>
                    Retry API Call
                  </button>
                  <button onClick={() => removePendingTransaction(tx.txHash)} className={styles.cancelButton}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
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
              disabled={isProcessing || !isOnBSC}
              whileHover={{ scale: (isProcessing || !isOnBSC) ? 1 : 1.02 }}
              whileTap={{ scale: (isProcessing || !isOnBSC) ? 1 : 0.98 }}
              className={styles.buyButton}
            >
              {isProcessing ? (
                '🔄 Processing Transaction...'
              ) : !isOnBSC ? (
                '⚠️ Switch to BSC Network'
              ) : (
                '🚀 Buy with MetaMask'
              )}
            </motion.button>

            {/* Instructions */}
            <div className={styles.instructions}>
              💡 Mobile-optimized: Transaction sent directly, backend processing happens automatically. Check pending transactions above if needed.
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default MobileMetaMaskPurchase;