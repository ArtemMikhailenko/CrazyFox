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
import { useLanguage } from '@/hooks/useLanguage';
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
  // Language hook
  const { getComponentText, t } = useLanguage();

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
        
        toast.info(getComponentText('wagmiPresalePurchase', 'messages.switchingToBSC'), {
          autoClose: 4000,
          hideProgressBar: false,
        });

        try {
          await new Promise(resolve => setTimeout(resolve, 1500));

          const success = await autoSwitchToBSC(switchChain);
          
          if (success) {
            const walletName = connector?.name || 'wallet';
            toast.success(
              t('wagmiPresalePurchase.messages.switchedSuccessfully', { walletName }), 
              { autoClose: 3000 }
            );
            
            if (isBinanceWalletDetected) {
              toast.info(getComponentText('wagmiPresalePurchase', 'messages.binanceOptimal'), {
                autoClose: 3000,
              });
            }
          } else {
            throw new Error('Switch method returned false');
          }

        } catch (error: any) {
          console.error('Auto BSC switch failed:', error);
          
          if (error.code === 4001) {
            toast.warning(getComponentText('wagmiPresalePurchase', 'messages.switchCancelled'));
          } else if (error.message?.includes('Connector not found')) {
            toast.error(getComponentText('wagmiPresalePurchase', 'messages.switchManually'));
          } else {
            toast.error(getComponentText('wagmiPresalePurchase', 'messages.switchFailed'));
          }
          
          timeoutId = setTimeout(() => {
            if (chainId !== bsc.id) {
              toast.info(getComponentText('wagmiPresalePurchase', 'messages.switchTip'), {
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
  }, [isConnected, address, chainId, switchChain, connector, isBinanceWalletDetected, getComponentText, t]);

  // 2. Відстеження першого підключення кошелька
  useEffect(() => {
    if (isConnected && address && !hasShownWelcome) {
      console.log('Wallet connected:', { 
        address: address.slice(0, 6) + '...' + address.slice(-4), 
        chainId, 
        connector: connector?.name,
        isBinance: isBinanceWalletDetected 
      });
      
      toast.success(
        getComponentText('wagmiPresalePurchase', 'messages.welcome') + ` ${connector?.name || 'wallet'}`,
        { autoClose: 3000 }
      );
      
      if (chainId === bsc.id) {
        toast.success(getComponentText('wagmiPresalePurchase', 'messages.perfectBSC'), {
          autoClose: 2000,
        });
      }
      
      setHasShownWelcome(true);
    } else if (!isConnected) {
      setHasShownWelcome(false);
    }
  }, [isConnected, address, chainId, connector, isBinanceWalletDetected, hasShownWelcome, getComponentText, t]);

  // 3. Відстеження змін мережі
  useEffect(() => {
    if (isConnected && address) {
      if (chainId === bsc.id) {
        console.log('User is now on BSC network');
      } else {
        console.log('User is on wrong network:', chainId);
        const reminderTimeout = setTimeout(() => {
          if (chainId !== bsc.id) {
            toast.warning(getComponentText('wagmiPresalePurchase', 'messages.wrongNetwork'), {
              autoClose: 4000,
            });
          }
        }, 5000);
        
        return () => clearTimeout(reminderTimeout);
      }
    }
  }, [chainId, isConnected, address, getComponentText]);

  // 4. Показати додаткову інформацію для користувачів Binance Wallet
  useEffect(() => {
    if (isConnected && isBinanceWalletDetected && chainId === bsc.id) {
      const binanceInfoTimeout = setTimeout(() => {
        toast.info(getComponentText('wagmiPresalePurchase', 'messages.binanceOptimalSetup'), {
          autoClose: 5000,
          hideProgressBar: false,
        });
      }, 3000);
      
      return () => clearTimeout(binanceInfoTimeout);
    }
  }, [isConnected, isBinanceWalletDetected, chainId, getComponentText]);

  // 5. Спеціальний useEffect для Trust Wallet з новими підказками
  useEffect(() => {
    if (isConnected && isTrustWallet()) {
      console.log('Trust Wallet detected, applying optimizations...');
      
      const trustWalletTimeout = setTimeout(() => {
        toast.info(getComponentText('wagmiPresalePurchase', 'messages.trustWalletTips'), {
          autoClose: 6000,
        });
      }, 2000);
      
      return () => clearTimeout(trustWalletTimeout);
    }
  }, [isConnected, connector, getComponentText]);

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
      toast.success(getComponentText('wagmiPresalePurchase', 'messages.tokensDistributed'));
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      removePendingTransaction(txHash);
      
      return result;
    } catch (error: any) {
      console.error('Backend processing failed:', error);
      toast.error(
        getComponentText('wagmiPresalePurchase', 'messages.backendFailed') + ` TX: ${txHash.slice(0, 10)}...`
      );
      
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
  }, [address, connector, isBinanceWalletDetected, getComponentText, t]);

  // ВИПРАВЛЕНА функція покупки з новими параметрами газу
  const handleBuy = async () => {
    if (isSubmitting || !isConnected || !address) {
      toast.warning(getComponentText('wagmiPresalePurchase', 'messages.connectFirst'));
      return;
    }
  
    if (!contractAddress) {
      toast.error(getComponentText('wagmiPresalePurchase', 'messages.contractNotLoaded'));
      return;
    }

    // Валідація суми
    if (!validateAmount(buyAmount)) {
      toast.error(getComponentText('wagmiPresalePurchase', 'form.invalidAmount'));
      return;
    }

    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (amount < 0.0001) {
      toast.error(getComponentText('wagmiPresalePurchase', 'messages.minimumAmount'));
      return;
    }

    if (amount > 100) {
      toast.error(getComponentText('wagmiPresalePurchase', 'messages.maximumAmount'));
      return;
    }

    // Перевірка мережі
    if (chainId !== bsc.id) {
      try {
        if (isBinanceWalletDetected) {
          toast.info(getComponentText('wagmiPresalePurchase', 'transactionStatus.confirmBinance'));
          const switched = await switchToBSCInBinanceWallet();
          if (!switched) {
            await switchChain({ chainId: bsc.id });
          }
        } else if (isTrustWallet()) {
          toast.info(getComponentText('wagmiPresalePurchase', 'transactionStatus.confirmTrust'));
          const switched = await switchToBSCInTrustWallet();
          if (!switched) {
            await switchChain({ chainId: bsc.id });
          }
        } else {
          await switchChain({ chainId: bsc.id });
        }
        toast.info(getComponentText('wagmiPresalePurchase', 'messages.switchingToBSC'));
        return;
      } catch (error) {
        toast.error(getComponentText('wagmiPresalePurchase', 'messages.switchManually'));
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
        toast.error(
          getComponentText('wagmiPresalePurchase', 'messages.insufficientBalance') + ` ${(amount + gasBuffer).toFixed(4)} BNB`
        );
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
        toast.info(getComponentText('wagmiPresalePurchase', 'messages.trustWalletDetected'));
        
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
            value: `0x${value.toString(16)}`,
            data: '0x',
          };

          console.log('🛡️ Trust Wallet final transaction params:', txParams);

          const txHash: string = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [txParams],
          });

          toast.success(
            getComponentText('wagmiPresalePurchase', 'messages.transactionSent') + ` ${txHash.slice(0, 10)}...`
          );
          
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
            toast.info(getComponentText('wagmiPresalePurchase', 'messages.fallbackMethod'));
            
            const { gasLimit, gasPrice } = await getOptimalGasParams(connector, buyAmount);
            
            sendTransaction({
              to: contractAddress as `0x${string}`,
              value: parseEther(buyAmount),
              gas: gasLimit,
              gasPrice: gasPrice,
              data: '0x',  
            });
            
            toast.info(getComponentText('wagmiPresalePurchase', 'messages.fallbackSubmitted'));
            return;
            
          } catch (fallbackError: any) {
            console.error('🛡️ Trust Wallet fallback failed:', fallbackError);
            
            // ОНОВЛЕНА допомога з новими рекомендаціями
            if (amount >= 0.01) {
              const solutionsText = getComponentText('wagmiPresalePurchase', 'trustWalletErrors.solutions');
              const solutionsList = [
                getComponentText('wagmiPresalePurchase', 'trustWalletErrors.solutionsList.0'),
                getComponentText('wagmiPresalePurchase', 'trustWalletErrors.solutionsList.1'),
                getComponentText('wagmiPresalePurchase', 'trustWalletErrors.solutionsList.2'),
                getComponentText('wagmiPresalePurchase', 'trustWalletErrors.solutionsList.3'),
                getComponentText('wagmiPresalePurchase', 'trustWalletErrors.solutionsList.4')
              ].join('\n');

              toast.error(
                <div>
                  <div>{solutionsText}</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                    {solutionsList}
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
                    {getComponentText('wagmiPresalePurchase', 'trustWalletErrors.tryAmount01')}
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
        toast.info(getComponentText('wagmiPresalePurchase', 'messages.binanceProcessing'));
        
        const { gasLimit, gasPrice } = await getOptimalGasParams(connector, buyAmount);
        
        sendTransaction({
          to: contractAddress as `0x${string}`,
          value: parseEther(buyAmount),
          gas: gasLimit,
          gasPrice: gasPrice,
        });
        
        toast.info(getComponentText('wagmiPresalePurchase', 'messages.binanceSubmitted'));
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
        
        toast.info(getComponentText('wagmiPresalePurchase', 'messages.transactionSubmitted'));
      }

    } catch (error: any) {
      console.error('Transaction error:', error);
      setIsSubmitting(false);
      
      if (isTrustWallet()) {
        if (error.message?.includes('User denied') || error.code === 4001) {
          toast.warning(getComponentText('wagmiPresalePurchase', 'messages.transactionCancelled'));
        } else if (error.message?.includes('insufficient funds')) {
          toast.error(getComponentText('wagmiPresalePurchase', 'messages.insufficientBNB'));
        } else if (error.message?.includes('internal error')) {
          const internalErrorText = getComponentText('wagmiPresalePurchase', 'trustWalletErrors.internalError');
          const internalSolutions = [
            getComponentText('wagmiPresalePurchase', 'trustWalletErrors.internalSolutions.0'),
            getComponentText('wagmiPresalePurchase', 'trustWalletErrors.internalSolutions.1'),
            getComponentText('wagmiPresalePurchase', 'trustWalletErrors.internalSolutions.2'),
            getComponentText('wagmiPresalePurchase', 'trustWalletErrors.internalSolutions.3'),
            getComponentText('wagmiPresalePurchase', 'trustWalletErrors.internalSolutions.4')
          ].join('\n');

          toast.error(
            <div>
              <div>{internalErrorText}</div>
              <div style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                {internalSolutions}
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
                  {getComponentText('wagmiPresalePurchase', 'trustWalletErrors.tryAmount005')}
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
                  {getComponentText('wagmiPresalePurchase', 'trustWalletErrors.tryAmount01')}
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
          toast.warning(getComponentText('wagmiPresalePurchase', 'messages.transactionCancelled'));
        } else {
          toast.error(
            getComponentText('wagmiPresalePurchase', 'messages.transactionFailed') + `: ${error.message}`
          );
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
        toast.error(getComponentText('wagmiPresalePurchase', 'messages.retryFailed'));
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

      toast.success(
        getComponentText('wagmiPresalePurchase', 'messages.transactionConfirmed') + ` ${txHash.slice(0, 10)}...`
      );
      
      setTimeout(() => {
        processTransactionWithBackend(txHash, buyAmount)
          .catch(error => {
            console.error('Backend processing failed:', error);
          });
      }, isBinanceWalletDetected ? 2000 : 1000);

      setIsSubmitting(false);
    }
  }, [isReceiptSuccess, txReceipt, txHash, buyAmount, address, processTransactionWithBackend, connector, isBinanceWalletDetected, t]);

  // Effect для обробки помилок транзакцій
  useEffect(() => {
    if (txError) {
      console.error('Transaction error:', txError);
      setIsSubmitting(false);
      
      if (txError.message.includes('User rejected')) {
        toast.warning(getComponentText('wagmiPresalePurchase', 'messages.transactionRejected'));
      } else {
        toast.error(
          getComponentText('wagmiPresalePurchase', 'messages.transactionFailed') + `: ${txError.message}`
        );
      }
    }
  }, [txError, getComponentText, t]);

  // Effect для обробки помилок отримання квитанції
  useEffect(() => {
    if (isReceiptError) {
      console.error('Receipt error');
      setIsSubmitting(false);
      toast.error(getComponentText('wagmiPresalePurchase', 'messages.receiptFailed'));
    }
  }, [isReceiptError, getComponentText]);

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
          {getComponentText('wagmiPresalePurchase', 'header.title')}
        </h3>
        <div className={styles.subtitle}>
          {getComponentText('wagmiPresalePurchase', 'header.subtitle')}
        </div>
      </div>

      {/* Countdown Timer */}
      <div className={styles.countdown}>
        <div className={styles.countdownTitle}>
          {getComponentText('wagmiPresalePurchase', 'countdown.title')}
        </div>
        <div className={styles.countdownGrid}>
          <div className={styles.countdownItem}>
            <div className={styles.countdownNumber}>{timeLeft.days}</div>
            <div className={styles.countdownLabel}>
              {getComponentText('wagmiPresalePurchase', 'countdown.labels.days')}
            </div>
          </div>
          <div className={styles.countdownItem}>
            <div className={styles.countdownNumber}>{timeLeft.hours}</div>
            <div className={styles.countdownLabel}>
              {getComponentText('wagmiPresalePurchase', 'countdown.labels.hours')}
            </div>
          </div>
          <div className={styles.countdownItem}>
            <div className={styles.countdownNumber}>{timeLeft.minutes}</div>
            <div className={styles.countdownLabel}>
              {getComponentText('wagmiPresalePurchase', 'countdown.labels.minutes')}
            </div>
          </div>
          <div className={styles.countdownItem}>
            <div className={styles.countdownNumber}>{timeLeft.seconds}</div>
            <div className={styles.countdownLabel}>
              {getComponentText('wagmiPresalePurchase', 'countdown.labels.seconds')}
            </div>
          </div>
        </div>
        <div style={{ 
          fontSize: '0.7rem', 
          color: 'rgba(255,255,255,0.5)', 
          marginTop: '8px',
          textAlign: 'center'
        }}>
          {getComponentText('wagmiPresalePurchase', 'countdown.endDate')}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Progress */}
        <div className={styles.progressSection}>
          <div className={styles.progressInfo}>
            <span>{getComponentText('wagmiPresalePurchase', 'progress.stage')}</span>
            <span>{getComponentText('wagmiPresalePurchase', 'progress.raised')}: $329,000</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '32.5%' }}></div>
          </div>
          <div className={styles.progressText}>
            {getComponentText('wagmiPresalePurchase', 'progress.complete')}
          </div>
        </div>

        {/* Price Info */}
        <div className={styles.priceInfo}>
          <div className={styles.priceRow}>
            <span>{getComponentText('wagmiPresalePurchase', 'price.current')}</span>
            <span>{getComponentText('wagmiPresalePurchase', 'price.next')}</span>
          </div>
        </div>

        {/* Connection Status */}
        {isConnected && address && (
          <div className={styles.connectionStatus}>
            {isBinanceWalletDetected ? '🔶' : isTrustWallet() ? '🛡️' : '🌈'} {getComponentText('wagmiPresalePurchase', 'connection.connected')}: {address.slice(0, 6)}...{address.slice(-4)}
            <div style={{ fontSize: '0.8rem', color: '#00D4AA', marginTop: '4px' }}>
              {getComponentText('wagmiPresalePurchase', 'connection.wallet')}: {connector?.name} {isBinanceWalletDetected && '(Binance)'} {isTrustWallet() && '(Trust)'} {!isOnBSC && <span style={{ color: '#ff6b6b' }}>{getComponentText('wagmiPresalePurchase', 'connection.switchToBSC')}</span>}
            </div>
            {balance && (
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                {getComponentText('wagmiPresalePurchase', 'connection.balance')}: {parseFloat(formatEther(balance.value)).toFixed(4)} BNB
              </div>
            )}
            {isBinanceWalletDetected && (
              <div style={{ fontSize: '0.75rem', color: '#ffc107', marginTop: '2px' }}>
                {getComponentText('wagmiPresalePurchase', 'connection.optimizedFor')}: Binance Wallet
              </div>
            )}
            {isTrustWallet() && (
              <div style={{ fontSize: '0.75rem', color: '#00bcd4', marginTop: '2px' }}>
                {getComponentText('wagmiPresalePurchase', 'connection.gasRequirement')}
              </div>
            )}
          </div>
        )}

        {/* Transaction Status */}
        {isTransactionInProgress && (
          <div className={styles.transactionStatus}>
            {isTxPending && (
              <div className={styles.statusItem}>
                {isBinanceWalletDetected ? getComponentText('wagmiPresalePurchase', 'transactionStatus.confirmBinance') : 
                 isTrustWallet() ? getComponentText('wagmiPresalePurchase', 'transactionStatus.confirmTrust') : 
                 getComponentText('wagmiPresalePurchase', 'transactionStatus.confirmWallet')}
              </div>
            )}
            {isReceiptLoading && (
              <div className={styles.statusItem}>
                {getComponentText('wagmiPresalePurchase', 'transactionStatus.confirming')}
              </div>
            )}
          </div>
        )}

        {/* Pending Transactions */}
        {pendingTransactions.length > 0 && (
          <div className={styles.pendingTransactions}>
            <div className={styles.pendingTitle}>
              {getComponentText('wagmiPresalePurchase', 'pendingTransactions.title')}
            </div>
            {pendingTransactions.map((tx) => (
              <div key={tx.txHash} className={styles.pendingTransaction}>
                <div className={styles.pendingAmount}>
                  {getComponentText('wagmiPresalePurchase', 'pendingTransactions.amount')}: {tx.amount} BNB
                </div>
                <div className={styles.pendingHash}>
                  {getComponentText('wagmiPresalePurchase', 'pendingTransactions.hash')}: {tx.txHash.slice(0, 10)}...
                </div>
                <div className={styles.pendingStatus}>
                  {getComponentText('wagmiPresalePurchase', 'pendingTransactions.status')}: {tx.status}
                </div>
                {tx.walletType && (
                  <div className={styles.pendingWallet}>
                    {getComponentText('wagmiPresalePurchase', 'pendingTransactions.wallet')}: {tx.walletType}
                  </div>
                )}
                <div className={styles.pendingActions}>
                  <button onClick={() => retryPendingTransaction(tx)} className={styles.retryButton}>
                    {getComponentText('wagmiPresalePurchase', 'pendingTransactions.retryButton')}
                  </button>
                  <button onClick={() => removePendingTransaction(tx.txHash)} className={styles.cancelButton}>
                    {getComponentText('wagmiPresalePurchase', 'pendingTransactions.removeButton')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Connect Wallet */}
        {!isConnected && (
          <div className={styles.connectSection}>
            <p className={styles.connectText}>
              {getComponentText('wagmiPresalePurchase', 'connectWallet.title')}
            </p>
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
                            {getComponentText('wagmiPresalePurchase', 'connectWallet.connectButton')}
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
                            {getComponentText('wagmiPresalePurchase', 'connectWallet.wrongNetwork')}
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
                  {getComponentText('wagmiPresalePurchase', 'walletBenefits.binance.title')}
                </div>
                <div className={styles.benefitsList}>
                  {getComponentText('wagmiPresalePurchase', 'walletBenefits.binance.benefits.0') && (
                    <div className={styles.benefit}>
                      {getComponentText('wagmiPresalePurchase', 'walletBenefits.binance.benefits.0')}
                    </div>
                  )}
                  {getComponentText('wagmiPresalePurchase', 'walletBenefits.binance.benefits.1') && (
                    <div className={styles.benefit}>
                      {getComponentText('wagmiPresalePurchase', 'walletBenefits.binance.benefits.1')}
                    </div>
                  )}
                  {getComponentText('wagmiPresalePurchase', 'walletBenefits.binance.benefits.2') && (
                    <div className={styles.benefit}>
                      {getComponentText('wagmiPresalePurchase', 'walletBenefits.binance.benefits.2')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trust Wallet Gas Info */}
            {isTrustWallet() && (
              <div className={styles.trustWalletInfo}>
                <div className={styles.trustWalletTitle}>
                  {getComponentText('wagmiPresalePurchase', 'walletBenefits.trustWallet.title')}
                </div>
                <div className={styles.trustWalletDetails}>
                  {getComponentText('wagmiPresalePurchase', 'walletBenefits.trustWallet.requirements.0') && (
                    <div className={styles.gasRequirement}>
                      {getComponentText('wagmiPresalePurchase', 'walletBenefits.trustWallet.requirements.0')}
                    </div>
                  )}
                  {getComponentText('wagmiPresalePurchase', 'walletBenefits.trustWallet.requirements.1') && (
                    <div className={styles.gasRequirement}>
                      {getComponentText('wagmiPresalePurchase', 'walletBenefits.trustWallet.requirements.1')}
                    </div>
                  )}
                  {getComponentText('wagmiPresalePurchase', 'walletBenefits.trustWallet.requirements.2') && (
                    <div className={styles.gasRequirement}>
                      {getComponentText('wagmiPresalePurchase', 'walletBenefits.trustWallet.requirements.2')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Amounts */}
            <div className={styles.quickAmounts}>
              <label className={styles.inputLabel}>
                {getComponentText('wagmiPresalePurchase', 'form.quickAmountsLabel')}
              </label>
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
              <label className={styles.inputLabel}>
                {getComponentText('wagmiPresalePurchase', 'form.amountLabel')}
              </label>
              <input
                type="number"
                value={buyAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={isTransactionInProgress}
                className={styles.input}
                placeholder={getComponentText('wagmiPresalePurchase', 'form.amountPlaceholder')}
                min="0.0001"
                max="100"
                step="0.01"
              />
              {!validateAmount(buyAmount) && buyAmount !== '' && (
                <div style={{ fontSize: '0.8rem', color: '#ff6b6b', marginTop: '4px' }}>
                  {getComponentText('wagmiPresalePurchase', 'form.invalidAmount')}
                </div>
              )}
              {isTrustWallet() && validateAmount(buyAmount) && (
                <div style={{ fontSize: '0.75rem', color: '#00bcd4', marginTop: '4px' }}>
                  🛡️ Trust Wallet: {((parseFloat(buyAmount.replace(',', '.')) || 0) * 3 * 23000 / 1000000000).toFixed(6)} BNB {getComponentText('wagmiPresalePurchase', 'form.gasFee')} (3 gwei)
                </div>
              )}
            </div>

            {/* You Receive */}
            <div className={styles.receiveSection}>
              <div className={styles.receiveLabel}>
                {getComponentText('wagmiPresalePurchase', 'form.youReceive')}
              </div>
              <div className={styles.receiveAmount}>
                {calculateTokens()} CRFX 🦊
              </div>
              <div className={styles.receiveRate}>
                {getComponentText('wagmiPresalePurchase', 'form.rate')}: {tokensPerBnb.toLocaleString()} CRFX per BNB
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
                  isBinanceWalletDetected ? getComponentText('wagmiPresalePurchase', 'buyButton.confirmBinance') : 
                  isTrustWallet() ? getComponentText('wagmiPresalePurchase', 'buyButton.confirmTrust') : 
                  getComponentText('wagmiPresalePurchase', 'buyButton.confirmWallet')
                ) : 
                isReceiptLoading ? getComponentText('wagmiPresalePurchase', 'buyButton.confirming') : 
                getComponentText('wagmiPresalePurchase', 'buyButton.processing')
              ) : !isOnBSC ? (
                getComponentText('wagmiPresalePurchase', 'buyButton.switchNetwork')
              ) : !validateAmount(buyAmount) ? (
                getComponentText('wagmiPresalePurchase', 'buyButton.invalidAmount')
              ) : (
                isBinanceWalletDetected ? getComponentText('wagmiPresalePurchase', 'buyButton.buyWithBinance') : 
                isTrustWallet() ? getComponentText('wagmiPresalePurchase', 'buyButton.buyWithTrust') : 
                getComponentText('wagmiPresalePurchase', 'buyButton.buyWithWagmi')
              )}
            </motion.button>

            {/* Network Switch Helper for Binance Wallet */}
            {isConnected && !isOnBSC && isBinanceWalletDetected && (
              <div className={styles.networkHelper}>
                <div className={styles.helperText}>
                  {getComponentText('wagmiPresalePurchase', 'networkHelper.binance')}
                </div>
              </div>
            )}

            {/* Network Switch Helper for Trust Wallet */}
            {isConnected && !isOnBSC && isTrustWallet() && (
              <div className={styles.networkHelper}>
                <div className={styles.helperText}>
                  {getComponentText('wagmiPresalePurchase', 'networkHelper.trust')}
                </div>
              </div>
            )}

            {/* Gas Price Information */}
            {isConnected && isOnBSC && (
              <div className={styles.gasInfo}>
                <div className={styles.gasInfoTitle}>
                  {getComponentText('wagmiPresalePurchase', 'gasInfo.title')}
                </div>
                <div className={styles.gasInfoContent}>
                  {isTrustWallet() && (
                    <div style={{ fontSize: '0.8rem', color: '#00bcd4' }}>
                      {getComponentText('wagmiPresalePurchase', 'gasInfo.trustWallet')}
                    </div>
                  )}
                  {isBinanceWalletDetected && (
                    <div style={{ fontSize: '0.8rem', color: '#ffc107' }}>
                      {getComponentText('wagmiPresalePurchase', 'gasInfo.binanceWallet')}
                    </div>
                  )}
                  {!isTrustWallet() && !isBinanceWalletDetected && (
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                      {getComponentText('wagmiPresalePurchase', 'gasInfo.standardWallet')}
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