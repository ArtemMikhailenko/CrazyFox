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
import { CommunicationLayerPreference } from '@metamask/sdk';

// MetaMask SDK for mobile integration
declare global {
  interface Window {
    MetaMaskSDK?: any;
  }
}

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

// Улучшенная версия MetaMaskMobileIntegration с исправлениями для мобильных устройств
class MetaMaskMobileIntegration {
  private sdk: any = null;
  private isMobile: boolean = false;
  private isInAppBrowser: boolean = false;

  constructor() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isInAppBrowser = this.detectInAppBrowser();
    this.initSDK();
  }

  private detectInAppBrowser(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('telegram') || 
           ua.includes('whatsapp') || 
           ua.includes('instagram') || 
           ua.includes('fbav') || 
           ua.includes('fban') ||
           ua.includes('line/') ||
           ua.includes('micromessenger'); // WeChat
  }

  private async initSDK() {
    try {
      if (typeof window !== 'undefined') {
        const MetaMaskSDK = (await import('@metamask/sdk')).default;
        
        this.sdk = new MetaMaskSDK({
          dappMetadata: {
            name: "CrazyFox Presale",
            url: window.location.host,
            iconUrl: window.location.origin + '/favicon.ico'
          },
          // Упрощенная конфигурация для совместимости
          ...(this.isMobile && {
            communicationLayerPreference: 'socket' as CommunicationLayerPreference
          }),
          // Добавляем обработчик deep links только если нужно
          ...(this.isMobile && {
            openDeeplink: (link: string) => {
              console.log('Opening deeplink:', link);
              if (this.isInAppBrowser) {
                window.open(link, '_blank');
              } else {
                window.location.href = link;
              }
            }
          })
        });

        // Слушаем события от SDK
        this.sdk.on('_initialized', () => {
          console.log('MetaMask SDK initialized');
        });

        this.sdk.on('connecting', () => {
          console.log('Connecting to MetaMask...');
        });
      }
    } catch (error) {
      console.error('Failed to initialize MetaMask SDK:', error);
    }
  }

  async sendBNBTransaction(recipient: string, amount: string, userAddress: string) {
    const amountFloat = parseFloat(amount.replace(',', '.'));

    console.log('Starting transaction:', { recipient, amount, userAddress, isMobile: this.isMobile });

    // Проверяем наличие MetaMask
    if (!window.ethereum && this.isMobile) {
      console.log('No injected provider found, using deep link');
      return this.sendViaDeepLink(recipient, amountFloat, userAddress);
    }

    // На мобильных устройствах всегда пробуем сначала injected provider
    if (this.isMobile) {
      try {
        return await this.sendViaProvider(recipient, amountFloat, userAddress);
      } catch (error) {
        console.log('Provider failed, falling back to deep link:', error);
        return this.sendViaDeepLink(recipient, amountFloat, userAddress);
      }
    } else {
      return this.sendViaProvider(recipient, amountFloat, userAddress);
    }
  }

  private async sendViaDeepLink(recipient: string, amount: number, userAddress: string) {
    const expectedTx = { 
      recipient, 
      amount: amount.toString(), 
      userAddress, 
      timestamp: Date.now() 
    };
    localStorage.setItem('expectedTransaction', JSON.stringify(expectedTx));

    const amountWei = (amount * 1e18).toString();
    const hexValue = '0x' + BigInt(amountWei).toString(16);

    // Улучшенная логика deep linking
    const nativeLinks = [
      // Основная схема MetaMask
      `metamask://send?to=${recipient}&value=${hexValue}&chainId=0x38`,
      // Альтернативная схема
      `https://metamask.app.link/send/${recipient}@56?value=${hexValue}`,
    ];

    // Пробуем разные методы открытия
    if (this.isInAppBrowser) {
      // В in-app браузерах используем window.open
      console.log('In-app browser detected, using window.open');
      window.open(nativeLinks[0], '_blank');
      
      // Fallback через небольшую задержку
      setTimeout(() => {
        window.open(nativeLinks[1], '_blank');
      }, 1000);
    } else {
      // В обычных браузерах используем location.href
      console.log('Regular mobile browser, using location.href');
      window.location.href = nativeLinks[0];
      
      setTimeout(() => {
        window.location.href = nativeLinks[1];
      }, 500);
    }

    return this.waitForTransactionReturn();
  }

  private async sendViaProvider(recipient: string, amount: number, userAddress: string) {
    // Получаем провайдера
    let provider = this.sdk?.getProvider();
    
    if (!provider && window.ethereum) {
      provider = window.ethereum;
    }

    if (!provider) {
      throw new Error('No MetaMask provider available');
    }

    console.log('Sending via provider:', { recipient, amount, userAddress });

    try {
      // Сначала проверяем подключение
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        // Запрашиваем подключение
        await provider.request({ method: 'eth_requestAccounts' });
      }

      // Проверяем сеть
      const chainId = await provider.request({ method: 'eth_chainId' });
      if (chainId !== '0x38') {
        // Предлагаем переключиться на BSC
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }],
          });
        } catch (switchError: any) {
          // Если сеть не добавлена, добавляем её
          if (switchError.code === 4902) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x38',
                chainName: 'BNB Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18
                },
                rpcUrls: ['https://bsc-dataseed1.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/']
              }]
            });
          } else {
            throw switchError;
          }
        }
      }

      // Отправляем транзакцию
      const amountWei = (amount * 1e18).toString();
      const hexValue = '0x' + BigInt(amountWei).toString(16);

      const txParams = {
        from: userAddress,
        to: recipient,
        value: hexValue,
        chainId: '0x38',
      };

      console.log('Sending transaction with params:', txParams);

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [txParams]
      });

      console.log('Transaction sent successfully:', txHash);
      return { txHash, method: 'provider' };

    } catch (error: any) {
      console.error('Provider transaction failed:', error);
      throw error;
    }
  }

  private waitForTransactionReturn(): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('Waiting for user to return from MetaMask...');
      
      let checkCount = 0;
      const maxChecks = 300; // 5 minutes
      let hasReturned = false;

      // Слушаем события возврата в приложение
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && !hasReturned) {
          hasReturned = true;
          console.log('User returned to app');
          
          // Даём время на загрузку и проверяем транзакцию
          setTimeout(async () => {
            try {
              const result = await this.verifyExpectedTransaction();
              clearInterval(checkInterval);
              document.removeEventListener('visibilitychange', handleVisibilityChange);
              resolve(result);
            } catch (error) {
              console.error('Transaction verification failed:', error);
              clearInterval(checkInterval);
              document.removeEventListener('visibilitychange', handleVisibilityChange);
              reject(error);
            }
          }, 3000); // Увеличена задержка для стабильности
        }
      };

      const handleFocus = () => {
        if (!hasReturned) {
          hasReturned = true;
          console.log('App gained focus');
          handleVisibilityChange();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      
      const checkInterval = setInterval(async () => {
        checkCount++;
        
        try {
          const expected = localStorage.getItem('expectedTransaction');
          if (!expected) {
            clearInterval(checkInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            resolve({ cancelled: true });
            return;
          }

          if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            console.log('Transaction timeout reached');
            resolve({ timeout: true });
          }
        } catch (error) {
          console.error('Check interval error:', error);
        }
      }, 1000);
    });
  }

  private async verifyExpectedTransaction(): Promise<any> {
    const expectedStr = localStorage.getItem('expectedTransaction');
    if (!expectedStr) {
      throw new Error('No expected transaction found');
    }

    const expected = JSON.parse(expectedStr);
    console.log('Verifying expected transaction:', expected);

    try {
      // Проверяем доступность провайдера
      let provider = window.ethereum;
      if (!provider && this.sdk) {
        provider = this.sdk.getProvider();
      }

      if (!provider) {
        console.log('No provider available for verification');
        return { pending: true, message: 'Provider not available for verification' };
      }

      // Получаем аккаунты
      const accounts = await provider.request({
        method: 'eth_accounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const userAccount = accounts[0].toLowerCase();
      console.log('Checking transactions for account:', userAccount);
      
      // Проверяем последние блоки
      const latestBlockHex = await provider.request({
        method: 'eth_blockNumber'
      });
      
      const latestBlock = parseInt(latestBlockHex, 16);
      const blocksToCheck = 10; // Проверяем больше блоков
      
      console.log(`Checking last ${blocksToCheck} blocks from ${latestBlock}`);

      for (let i = 0; i < blocksToCheck; i++) {
        const blockNumber = '0x' + (latestBlock - i).toString(16);
        
        try {
          const block = await provider.request({
            method: 'eth_getBlockByNumber',
            params: [blockNumber, true]
          });

          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (tx.from?.toLowerCase() === userAccount &&
                  tx.to?.toLowerCase() === expected.recipient.toLowerCase()) {
                
                console.log('Found matching transaction:', tx.hash);
                localStorage.removeItem('expectedTransaction');
                
                return {
                  txHash: tx.hash,
                  method: 'deeplink',
                  verified: true
                };
              }
            }
          }
        } catch (blockError) {
          console.error(`Error checking block ${blockNumber}:`, blockError);
        }
      }

      // Также проверяем pending транзакции
      try {
        const pendingTxs = await provider.request({
          method: 'eth_pendingTransactions'
        });

        if (pendingTxs && Array.isArray(pendingTxs)) {
          for (const tx of pendingTxs) {
            if (tx.from?.toLowerCase() === userAccount &&
                tx.to?.toLowerCase() === expected.recipient.toLowerCase()) {
              
              console.log('Found pending transaction:', tx.hash);
              localStorage.removeItem('expectedTransaction');
              
              return {
                txHash: tx.hash,
                method: 'deeplink',
                verified: true,
                pending: true
              };
            }
          }
        }
      } catch (pendingError) {
        console.log('Could not check pending transactions:', pendingError);
      }

      console.log('Transaction not found in recent blocks');
      return {
        pending: true,
        message: 'Transaction not found, might be pending'
      };

    } catch (error) {
      console.error('Transaction verification error:', error);
      throw error;
    }
  }

  // Публичный метод для верификации
  public async verifyExpectedTransactionPublic(): Promise<any> {
    return this.verifyExpectedTransaction();
  }

  clearExpectedTransaction() {
    localStorage.removeItem('expectedTransaction');
  }
}

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
  const [metamaskIntegration, setMetamaskIntegration] = useState<MetaMaskMobileIntegration | null>(null);

  // Refs to prevent state issues during async operations
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  // Функция для верификации возвращённой транзакции
  const verifyReturnedTransaction = useCallback(async () => {
    if (!metamaskIntegration) return;
    
    try {
      console.log('Verifying returned transaction...');
      const result = await metamaskIntegration.verifyExpectedTransactionPublic();
      
      if (result.txHash) {
        toast.success('🎉 Transaction found! Processing...');
        const expectedData = localStorage.getItem('expectedTransaction');
        const amount = expectedData ? JSON.parse(expectedData).amount : buyAmount;
        await processTransactionWithBackend(result.txHash, amount);
      } else if (result.pending) {
        toast.info('Transaction is pending confirmation...');
      }
    } catch (error) {
      console.error('Failed to verify returned transaction:', error);
      toast.error('Could not verify transaction. Please check manually.');
    }
  }, [metamaskIntegration, buyAmount]);

  // Mobile-optimized backend call
  const processTransactionWithBackend = useCallback(async (txHash: string, amount: string) => {
    try {
      console.log('Processing transaction with backend:', txHash);
      
      // Добавляем дополнительную задержку для мобильных устройств
      if (isMobile) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      const payload = {
        txHash: txHash,
        userAddress: account?.address || '',
        amountSent: amount.replace(',', '.'),
        symbol: 'BNB',
        // Добавляем информацию о платформе
        platform: isMobile ? 'mobile' : 'desktop',
        userAgent: navigator.userAgent
      };

      console.log('Sending payload to backend:', payload);

      const result = await executeApiWithRetry(API_ENDPOINTS.verifyAndDistribute, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          // Добавляем заголовки для мобильных устройств
          'User-Agent': navigator.userAgent,
          'X-Platform': isMobile ? 'mobile' : 'desktop'
        }
      }, 5); // Увеличиваем количество попыток

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
        userAddress: account?.address,
        timestamp: Date.now(),
        status: 'failed',
        error: error.message
      };
      
      const failed = JSON.parse(localStorage.getItem('failedTransactions') || '[]');
      failed.push(failedTx);
      localStorage.setItem('failedTransactions', JSON.stringify(failed));
      
      throw error;
    }
  }, [account, isMobile]);

  // Основной useEffect для инициализации
  useEffect(() => {
    setIsClient(true);
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    localStorage.removeItem('expectedTransaction');

    const integration = new MetaMaskMobileIntegration();
    setMetamaskIntegration(integration);

    fetchContractAddress();
    fetchTokenPrice();
    loadPendingTransactions();

    return () => { 
      mountedRef.current = false; 
    };
  }, []);

  // useEffect для обработки pending транзакций при загрузке
  useEffect(() => {
    if (!metamaskIntegration) return;

    // Проверяем pending транзакцию при загрузке
    const expected = localStorage.getItem('expectedTransaction');
    if (expected) {
      console.log('🐾 Detected pending tx on load, will verify...');
      
      // Увеличиваем задержку для мобильных устройств
      const delay = isMobile ? 5000 : 2000;
      setTimeout(() => verifyReturnedTransaction(), delay);
    }

    // Слушаем события возврата в приложение
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const expected = localStorage.getItem('expectedTransaction');
        if (expected && metamaskIntegration) {
          console.log('App became visible with pending transaction');
          setTimeout(() => verifyReturnedTransaction(), 2000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [metamaskIntegration, isMobile, verifyReturnedTransaction]);

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

    if (!metamaskIntegration) {
      toast.error('MetaMask integration not ready');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    try {
      console.log('Starting mobile-optimized transaction...');
      
      const result = await metamaskIntegration.sendBNBTransaction(
        contractAddress,
        buyAmount,
        account.address
      );

      if (result.cancelled) {
        toast.info('Transaction was cancelled');
        return;
      }

      if (result.timeout) {
        toast.warning('Transaction timeout. Please check MetaMask manually.');
        return;
      }

      if (result.pending) {
        toast.info('Transaction is pending. Will process when confirmed.');
        return;
      }

      if (result.txHash) {
        console.log('Transaction successful:', result.txHash);
        
        toast.success(`🎉 Transaction sent! Hash: ${result.txHash.slice(0, 10)}...`);
        
        // Add to pending transactions
        addPendingTransaction({
          txHash: result.txHash,
          to: contractAddress,
          amount: buyAmount,
          userAddress: account.address,
          method: result.method
        });

        // Process with backend
        setTimeout(() => {
          processTransactionWithBackend(result.txHash, buyAmount)
            .catch(error => {
              console.error('Backend processing failed:', error);
            });
        }, 2000);
      }

    } catch (error: any) {
      console.error('Transaction error:', error);
      
      if (error.code === 4001) {
        toast.warning('Transaction cancelled by user');
      } else if (error.code === -32002) {
        toast.error('MetaMask is busy. Please try again.');
      } else {
        toast.error(`Transaction failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
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
    // Более точная калькуляция для маленьких сумм
    if (tokensReceived < 1) {
      return tokensReceived.toFixed(4);
    } else if (tokensReceived < 100) {
      return tokensReceived.toFixed(2);
    } else {
      return Math.floor(tokensReceived).toLocaleString();
    }
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
            {isMobile && !window.ethereum && (
              <div style={{ fontSize: '0.8rem', color: '#00D4AA', marginTop: '4px' }}>
                📱 Mobile Deep Link Mode
              </div>
            )}
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
                <div className={styles.pendingMethod}>Method: {tx.method || 'provider'}</div>
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
                {isMobile ? (
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.installLink}
                  >
                    Download MetaMask App
                  </a>
                ) : (
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.installLink}
                  >
                    Install MetaMask Extension
                  </a>
                )}
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