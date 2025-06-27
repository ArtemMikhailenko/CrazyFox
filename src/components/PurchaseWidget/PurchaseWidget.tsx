// components/WagmiPresalePurchase.tsx - Полная версия с автоматическим переключением на BSC
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
import { isBinanceWallet, switchToBSCInBinanceWallet, autoSwitchToBSC, switchToBSCInTrustWallet } from '@/wagmi.config';
import styles from './WagmiPresalePurchase.module.css';

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

// Улучшенная API функция с retry логикой
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

// Интерфейс для отслеживания транзакций
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
    confirmations: 2, // Ждем 2 подтверждения для надежности
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

  // Проверка Binance Wallet
  useEffect(() => {
    setIsBinanceWalletDetected(isBinanceWallet());
  }, [connector]);

  // 1. Автоматическое переключение на BSC при подключении кошелька
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleAutoSwitchToBSC = async () => {
      // Проверяем что кошелек подключен и сеть не BSC
      if (isConnected && address && chainId !== bsc.id) {
        console.log(`Wallet connected on chain ${chainId}, auto-switching to BSC (${bsc.id})...`);
        
        // Показываем уведомление
        toast.info('🔄 Auto-switching to BSC network for optimal experience...', {
          autoClose: 4000,
          hideProgressBar: false,
        });

        try {
          // Небольшая задержка для стабильности подключения
          await new Promise(resolve => setTimeout(resolve, 1500));

          const success = await autoSwitchToBSC(switchChain);
          
          if (success) {
            const walletName = connector?.name || 'wallet';
            toast.success(`✅ Successfully switched to BSC in ${walletName}!`, {
              autoClose: 3000,
            });
            
            // Дополнительное уведомление для Binance Wallet
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
          
          // Показываем соответствующее сообщение об ошибке
          if (error.code === 4001) {
            toast.warning('⚠️ Network switch was cancelled. Please switch to BSC manually for the best experience.');
          } else if (error.message?.includes('Connector not found')) {
            toast.error('Please switch to BSC network manually in your wallet settings.');
          } else {
            toast.error('⚠️ Could not auto-switch to BSC. Please switch manually.');
          }
          
          // Показываем подсказку через некоторое время
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

    // Запускаем автоматическое переключение
    if (isConnected && address) {
      handleAutoSwitchToBSC();
    }

    // Очистка таймаута при размонтировании
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isConnected, address, chainId, switchChain, connector, isBinanceWalletDetected]);

  // 2. Отслеживание первого подключения кошелька
  useEffect(() => {
    // Этот эффект срабатывает только при изменении статуса подключения
    if (isConnected && address && !hasShownWelcome) {
      console.log('Wallet connected:', { 
        address: address.slice(0, 6) + '...' + address.slice(-4), 
        chainId, 
        connector: connector?.name,
        isBinance: isBinanceWalletDetected 
      });
      
      // Приветственное сообщение
      toast.success(`🦊 Welcome to CrazyFox! Connected with ${connector?.name || 'wallet'}`, {
        autoClose: 3000,
      });
      
      // Если уже на BSC, показываем позитивное сообщение
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

  // 3. Отслеживание изменений сети
  useEffect(() => {
    if (isConnected && address) {
      if (chainId === bsc.id) {
        console.log('User is now on BSC network');
        // Можно добавить логику для обновления UI когда пользователь на правильной сети
      } else {
        console.log('User is on wrong network:', chainId);
        // Показываем reminder через некоторое время
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

  // 4. Показать дополнительную информацию для пользователей Binance Wallet
  useEffect(() => {
    if (isConnected && isBinanceWalletDetected && chainId === bsc.id) {
      // Показываем специальное сообщение для Binance Wallet пользователей
      const binanceInfoTimeout = setTimeout(() => {
        toast.info('🔶 Binance Wallet + BSC = Optimal setup for CrazyFox! Lower fees and faster transactions.', {
          autoClose: 5000,
          hideProgressBar: false,
        });
      }, 3000);
      
      return () => clearTimeout(binanceInfoTimeout);
    }
  }, [isConnected, isBinanceWalletDetected, chainId]);

  // Валидация суммы
  const validateAmount = (value: string): boolean => {
    if (!value || value.trim() === '') return false;
    
    const cleanValue = value.replace(',', '.');
    const numValue = parseFloat(cleanValue);
    
    return !isNaN(numValue) && numValue > 0 && numValue <= 100;
  };

  // Безопасное обновление суммы
  const handleAmountChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9.,]/g, '');
    setBuyAmount(cleanValue);
  };

  // Загрузка данных контракта
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

  // Загрузка цены токенов
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

  // Загрузка отложенных транзакций
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

  // Добавление отложенной транзакции
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

  // Удаление отложенной транзакции
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

  // Обработка транзакции на бэкенде
  const processTransactionWithBackend = useCallback(async (txHash: Hash, amount: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      console.log('Processing transaction with backend:', txHash);
      
      // Небольшая задержка для мобильных устройств и Binance Wallet
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
      
      // Сохраняем неудачную транзакцию для повторной попытки
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
  const isTrustWallet = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!(window.ethereum?.isTrust || navigator.userAgent.includes('Trust'));
  };
  
  // 2. Функция для определения правильного количества газа для разных кошельков
  const getOptimalGasLimit = async (connector: any, amount: string): Promise<bigint> => {
    const walletName = connector?.name?.toLowerCase() || '';
    
    if (walletName.includes('trust') || isTrustWallet()) {
      // Trust Wallet требует больше газа для BSC
      return BigInt(25000);
    } else if (isBinanceWallet()) {
      // Binance Wallet оптимизирован для BSC
      return BigInt(21000);
    } else {
      // Для других кошельков используем стандартный газ
      return BigInt(23000);
    }
  };
  
  // 3. Функция для получения правильного gas price для BSC
  const getBSCGasPrice = async (): Promise<bigint> => {
    try {
      // Получаем актуальный gas price для BSC
      const response = await fetch('https://api.bscscan.com/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken');
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        // Используем SafeGasPrice + небольшой буфер
        const safePriceGwei = parseInt(data.result.SafeGasPrice) + 1;
        return BigInt(safePriceGwei * 1000000000); // Convert to wei
      }
    } catch (error) {
      console.log('Failed to fetch BSC gas price, using default');
    }
    
    // Fallback gas price для BSC (5 gwei)
    return BigInt(5000000000);
  };
  const retryTransactionForTrustWallet = async () => {
    if (!isTrustWallet() || !contractAddress || !validateAmount(buyAmount)) {
      toast.error('Cannot retry: invalid conditions');
      return;
    }
    
    setIsSubmitting(true);
    resetTransaction();
    
    try {
      toast.info('🛡️ Retrying with Trust Wallet optimizations...');
      
      // Увеличиваем gas limit и используем более высокий gas price для Trust Wallet
      const increasedGasLimit = BigInt(30000); // Еще больше газа для retry
      const gasPrice = BigInt(8000000000); // 8 gwei для retry
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Задержка для стабильности
      
      sendTransaction({
        to: contractAddress as `0x${string}`,
        value: parseEther(buyAmount),
        gas: increasedGasLimit,
        gasPrice: gasPrice,
      });
      
      toast.info('🛡️ Retry transaction submitted to Trust Wallet!');
      
    } catch (error: any) {
      console.error('Trust Wallet retry failed:', error);
      setIsSubmitting(false);
      toast.error('🛡️ Retry failed. Try with a smaller amount or contact support.');
    }
  };
  // Улучшенная функция покупки с поддержкой Binance Wallet
  const handleBuy = async () => {
    if (isSubmitting || !isConnected || !address) {
      toast.warning('Please connect your wallet first! 🦊');
      return;
    }
  
    if (!contractAddress) {
      toast.error('Contract address not loaded');
      return;
    }
  
    // Валидация суммы
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
  
    // Проверка сети
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
  
    // Проверка баланса с буфером для газа
    if (balance) {
      const balanceInBNB = parseFloat(formatEther(balance.value));
      let gasBuffer = 0.001; // По умолчанию
      
      if (isTrustWallet()) {
        gasBuffer = 0.003; // Trust Wallet требует больше газа
      } else if (isBinanceWalletDetected) {
        gasBuffer = 0.0008; // Binance Wallet более эффективен
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
  
      // Получаем оптимальные параметры газа для кошелька
      const gasLimit = await getOptimalGasLimit(connector, buyAmount);
      const gasPrice = await getBSCGasPrice();
      if (isTrustWallet()) {
        try {
          const valueHex = parseEther(buyAmount).toString();           // в wei, как строка
          const gasHex   = gasLimit.toString();                       // например "30000"
          const priceHex = gasPrice.toString();                       // например "8000000000"
          const txParams = {
            from: address,
            to: contractAddress,
            value: valueHex,
            gas: gasHex,
            gasPrice: priceHex,
            chainId: bsc.id,      // 56
            type: 0               // legacy
          };
      
          // вместо viem.sendTransaction — напрямую в Trust Wallet
          const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [txParams],
          });
      
          toast.info(`🛡️ Transaction sent! Hash: ${txHash.slice(0, 10)}...`);
          // сохранить в pendingTransactions и т.п.
          return;
        } catch (err: any) {
          console.error('Trust Wallet eth_sendTransaction error', err);
          toast.error(`🛡️ Trust Wallet error: ${err.message || err}`);
          setIsSubmitting(false);
          return;
        }
      }
      // Специальная обработка для Trust Wallet
      if (isTrustWallet()) {
        toast.info('🛡️ Optimizing transaction for Trust Wallet on BSC...');
        // Небольшая задержка для Trust Wallet
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
  
      // Специальная обработка для Binance Wallet
      if (isBinanceWalletDetected) {
        toast.info('🔶 Processing with Binance Wallet...');
      }
      
      // Отправляем транзакцию с оптимизированными параметрами
      sendTransaction({
        to: contractAddress as `0x${string}`,
        value: parseEther(buyAmount),
        gas: gasLimit,
        gasPrice: gasPrice,
      });
  
      // Показываем соответствующее сообщение в зависимости от кошелька
      if (isTrustWallet()) {
        toast.info('📝 Transaction submitted to Trust Wallet! Please confirm in your wallet...');
      } else if (isBinanceWalletDetected) {
        toast.info('📝 Transaction submitted to Binance Wallet! Please confirm...');
      } else {
        toast.info('📝 Transaction submitted! Waiting for confirmation...');
      }
  
    } catch (error: any) {
      console.error('Transaction error:', error);
      setIsSubmitting(false);
      
      // Специальные сообщения об ошибках для разных кошельков
      if (isTrustWallet()) {
        if (error.message?.includes('User denied') || error.code === 4001) {
          toast.warning('🛡️ Transaction cancelled in Trust Wallet');
        } else if (error.message?.includes('insufficient funds')) {
          toast.error('🛡️ Insufficient BNB in Trust Wallet. Make sure you have enough for gas fees.');
        } else if (error.message?.includes('internal error')) {
          // Показываем кнопку retry для Trust Wallet при internal error
          toast.error(
            <div>
              <div>🛡️ Trust Wallet internal error detected!</div>
              <button 
                onClick={retryTransactionForTrustWallet}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  background: '#3375BB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                🔄 Retry with Trust Wallet Fix
              </button>
            </div>,
            {
              autoClose: false, // Не закрываем автоматически
              closeOnClick: false,
            }
          );
        } else {
          toast.error(`🛡️ Trust Wallet error: ${error.message || 'Please try again with a smaller amount'}`);
        }
      } else if (isBinanceWalletDetected && error.message?.includes('User denied')) {
        toast.warning('🔶 Transaction cancelled in Binance Wallet');
      } else if (error.code === 4001) {
        toast.warning('Transaction cancelled by user');
      } else if (error.code === -32002) {
        toast.error('Wallet is busy. Please try again.');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient BNB balance for transaction + gas fees');
      } else {
        toast.error(`Transaction failed: ${error.message || 'Unknown error'}`);
      }
    }
  };
  const checkBSCNetworkStatus = async (): Promise<boolean> => {
    try {
      const response = await fetch('https://bsc-dataseed1.binance.org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1,
        }),
      });
      
      const data = await response.json();
      return data.result === '0x38'; // BSC chainId
    } catch (error) {
      console.error('BSC network check failed:', error);
      return false;
    }
  };
  
  // 6. Добавьте специальный useEffect для Trust Wallet
  useEffect(() => {
    if (isConnected && isTrustWallet()) {
      console.log('Trust Wallet detected, applying optimizations...');
      
      // Показываем специальные инструкции для Trust Wallet
      const trustWalletTimeout = setTimeout(() => {
        toast.info('🛡️ Trust Wallet Tips: Make sure you have enough BNB for gas fees (~0.001 BNB)', {
          autoClose: 6000,
        });
      }, 2000);
      
      return () => clearTimeout(trustWalletTimeout);
    }
  }, [isConnected, connector]);
  
 
  // Повторная попытка обработки транзакции
  const retryPendingTransaction = (tx: PendingTransaction) => {
    console.log('Retrying pending transaction:', tx.txHash);
    
    processTransactionWithBackend(tx.txHash, tx.amount)
      .catch(error => {
        console.error('Retry failed:', error);
        toast.error('Retry failed. Please contact support with your transaction hash.');
      });
  };

  // Расчет токенов
  const calculateTokens = () => {
    if (!validateAmount(buyAmount)) return '0';
    
    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0 || tokensPerBnb <= 0) return '0';
  
    const tokensReceived = amount * tokensPerBnb;
    return Math.floor(tokensReceived).toLocaleString();
  };

  // Effect для обработки успешных транзакций
  useEffect(() => {
    if (isReceiptSuccess && txReceipt && txHash) {
      console.log('Transaction confirmed:', txHash);
      
      // Добавляем в отложенные для обработки
      addPendingTransaction({
        txHash,
        amount: buyAmount,
        userAddress: address || '',
        walletType: connector?.name || 'unknown'
      });

      toast.success(`✅ Transaction confirmed! Hash: ${txHash.slice(0, 10)}...`);
      
      // Обрабатываем на бэкенде с задержкой для Binance Wallet
      setTimeout(() => {
        processTransactionWithBackend(txHash, buyAmount)
          .catch(error => {
            console.error('Backend processing failed:', error);
          });
      }, isBinanceWalletDetected ? 2000 : 1000);

      setIsSubmitting(false);
    }
  }, [isReceiptSuccess, txReceipt, txHash, buyAmount, address, processTransactionWithBackend, connector, isBinanceWalletDetected]);

  // Effect для обработки ошибок транзакций
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

  // Effect для обработки ошибок получения квитанции
  useEffect(() => {
    if (isReceiptError) {
      console.error('Receipt error');
      setIsSubmitting(false);
      toast.error('Transaction failed to confirm. Please check your wallet.');
    }
  }, [isReceiptError]);

  // Инициализация компонента
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
            {isBinanceWalletDetected ? '🔶' : '🌈'} Connected: {address.slice(0, 6)}...{address.slice(-4)}
            <div style={{ fontSize: '0.8rem', color: '#00D4AA', marginTop: '4px' }}>
              Wallet: {connector?.name} {isBinanceWalletDetected && '(Binance)'} {!isOnBSC && <span style={{ color: '#ff6b6b' }}>⚠️ Switch to BSC</span>}
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
          </div>
        )}

        {/* Transaction Status */}
        {isTransactionInProgress && (
          <div className={styles.transactionStatus}>
            {isTxPending && (
              <div className={styles.statusItem}>
                {isBinanceWalletDetected ? '🔶 Confirm in Binance Wallet...' : '🔄 Waiting for wallet confirmation...'}
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
                isTxPending ? (isBinanceWalletDetected ? '🔶 Confirm in Binance Wallet...' : '🔄 Confirm in Wallet...') : 
                isReceiptLoading ? '⏳ Confirming on BSC...' : 
                '🔄 Processing...'
              ) : !isOnBSC ? (
                '⚠️ Switch to BSC Network'
              ) : !validateAmount(buyAmount) ? (
                '❌ Invalid Amount'
              ) : (
                isBinanceWalletDetected ? '🔶 Buy with Binance Wallet' : '🚀 Buy with Wagmi'
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
          </>
        )}
      </div>
    </motion.div>
  );
};

export default WagmiPresalePurchase;