'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import { 
  useAccount, 
  useChainId, 
  useSendTransaction, 
  useWaitForTransactionReceipt,
  useSwitchChain,
  useBalance,
  useConnectorClient
} from 'wagmi';
import { parseEther, formatEther, type Hash } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { bsc } from 'viem/chains';
import { 
  isBinanceWallet, 
  switchToBSCInBinanceWallet, 
  autoSwitchToBSC, 
  switchToBSCInTrustWallet, 
  getTrustWalletOptimalGas, 
  validateTrustWalletTransaction,
  getOptimalGasPrice,
  TRUST_WALLET_CONSTANTS
} from '@/wagmi.config';
import styles from './WagmiPresalePurchase.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crfx.org";
const API_ENDPOINTS = {
  getTransferAddress: `${API_BASE_URL}/getTransferAddress`,
  getPrice: `${API_BASE_URL}/getPrice`,
  verifyAndDistribute: `${API_BASE_URL}/verifyAndDistributeTokens`
};

// ФІКСОВАНА ДАТА ЗАКІНЧЕННЯ - 18 вересня 2025, 00:00 UTC
const PRESALE_END_DATE = new Date('2025-09-18T00:00:00.000Z');

// Простий хук таймера з фіксованою датою
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

// Покращена API функція з retry логікою
const executeApiWithRetry = async (url: string, options: any, maxRetries = 3): Promise<any> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API attempt ${attempt + 1}/${maxRetries + 1} to ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
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
        const delay = 1000 * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('API call failed after all retries');
};

// Інтерфейс для відстеження транзакцій
interface PendingTransaction {
  txHash: Hash;
  amount: string;
  userAddress: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  walletType?: string;
}

const WagmiPresalePurchase = () => {
  // Wagmi hooks
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({
    address,
    chainId: bsc.id,
  });
  const { data: connectorClient } = useConnectorClient();

  // Transaction hooks
  const {
    data: txHash,
    error: txError,
    isPending: isTxPending,
    sendTransaction,
    reset: resetTransaction
  } = useSendTransaction();

  const {
    data: txReceipt,
    isError: isReceiptError,
    isLoading: isReceiptLoading,
    isSuccess: isReceiptSuccess
  } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 2,
  });

  // Local state
  const timeLeft = useFixedCountdown();
  const [buyAmount, setBuyAmount] = useState('0.1');
  const [contractAddress, setContractAddress] = useState<string>('');
  const [tokensPerBnb, setTokensPerBnb] = useState<number>(60000);
  const [isClient, setIsClient] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBinanceWalletDetected, setIsBinanceWalletDetected] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  const mountedRef = useRef(true);
  const processingRef = useRef(false);

  // Перевірка Binance Wallet
  useEffect(() => {
    setIsBinanceWalletDetected(isBinanceWallet());
  }, [connector]);

  // Покращена функція для визначення Trust Wallet
  const isTrustWallet = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const ethereum = (window as any).ethereum;
    
    const checks = [
      ethereum?.isTrust,
      ethereum?.isTrustWallet,
      (window as any).trustwallet,
      (window as any).TrustWeb3Provider,
      navigator.userAgent.includes('Trust'),
      navigator.userAgent.includes('TrustWallet'),
      ethereum?.providers?.some((p: any) => p?.isTrust || p?.isTrustWallet),
    ];
    
    return checks.some(check => Boolean(check));
  };

  // ВИПРАВЛЕНА функція для отримання оптимальних параметрів газу
  const getOptimalGasParams = async (connector: any, amount: string): Promise<{gasLimit: bigint, gasPrice: bigint}> => {
    const walletName = connector?.name?.toLowerCase() || '';
    
    if (walletName.includes('trust') || isTrustWallet()) {
      // Trust Wallet з новими параметрами
      const gasPrice = await getOptimalGasPrice('trust');
      return {
        gasLimit: BigInt(TRUST_WALLET_CONSTANTS.SAFE_GAS_LIMIT),
        gasPrice: gasPrice
      };
    } else if (isBinanceWallet()) {
      // Binance Wallet оптимізований для BSC
      const gasPrice = await getOptimalGasPrice('binance');
      return {
        gasLimit: BigInt(21000),
        gasPrice: gasPrice
      };
    } else {
      // Для інших кошельків
      const gasPrice = await getOptimalGasPrice('other');
      return {
        gasLimit: BigInt(23000),
        gasPrice: gasPrice
      };
    }
  };

  // 1. Автоматичне переключення на BSC при підключенні кошелька
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleAutoSwitchToBSC = async () => {
      if (isConnected && address && chainId !== bsc.id) {
        console.log(`Wallet connected on chain ${chainId}, auto-switching to BSC (${bsc.id})...`);
        
        toast.info('🔄 Auto-switching to BSC network for optimal experience...', {
          autoClose: 4000,
          hideProgressBar: false,
        });

        try {
          await new Promise(resolve => setTimeout(resolve, 1500));

          const success = await autoSwitchToBSC(switchChain);
          
          if (success) {
            const walletName = connector?.name || 'wallet';
            toast.success(`✅ Successfully switched to BSC in ${walletName}!`, {
              autoClose: 3000,
            });
            
            if (isBinanceWalletDetected) {
              toast.info('🔶 You\'re now using Binance Wallet on BSC - the optimal setup!', {
                autoClose: 3000,
              });
            }
          } else {
            throw new Error('Switch method returned false');
          }

        } catch (error: any) {
          console.error('Auto BSC switch failed:', error);
          
          if (error.code === 4001) {
            toast.warning('⚠️ Network switch was cancelled. Please switch to BSC manually for the best experience.');
          } else if (error.message?.includes('Connector not found')) {
            toast.error('Please switch to BSC network manually in your wallet settings.');
          } else {
            toast.error('⚠️ Could not auto-switch to BSC. Please switch manually.');
          }
          
          timeoutId = setTimeout(() => {
            if (chainId !== bsc.id) {
              toast.info('💡 Tip: Switch to BSC network in your wallet for the full CrazyFox experience!', {
                autoClose: 5000,
              });
            }
          }, 10000);
        }
      }
    };

    if (isConnected && address) {
      handleAutoSwitchToBSC();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isConnected, address, chainId, switchChain, connector, isBinanceWalletDetected]);

  // 2. Відстеження першого підключення кошелька
  useEffect(() => {
    if (isConnected && address && !hasShownWelcome) {
      console.log('Wallet connected:', { 
        address: address.slice(0, 6) + '...' + address.slice(-4), 
        chainId, 
        connector: connector?.name,
        isBinance: isBinanceWalletDetected 
      });
      
      toast.success(`🦊 Welcome to CrazyFox! Connected with ${connector?.name || 'wallet'}`, {
        autoClose: 3000,
      });
      
      if (chainId === bsc.id) {
        toast.success('🚀 Perfect! You\'re already on BSC network!', {
          autoClose: 2000,
        });
      }
      
      setHasShownWelcome(true);
    } else if (!isConnected) {
      setHasShownWelcome(false);
    }
  }, [isConnected, address, chainId, connector, isBinanceWalletDetected, hasShownWelcome]);

  // 3. Відстеження змін мережі
  useEffect(() => {
    if (isConnected && address) {
      if (chainId === bsc.id) {
        console.log('User is now on BSC network');
      } else {
        console.log('User is on wrong network:', chainId);
        const reminderTimeout = setTimeout(() => {
          if (chainId !== bsc.id) {
            toast.warning('⚠️ You\'re not on BSC network. Some features may not work properly.', {
              autoClose: 4000,
            });
          }
        }, 5000);
        
        return () => clearTimeout(reminderTimeout);
      }
    }
  }, [chainId, isConnected, address]);

  // 4. Показати додаткову інформацію для користувачів Binance Wallet
  useEffect(() => {
    if (isConnected && isBinanceWalletDetected && chainId === bsc.id) {
      const binanceInfoTimeout = setTimeout(() => {
        toast.info('🔶 Binance Wallet + BSC = Optimal setup for CrazyFox! Lower fees and faster transactions.', {
          autoClose: 5000,
          hideProgressBar: false,
        });
      }, 3000);
      
      return () => clearTimeout(binanceInfoTimeout);
    }
  }, [isConnected, isBinanceWalletDetected, chainId]);

  // 5. Спеціальний useEffect для Trust Wallet з новими підказками
  useEffect(() => {
    if (isConnected && isTrustWallet()) {
      console.log('Trust Wallet detected, applying optimizations...');
      
      const trustWalletTimeout = setTimeout(() => {
        toast.info('🛡️ Trust Wallet Tips: Minimum 3 gwei gas price required for BSC transactions', {
          autoClose: 6000,
        });
      }, 2000);
      
      return () => clearTimeout(trustWalletTimeout);
    }
  }, [isConnected, connector]);

  // Валідація суми
  const validateAmount = (value: string): boolean => {
    if (!value || value.trim() === '') return false;
    
    const cleanValue = value.replace(',', '.');
    const numValue = parseFloat(cleanValue);
    
    return !isNaN(numValue) && numValue > 0 && numValue <= 100;
  };

  // Безпечне оновлення суми
  const handleAmountChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9.,]/g, '');
    setBuyAmount(cleanValue);
  };

  // Завантаження даних контракту
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

  // Завантаження ціни токенів
  const fetchTokenPrice = async () => {
    try {
      const response = await executeApiWithRetry(
        `${API_ENDPOINTS.getPrice}?token=BNB`,
        { method: 'GET' },
        2
      );
  
      let tokensAmount: number;
      if (typeof response === 'number') {
        tokensAmount = response;
      } else if (typeof response === 'string') {
        tokensAmount = parseFloat(response.trim());
      } else if (response.tokensPerBnb !== undefined) {
        tokensAmount = response.tokensPerBnb;
      } else if (response.amount !== undefined) {
        tokensAmount = response.amount;
      } else {
        throw new Error('Unexpected response format from getPrice');
      }
  
      if (mountedRef.current && !isNaN(tokensAmount) && tokensAmount > 0) {
        setTokensPerBnb(tokensAmount);
      }
    } catch (error) {
      console.error('Error fetching token price:', error);
    }
  };

  // Завантаження відкладених транзакцій
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
        
        if (validTransactions.length !== transactions.length) {
          localStorage.setItem('pendingTransactions', JSON.stringify(validTransactions));
        }
      }
    } catch (error) {
      console.error('Error loading pending transactions:', error);
      localStorage.removeItem('pendingTransactions');
    }
  };

  // Додавання відкладеної транзакції
  const addPendingTransaction = (txData: Omit<PendingTransaction, 'timestamp' | 'status'>) => {
    if (typeof window === 'undefined') return;
    
    try {
      const newTransaction: PendingTransaction = {
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

  // Видалення відкладеної транзакції
  const removePendingTransaction = (txHash: Hash) => {
    if (typeof window === 'undefined') return;
    
    try {
      const updated = pendingTransactions.filter(tx => tx.txHash !== txHash);
      setPendingTransactions(updated);
      localStorage.setItem('pendingTransactions', JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing pending transaction:', error);
    }
  };

  // Обробка транзакції на бекенді
  const processTransactionWithBackend = useCallback(async (txHash: Hash, amount: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      console.log('Processing transaction with backend:', txHash);
      
      await new Promise(resolve => setTimeout(resolve, isBinanceWalletDetected ? 3000 : 2000));
      
      const payload = {
        txHash: txHash,
        userAddress: address || '',
        amountSent: amount.replace(',', '.'),
        symbol: 'BNB',
        platform: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        userAgent: navigator.userAgent,
        chainId: bsc.id,
        walletType: connector?.name || 'unknown',
        isBinanceWallet: isBinanceWalletDetected
      };

      console.log('Sending payload to backend:', payload);

      const result = await executeApiWithRetry(API_ENDPOINTS.verifyAndDistribute, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': navigator.userAgent,
          'X-Platform': payload.platform,
          'X-Wallet-Type': payload.walletType
        }
      }, 5);

      console.log('Backend processing successful:', result);
      toast.success('🎉 Tokens distributed successfully!');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      removePendingTransaction(txHash);
      
      return result;
    } catch (error: any) {
      console.error('Backend processing failed:', error);
      toast.error(`Backend processing failed. TX: ${txHash.slice(0, 10)}...`);
      
      const failedTx = {
        txHash,
        amount,
        userAddress: address,
        timestamp: Date.now(),
        status: 'failed',
        error: error.message,
        walletType: connector?.name
      };
      
      const failed = JSON.parse(localStorage.getItem('failedTransactions') || '[]');
      failed.push(failedTx);
      localStorage.setItem('failedTransactions', JSON.stringify(failed));
      
      throw error;
    } finally {
      processingRef.current = false;
    }
  }, [address, connector, isBinanceWalletDetected]);

  // ВИПРАВЛЕНА функція покупки з новими параметрами газу
  const handleBuy = async () => {
    if (isSubmitting || !isConnected || !address) {
      toast.warning('Please connect your wallet first! 🦊');
      return;
    }
  
    if (!contractAddress) {
      toast.error('Contract address not loaded');
      return;
    }

    // Валідація суми
    if (!validateAmount(buyAmount)) {
      toast.error('Please enter a valid amount (0.0001 - 100 BNB)');
      return;
    }

    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (amount < 0.0001) {
      toast.error('Minimum amount is 0.0001 BNB');
      return;
    }

    if (amount > 100) {
      toast.error('Maximum amount is 100 BNB');
      return;
    }

    // Перевірка мережі
    if (chainId !== bsc.id) {
      try {
        if (isBinanceWalletDetected) {
          toast.info('🔶 Switching to BSC network in Binance Wallet...');
          const switched = await switchToBSCInBinanceWallet();
          if (!switched) {
            await switchChain({ chainId: bsc.id });
          }
        } else if (isTrustWallet()) {
          toast.info('🛡️ Switching to BSC network in Trust Wallet...');
          const switched = await switchToBSCInTrustWallet();
          if (!switched) {
            await switchChain({ chainId: bsc.id });
          }
        } else {
          await switchChain({ chainId: bsc.id });
        }
        toast.info('Switching to BSC network...');
        return;
      } catch (error) {
        toast.error('Please switch to BSC network manually');
        return;
      }
    }

    // ВИПРАВЛЕНА перевірка балансу з новими вимогами до газу
    if (balance) {
      const balanceInBNB = parseFloat(formatEther(balance.value));
      let gasBuffer = 0.001; // Базовий буфер
      
      if (isTrustWallet()) {
        gasBuffer = parseFloat(TRUST_WALLET_CONSTANTS.RECOMMENDED_GAS_BUFFER); // 0.01 BNB
      } else if (isBinanceWalletDetected) {
        gasBuffer = 0.001;
      }
      
      if (balanceInBNB < (amount + gasBuffer)) {
        toast.error(`Insufficient BNB balance. Need ${(amount + gasBuffer).toFixed(4)} BNB (including gas)`);
        return;
      }
    }

    setIsSubmitting(true);
    resetTransaction();

    try {
      console.log('Starting transaction with wallet-specific optimizations...', {
        to: contractAddress,
        value: parseEther(buyAmount),
        from: address,
        walletType: connector?.name,
        isTrustWallet: isTrustWallet(),
        isBinanceWallet: isBinanceWalletDetected
      });

      // КРИТИЧНІ ВИПРАВЛЕННЯ ДЛЯ TRUST WALLET з новими параметрами газу
      if (isTrustWallet()) {
        toast.info('🛡️ Trust Wallet detected - using optimized BSC parameters...');
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
          // Отримуємо оптимальні параметри газу
          const { gasLimit, gasPrice } = await getOptimalGasParams(connector, buyAmount);
          
          console.log('🛡️ Trust Wallet optimized gas params:', {
            gasLimit: gasLimit.toString(),
            gasPrice: gasPrice.toString(),
            gasPriceGwei: Number(gasPrice) / 10000000000
          });

          const value = parseEther(buyAmount);
          
          // Метод 1: Прямий виклик з ВИПРАВЛЕНИМИ параметрами
          const txParams = {
            from: address,
            to: contractAddress,
            value: `0x${value.toString(16)}`,           // в wei, hex
            // gas:   `0x${gasLimit.toString(16)}`,         // в единицах газа, hex
            // gasPrice: `0x${gasPrice.toString(16)}`,      // в wei, hex
            data: '0x',                                  // <— пустые данные обязательно
            
          };

          console.log('🛡️ Trust Wallet final transaction params:', txParams);

          const txHash: string = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [txParams],
          });

          toast.success(`🛡️ Trust Wallet transaction sent! Hash: ${txHash.slice(0, 10)}...`);
          
          addPendingTransaction({
            txHash: txHash as Hash,
            amount: buyAmount,
            userAddress: address,
            walletType: 'Trust Wallet (BSC-Optimized)'
          });

          setTimeout(() => {
            processTransactionWithBackend(txHash as Hash, buyAmount)
              .catch(error => console.error('Backend processing failed:', error));
          }, 3000);

          setIsSubmitting(false);
          return;

        } catch (directError: any) {
          console.error('🛡️ Trust Wallet direct method failed:', directError);
          
          // Fallback: Wagmi з Trust Wallet параметрами
          try {
            toast.info('🛡️ Using Trust Wallet fallback method...');
            
            const { gasLimit, gasPrice } = await getOptimalGasParams(connector, buyAmount);
            
            sendTransaction({
              to: contractAddress as `0x${string}`,
              value: parseEther(buyAmount),
              gas: gasLimit,
              gasPrice: gasPrice,
              data: '0x',  
            });
            
            toast.info('🛡️ Fallback transaction submitted!');
            return;
            
          } catch (fallbackError: any) {
            console.error('🛡️ Trust Wallet fallback failed:', fallbackError);
            
            // ОНОВЛЕНА допомога з новими рекомендаціями
            if (amount >= 0.01) {
              toast.error(
                <div>
                  <div>🛡️ Trust Wallet BSC Error Solutions (Updated):</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                    • Gas price now requires 3+ gwei (increased from 1 gwei)<br/>
                    • Try amount ≤ 0.01 BNB first<br/>
                    • Update Trust Wallet to latest version<br/>
                    • Ensure 0.01+ BNB for gas fees<br/>
                    • Use BSC network auto-fee settings
                  </div>
                  <button 
                    onClick={() => {
                      setBuyAmount('0.01');
                      setIsSubmitting(false);
                    }}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      background: '#3375BB',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    🔄 Try 0.01 BNB
                  </button>
                </div>,
                { autoClose: false }
              );
            }
            
            throw fallbackError;
          }
        }
      }

      // BINANCE WALLET - з оновленими параметрами
      else if (isBinanceWalletDetected) {
        toast.info('🔶 Processing with Binance Wallet...');
        
        const { gasLimit, gasPrice } = await getOptimalGasParams(connector, buyAmount);
        
        sendTransaction({
          to: contractAddress as `0x${string}`,
          value: parseEther(buyAmount),
          gas: gasLimit,
          gasPrice: gasPrice,
        });
        
        toast.info('📝 Transaction submitted to Binance Wallet!');
      }

      // ІНШІ КОШЕЛЬКИ з оновленими параметрами
      else {
        const { gasLimit, gasPrice } = await getOptimalGasParams(connector, buyAmount);
        
        sendTransaction({
          to: contractAddress as `0x${string}`,
          value: parseEther(buyAmount),
          gas: gasLimit,
          gasPrice: gasPrice,
        });
        
        toast.info('📝 Transaction submitted!');
      }

    } catch (error: any) {
      console.error('Transaction error:', error);
      setIsSubmitting(false);
      
      if (isTrustWallet()) {
        if (error.message?.includes('User denied') || error.code === 4001) {
          toast.warning('🛡️ Transaction cancelled');
        } else if (error.message?.includes('insufficient funds')) {
          toast.error('🛡️ Insufficient BNB. Need 0.01+ BNB for gas fees.');
        } else if (error.message?.includes('internal error')) {
          toast.error(
            <div>
              <div>🛡️ Trust Wallet Internal Error - Updated Solutions:</div>
              <div style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                1. <strong>Update Trust Wallet</strong> (most important)<br/>
                2. Use 3+ gwei gas price (BSC requirement increased)<br/>
                3. Try smaller amount (0.005-0.01 BNB)<br/>
                4. Settings → Advanced → Reset Account<br/>
                5. Switch to auto gas fee settings
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button 
                  onClick={() => {
                    setBuyAmount('0.005');
                    setIsSubmitting(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  🧪 Try 0.005 BNB
                </button>
                <button 
                  onClick={() => {
                    setBuyAmount('0.01');
                    setIsSubmitting(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#3375BB',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  🔄 Try 0.01 BNB
                </button>
              </div>
            </div>,
            { autoClose: false }
          );
        } else {
          toast.error(`🛡️ Trust Wallet error: ${error.message}`);
        }
      } else {
        if (error.code === 4001) {
          toast.warning('Transaction cancelled');
        } else {
          toast.error(`Transaction failed: ${error.message}`);
        }
      }
    }
  };

  // Повторна спроба обробки транзакції
  const retryPendingTransaction = (tx: PendingTransaction) => {
    console.log('Retrying pending transaction:', tx.txHash);
    
    processTransactionWithBackend(tx.txHash, tx.amount)
      .catch(error => {
        console.error('Retry failed:', error);
        toast.error('Retry failed. Please contact support with your transaction hash.');
      });
  };

  // Розрахунок токенів
  const calculateTokens = () => {
    if (!validateAmount(buyAmount)) return '0';
    
    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0 || tokensPerBnb <= 0) return '0';
  
    const tokensReceived = amount * tokensPerBnb;
    return Math.floor(tokensReceived).toLocaleString();
  };

  // Effect для обробки успішних транзакцій
  useEffect(() => {
    if (isReceiptSuccess && txReceipt && txHash) {
      console.log('Transaction confirmed:', txHash);
      
      addPendingTransaction({
        txHash,
        amount: buyAmount,
        userAddress: address || '',
        walletType: connector?.name || 'unknown'
      });

      toast.success(`✅ Transaction confirmed! Hash: ${txHash.slice(0, 10)}...`);
      
      setTimeout(() => {
        processTransactionWithBackend(txHash, buyAmount)
          .catch(error => {
            console.error('Backend processing failed:', error);
          });
      }, isBinanceWalletDetected ? 2000 : 1000);

      setIsSubmitting(false);
    }
  }, [isReceiptSuccess, txReceipt, txHash, buyAmount, address, processTransactionWithBackend, connector, isBinanceWalletDetected]);

  // Effect для обробки помилок транзакцій
  useEffect(() => {
    if (txError) {
      console.error('Transaction error:', txError);
      setIsSubmitting(false);
      
      if (txError.message.includes('User rejected')) {
        toast.warning('Transaction was rejected');
      } else {
        toast.error(`Transaction failed: ${txError.message}`);
      }
    }
  }, [txError]);

  // Effect для обробки помилок отримання квитанції
  useEffect(() => {
    if (isReceiptError) {
      console.error('Receipt error');
      setIsSubmitting(false);
      toast.error('Transaction failed to confirm. Please check your wallet.');
    }
  }, [isReceiptError]);

  // Ініціалізація компонента
  useEffect(() => {
    setIsClient(true);
    fetchContractAddress();
    fetchTokenPrice();
    loadPendingTransactions();

    return () => { 
      mountedRef.current = false; 
    };
  }, []);

  const quickAmounts = ['0.1', '0.5', '1.0', '2.0'];
  const isOnBSC = chainId === bsc.id;
  const isTransactionInProgress = isTxPending || isReceiptLoading || isSubmitting;

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
        {isConnected && address && (
          <div className={styles.connectionStatus}>
            {isBinanceWalletDetected ? '🔶' : isTrustWallet() ? '🛡️' : '🌈'} Connected: {address.slice(0, 6)}...{address.slice(-4)}
            <div style={{ fontSize: '0.8rem', color: '#00D4AA', marginTop: '4px' }}>
              Wallet: {connector?.name} {isBinanceWalletDetected && '(Binance)'} {isTrustWallet() && '(Trust)'} {!isOnBSC && <span style={{ color: '#ff6b6b' }}>⚠️ Switch to BSC</span>}
            </div>
            {balance && (
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                Balance: {parseFloat(formatEther(balance.value)).toFixed(4)} BNB
              </div>
            )}
            {isBinanceWalletDetected && (
              <div style={{ fontSize: '0.75rem', color: '#ffc107', marginTop: '2px' }}>
                ✨ Optimized for Binance Wallet
              </div>
            )}
            {isTrustWallet() && (
              <div style={{ fontSize: '0.75rem', color: '#00bcd4', marginTop: '2px' }}>
                🛡️ Trust Wallet with 3+ gwei gas pricing
              </div>
            )}
          </div>
        )}

        {/* Transaction Status */}
        {isTransactionInProgress && (
          <div className={styles.transactionStatus}>
            {isTxPending && (
              <div className={styles.statusItem}>
                {isBinanceWalletDetected ? '🔶 Confirm in Binance Wallet...' : 
                 isTrustWallet() ? '🛡️ Confirm in Trust Wallet...' : 
                 '🔄 Waiting for wallet confirmation...'}
              </div>
            )}
            {isReceiptLoading && (
              <div className={styles.statusItem}>
                ⏳ Confirming transaction on BSC blockchain...
              </div>
            )}
          </div>
        )}

        {/* Pending Transactions */}
        {pendingTransactions.length > 0 && (
          <div className={styles.pendingTransactions}>
            <div className={styles.pendingTitle}>⏳ Pending Transactions</div>
            {pendingTransactions.map((tx) => (
              <div key={tx.txHash} className={styles.pendingTransaction}>
                <div className={styles.pendingAmount}>Amount: {tx.amount} BNB</div>
                <div className={styles.pendingHash}>Hash: {tx.txHash.slice(0, 10)}...</div>
                <div className={styles.pendingStatus}>Status: {tx.status}</div>
                {tx.walletType && (
                  <div className={styles.pendingWallet}>Wallet: {tx.walletType}</div>
                )}
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

        {/* Connect Wallet */}
        {!isConnected && (
          <div className={styles.connectSection}>
            <p className={styles.connectText}>Connect your wallet to participate:</p>
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button 
                            onClick={openConnectModal} 
                            type="button"
                            className={styles.connectButton}
                          >
                            🌈 Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button 
                            onClick={openChainModal} 
                            type="button"
                            className={styles.wrongNetworkButton}
                          >
                            ⚠️ Wrong network
                          </button>
                        );
                      }

                      return (
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button
                            onClick={openChainModal}
                            style={{ display: 'flex', alignItems: 'center' }}
                            type="button"
                            className={styles.chainButton}
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 12,
                                  height: 12,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                  marginRight: 4,
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 12, height: 12 }}
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </button>

                          <button 
                            onClick={openAccountModal} 
                            type="button"
                            className={styles.accountButton}
                          >
                            {account.displayName}
                            {account.displayBalance
                              ? ` (${account.displayBalance})`
                              : ''}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        )}

        {/* Main Form */}
        {isConnected && (
          <>
            {/* Binance Wallet Benefits */}
            {isBinanceWalletDetected && (
              <div className={styles.binanceBenefits}>
                <div className={styles.benefitsTitle}>
                  🔶 Binance Wallet Benefits
                </div>
                <div className={styles.benefitsList}>
                  <div className={styles.benefit}>⚡ Native BSC integration</div>
                  <div className={styles.benefit}>💰 Lower transaction fees</div>
                  <div className={styles.benefit}>🚀 Faster confirmations</div>
                </div>
              </div>
            )}

            {/* Trust Wallet Gas Info */}
            {isTrustWallet() && (
              <div className={styles.trustWalletInfo}>
                <div className={styles.trustWalletTitle}>
                  🛡️ Trust Wallet Gas Requirements
                </div>
                <div className={styles.trustWalletDetails}>
                  <div className={styles.gasRequirement}>✅ Gas Price: 3+ gwei (Updated)</div>
                  <div className={styles.gasRequirement}>✅ Gas Limit: 21,000-23,000</div>
                  <div className={styles.gasRequirement}>✅ Buffer: 0.01 BNB recommended</div>
                </div>
              </div>
            )}

            {/* Quick Amounts */}
            <div className={styles.quickAmounts}>
              <label className={styles.inputLabel}>Quick amounts (BNB):</label>
              <div className={styles.quickButtons}>
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBuyAmount(amount)}
                    disabled={isTransactionInProgress}
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
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={isTransactionInProgress}
                className={styles.input}
                placeholder="0.0"
                min="0.0001"
                max="100"
                step="0.01"
              />
              {!validateAmount(buyAmount) && buyAmount !== '' && (
                <div style={{ fontSize: '0.8rem', color: '#ff6b6b', marginTop: '4px' }}>
                  Please enter a valid amount (0.0001 - 100 BNB)
                </div>
              )}
              {isTrustWallet() && validateAmount(buyAmount) && (
                <div style={{ fontSize: '0.75rem', color: '#00bcd4', marginTop: '4px' }}>
                  🛡️ Trust Wallet: {((parseFloat(buyAmount.replace(',', '.')) || 0) * 3 * 23000 / 1000000000).toFixed(6)} BNB gas fee (3 gwei)
                </div>
              )}
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
              disabled={isTransactionInProgress || !isOnBSC || !validateAmount(buyAmount)}
              whileHover={{ scale: (isTransactionInProgress || !isOnBSC || !validateAmount(buyAmount)) ? 1 : 1.02 }}
              whileTap={{ scale: (isTransactionInProgress || !isOnBSC || !validateAmount(buyAmount)) ? 1 : 0.98 }}
              className={styles.buyButton}
            >
              {isTransactionInProgress ? (
                isTxPending ? (
                  isBinanceWalletDetected ? '🔶 Confirm in Binance Wallet...' : 
                  isTrustWallet() ? '🛡️ Confirm in Trust Wallet...' : 
                  '🔄 Confirm in Wallet...'
                ) : 
                isReceiptLoading ? '⏳ Confirming on BSC...' : 
                '🔄 Processing...'
              ) : !isOnBSC ? (
                '⚠️ Switch to BSC Network'
              ) : !validateAmount(buyAmount) ? (
                '❌ Invalid Amount'
              ) : (
                isBinanceWalletDetected ? '🔶 Buy with Binance Wallet' : 
                isTrustWallet() ? '🛡️ Buy with Trust Wallet (3+ gwei)' : 
                '🚀 Buy with Wagmi'
              )}
            </motion.button>

            {/* Network Switch Helper for Binance Wallet */}
            {isConnected && !isOnBSC && isBinanceWalletDetected && (
              <div className={styles.networkHelper}>
                <div className={styles.helperText}>
                  🔶 Binance Wallet detected! Click the button above to automatically switch to BSC network.
                </div>
              </div>
            )}

            {/* Network Switch Helper for Trust Wallet */}
            {isConnected && !isOnBSC && isTrustWallet() && (
              <div className={styles.networkHelper}>
                <div className={styles.helperText}>
                  🛡️ Trust Wallet detected! Click the button above to automatically switch to BSC network with optimized gas settings.
                </div>
              </div>
            )}

            {/* Gas Price Information */}
            {isConnected && isOnBSC && (
              <div className={styles.gasInfo}>
                <div className={styles.gasInfoTitle}>⛽ Current Gas Settings</div>
                <div className={styles.gasInfoContent}>
                  {isTrustWallet() && (
                    <div style={{ fontSize: '0.8rem', color: '#00bcd4' }}>
                      🛡️ Trust Wallet: Optimized for 3-5 gwei (BSC requirement)
                    </div>
                  )}
                  {isBinanceWalletDetected && (
                    <div style={{ fontSize: '0.8rem', color: '#ffc107' }}>
                      🔶 Binance Wallet: Native BSC integration with optimal gas
                    </div>
                  )}
                  {!isTrustWallet() && !isBinanceWalletDetected && (
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                      ⚡ Standard wallet: Auto-optimized gas for BSC
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default WagmiPresalePurchase;