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

// Функция для безопасного преобразования в BigInt
const safeStringToBigInt = (value: string): string => {
  try {
    // Убираем все лишние символы и нормализуем
    const cleanValue = value.replace(/[^\d.]/g, '').trim();
    
    if (!cleanValue || cleanValue === '0' || cleanValue === '0.0') {
      return '0x0';
    }
    
    // Конвертируем в число с проверкой
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue) || numValue <= 0) {
      throw new Error('Invalid numeric value');
    }
    
    // Конвертируем в wei (умножаем на 10^18)
    const weiValue = Math.floor(numValue * 1e18);
    if (weiValue <= 0) {
      throw new Error('Value too small');
    }
    
    // Конвертируем в hex безопасно
    const hexValue = '0x' + weiValue.toString(16);
    console.log(`Value conversion: ${cleanValue} -> ${numValue} -> ${weiValue} -> ${hexValue}`);
    
    return hexValue;
  } catch (error) {
    console.error('Error converting value to BigInt:', error);
    throw new Error(`Failed to parse amount: ${value}`);
  }
};

// Улучшенная версия MetaMaskMobileIntegration с исправлениями
class MetaMaskMobileIntegration {
  private sdk: any = null;
  private isMobile: boolean = false;
  private isInAppBrowser: boolean = false;
  private connectionAttempted: boolean = false;

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
           ua.includes('micromessenger');
  }

  private async initSDK() {
    try {
      if (typeof window !== 'undefined') {
        const MetaMaskSDK = (await import('@metamask/sdk')).default;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Initializing MetaMask SDK:', {
            isMobile: this.isMobile,
            isInAppBrowser: this.isInAppBrowser,
            userAgent: navigator.userAgent
          });
        }
        
        this.sdk = new MetaMaskSDK({
          dappMetadata: {
            name: "CrazyFox Presale",
            url: window.location.host,
            iconUrl: window.location.origin + '/favicon.ico'
          },
          ...(this.isMobile && {
            communicationLayerPreference: 'socket' as CommunicationLayerPreference
          }),
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

        this.sdk.on('_initialized', () => {
          console.log('MetaMask SDK initialized successfully');
        });

        this.sdk.on('connecting', () => {
          console.log('Connecting to MetaMask...');
        });

        this.sdk.on('connected', () => {
          console.log('Connected to MetaMask');
        });

        this.sdk.on('disconnected', () => {
          console.log('Disconnected from MetaMask');
        });
      }
    } catch (error) {
      console.error('Failed to initialize MetaMask SDK:', error);
    }
  }

  // Проверка подключения перед транзакцией
  async ensureConnection(userAddress: string): Promise<boolean> {
    try {
      console.log('Ensuring connection for address:', userAddress);
      
      // Проверяем window.ethereum
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const connectedAccount = accounts[0]?.toLowerCase();
        const expectedAccount = userAddress.toLowerCase();
        
        console.log('Connection check:', { connectedAccount, expectedAccount, match: connectedAccount === expectedAccount });
        
        if (connectedAccount === expectedAccount) {
          return true; // Уже подключен правильный аккаунт
        }
        
        // Если аккаунты не совпадают, запрашиваем подключение
        if (!this.connectionAttempted) {
          console.log('Requesting account connection...');
          this.connectionAttempted = true;
          
          const newAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const newConnectedAccount = newAccounts[0]?.toLowerCase();
          
          return newConnectedAccount === expectedAccount;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }

  async sendBNBTransaction(recipient: string, amount: string, userAddress: string) {
    console.log('Starting transaction:', { recipient, amount, userAddress, isMobile: this.isMobile });

    try {
      // 1. Проверяем и безопасно конвертируем сумму
      const hexValue = safeStringToBigInt(amount);
      
      // 2. Убеждаемся в правильном подключении
      const isConnected = await this.ensureConnection(userAddress);
      if (!isConnected && !this.isMobile) {
        throw new Error('MetaMask not connected to the correct account');
      }

      // 3. На мобильных устройствах всегда пробуем provider сначала
      if (this.isMobile && window.ethereum) {
        console.log('Mobile device with injected provider detected');
        try {
          return await this.sendViaProvider(recipient, amount, userAddress, hexValue);
        } catch (error: any) {
          console.log('Provider method failed:', error.message);
          if (error.code === 4001) {
            throw error; // Пользователь отклонил
          }
          console.log('Falling back to deep link method...');
          return this.sendViaDeepLink(recipient, amount, userAddress, hexValue);
        }
      }
      
      // 4. Если нет injected provider на мобильном устройстве
      if (this.isMobile && !window.ethereum) {
        console.log('Mobile device without injected provider, using deep link...');
        return this.sendViaDeepLink(recipient, amount, userAddress, hexValue);
      }
      
      // 5. Десктоп версия
      if (!this.isMobile) {
        console.log('Desktop device, using provider...');
        return this.sendViaProvider(recipient, amount, userAddress, hexValue);
      }

      throw new Error('No suitable transaction method available');
    } catch (error: any) {
      // Улучшенная обработка ошибок парсинга
      if (error.message.includes('Failed to parse amount')) {
        throw new Error(`Invalid amount format: ${amount}. Please enter a valid number.`);
      }
      throw error;
    }
  }

  private async sendViaDeepLink(recipient: string, amount: string, userAddress: string, hexValue: string) {
    const expectedTx = { 
      recipient, 
      amount, 
      userAddress, 
      timestamp: Date.now() 
    };
    localStorage.setItem('expectedTransaction', JSON.stringify(expectedTx));

    console.log('Preparing deep link transaction:', { recipient, amount, hexValue });

    const strategies = [
      // 1. Попробуем через MetaMask SDK
      async () => {
        if (this.sdk && this.sdk.connect) {
          console.log('Trying SDK connect method...');
          try {
            await this.sdk.connect();
            const provider = this.sdk.getProvider();
            if (provider) {
              return await this.sendViaProvider(recipient, amount, userAddress, hexValue);
            }
          } catch (error) {
            console.log('SDK connect failed:', error);
            throw error;
          }
        }
        throw new Error('SDK not available');
      },
      
      // 2. Стандартные MetaMask deep links
      async () => {
        console.log('Trying standard MetaMask deep links...');
        const nativeLinks = [
          `metamask://send?to=${recipient}&value=${hexValue}&chainId=0x38`,
          `https://metamask.app.link/send/${recipient}@56?value=${hexValue}`,
        ];

        if (this.isInAppBrowser) {
          window.open(nativeLinks[0], '_blank');
        } else {
          window.location.href = nativeLinks[0];
        }

        return this.waitForTransactionReturn();
      },
      
      // 3. Ethereum URI scheme
      async () => {
        console.log('Trying Ethereum URI scheme...');
        const ethereumUri = `ethereum:${recipient}@56/transfer?value=${hexValue}`;
        
        if (this.isInAppBrowser) {
          window.open(ethereumUri, '_blank');
        } else {
          window.location.href = ethereumUri;
        }
        
        return this.waitForTransactionReturn();
      }
    ];

    // Пробуем стратегии по очереди
    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`Trying strategy ${i + 1}/${strategies.length}`);
        const result = await strategies[i]();
        
        if (result && !result.cancelled && !result.timeout) {
          return result;
        }
        
        if (i < strategies.length - 1) {
          console.log(`Strategy ${i + 1} didn't work, trying next...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.log(`Strategy ${i + 1} failed:`, error);
        if (i === strategies.length - 1) {
          throw error;
        }
      }
    }

    return this.waitForTransactionReturn();
  }

  private async sendViaProvider(recipient: string, amount: string, userAddress: string, hexValue: string) {
    let provider = this.sdk?.getProvider();
    
    if (!provider && window.ethereum) {
      provider = window.ethereum;
    }

    if (!provider) {
      throw new Error('No MetaMask provider available');
    }

    console.log('Sending via provider:', { recipient, amount, userAddress, hexValue });

    try {
      // Проверяем аккаунты
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (accounts.length === 0 || accounts[0].toLowerCase() !== userAddress.toLowerCase()) {
        console.log('Account mismatch, requesting connection...');
        const newAccounts = await provider.request({ method: 'eth_requestAccounts' });
        
        if (newAccounts[0].toLowerCase() !== userAddress.toLowerCase()) {
          throw new Error('Connected account does not match expected account');
        }
      }

      // Проверяем сеть
      const chainId = await provider.request({ method: 'eth_chainId' });
      if (chainId !== '0x38') {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }],
          });
        } catch (switchError: any) {
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
      const maxChecks = 300;
      let hasReturned = false;

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && !hasReturned) {
          hasReturned = true;
          console.log('User returned to app');
          
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
          }, 3000);
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
      let provider = window.ethereum;
      if (!provider && this.sdk) {
        provider = this.sdk.getProvider();
      }

      if (!provider) {
        console.log('No provider available for verification');
        return { pending: true, message: 'Provider not available for verification' };
      }

      const accounts = await provider.request({
        method: 'eth_accounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const userAccount = accounts[0].toLowerCase();
      console.log('Checking transactions for account:', userAccount);
      
      const latestBlockHex = await provider.request({
        method: 'eth_blockNumber'
      });
      
      const latestBlock = parseInt(latestBlockHex, 16);
      const blocksToCheck = 10;
      
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

  public async verifyExpectedTransactionPublic(): Promise<any> {
    return this.verifyExpectedTransaction();
  }

  public async checkMetaMaskAvailability(): Promise<boolean> {
    try {
      if (window.ethereum) {
        const isMetaMask = window.ethereum.isMetaMask;
        console.log('MetaMask availability check:', { 
          hasEthereum: true, 
          isMetaMask,
          networkVersion: window.ethereum.networkVersion 
        });
        return true;
      }
      
      if (this.sdk) {
        const provider = this.sdk.getProvider();
        console.log('SDK provider check:', { hasProvider: !!provider });
        return !!provider;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking MetaMask availability:', error);
      return false;
    }
  }

  public async forceConnect(): Promise<any> {
    try {
      if (window.ethereum) {
        console.log('Attempting to connect via window.ethereum...');
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        console.log('Connected accounts:', accounts);
        return accounts;
      }
      
      if (this.sdk) {
        console.log('Attempting to connect via SDK...');
        await this.sdk.connect();
        const provider = this.sdk.getProvider();
        if (provider) {
          const accounts = await provider.request({ 
            method: 'eth_requestAccounts' 
          });
          console.log('SDK connected accounts:', accounts);
          return accounts;
        }
      }
      
      throw new Error('No connection method available');
    } catch (error) {
      console.error('Force connect failed:', error);
      throw error;
    }
  }

  clearExpectedTransaction() {
    localStorage.removeItem('expectedTransaction');
  }

  // Сброс флага попытки подключения
  resetConnectionState() {
    this.connectionAttempted = false;
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

  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  // Функция валидации ввода
  const validateAmount = (value: string): boolean => {
    if (!value || value.trim() === '') return false;
    
    const cleanValue = value.replace(',', '.');
    const numValue = parseFloat(cleanValue);
    
    return !isNaN(numValue) && numValue > 0 && numValue <= 100;
  };

  // Функция для безопасного обновления суммы
  const handleAmountChange = (value: string) => {
    // Разрешаем только цифры, точки и запятые
    const cleanValue = value.replace(/[^0-9.,]/g, '');
    setBuyAmount(cleanValue);
  };

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

  const processTransactionWithBackend = useCallback(async (txHash: string, amount: string) => {
    try {
      console.log('Processing transaction with backend:', txHash);
      
      if (isMobile) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      const payload = {
        txHash: txHash,
        userAddress: account?.address || '',
        amountSent: amount.replace(',', '.'),
        symbol: 'BNB',
        platform: isMobile ? 'mobile' : 'desktop',
        userAgent: navigator.userAgent
      };

      console.log('Sending payload to backend:', payload);

      const result = await executeApiWithRetry(API_ENDPOINTS.verifyAndDistribute, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': navigator.userAgent,
          'X-Platform': isMobile ? 'mobile' : 'desktop'
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

  useEffect(() => {
    if (!metamaskIntegration) return;

    const expected = localStorage.getItem('expectedTransaction');
    if (expected) {
      console.log('🐾 Detected pending tx on load, will verify...');
      
      const delay = isMobile ? 5000 : 2000;
      setTimeout(() => verifyReturnedTransaction(), delay);
    }

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

    // Улучшенная валидация суммы
    if (!validateAmount(buyAmount)) {
      toast.error('Please enter a valid amount (0.01 - 100 BNB)');
      return;
    }

    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (amount < 0.01) {
      toast.error('Minimum amount is 0.01 BNB');
      return;
    }

    if (amount > 100) {
      toast.error('Maximum amount is 100 BNB');
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
      
      // Сбрасываем состояние подключения для новой транзакции
      metamaskIntegration.resetConnectionState();
      
      const isAvailable = await metamaskIntegration.checkMetaMaskAvailability();
      console.log('MetaMask availability:', isAvailable);
      
      if (!isAvailable && isMobile) {
        console.log('MetaMask not available, trying to force connect...');
        try {
          await metamaskIntegration.forceConnect();
          toast.info('🔗 Connecting to MetaMask...');
        } catch (connectError) {
          console.log('Force connect failed, will try deep link method');
        }
      }
      
      if (isMobile) {
        toast.info('📱 Preparing mobile transaction... You may be redirected to MetaMask app.');
      }
      
      const result = await metamaskIntegration.sendBNBTransaction(
        contractAddress,
        buyAmount,
        account.address
      );

      console.log('Transaction result:', result);

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
        
        addPendingTransaction({
          txHash: result.txHash,
          to: contractAddress,
          amount: buyAmount,
          userAddress: account.address,
          method: result.method
        });

        setTimeout(() => {
          processTransactionWithBackend(result.txHash, buyAmount)
            .catch(error => {
              console.error('Backend processing failed:', error);
            });
        }, 2000);
      } else {
        if (isMobile) {
          toast.info('💫 Please complete the transaction in MetaMask app and return here.');
        }
      }

    } catch (error: any) {
      console.error('Transaction error:', error);
      
      if (error.code === 4001) {
        toast.warning('Transaction cancelled by user');
      } else if (error.code === -32002) {
        toast.error('MetaMask is busy. Please try again.');
      } else if (error.message?.includes('User rejected')) {
        toast.warning('Transaction was rejected');
      } else if (error.message?.includes('Invalid amount format')) {
        toast.error(error.message);
      } else if (error.message?.includes('Failed to parse amount')) {
        toast.error('Invalid amount format. Please enter a valid number.');
      } else {
        toast.error(`Transaction failed: ${error.message || 'Unknown error'}`);
        
        if (isMobile) {
          setTimeout(() => {
            toast.info('💡 If transaction failed, try opening MetaMask app first, then return here.');
          }, 2000);
        }
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
    if (!validateAmount(buyAmount)) return '0';
    
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
            {isMobile && !window.ethereum && (
              <div style={{ fontSize: '0.8rem', color: '#00D4AA', marginTop: '4px' }}>
                📱 Mobile Deep Link Mode
              </div>
            )}
            {isMobile && (
              <button 
                onClick={async () => {
                  if (metamaskIntegration) {
                    try {
                      const isAvailable = await metamaskIntegration.checkMetaMaskAvailability();
                      toast.info(`MetaMask ${isAvailable ? 'is available' : 'not detected'}`);
                    } catch (error) {
                      toast.error('Failed to check MetaMask');
                    }
                  }
                }}
                style={{
                  fontSize: '0.7rem',
                  padding: '4px 8px',
                  marginTop: '4px',
                  backgroundColor: 'rgba(0, 212, 170, 0.2)',
                  border: '1px solid #00D4AA',
                  borderRadius: '4px',
                  color: '#00D4AA',
                  cursor: 'pointer'
                }}
              >
                Test Connection
              </button>
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
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={isProcessing}
                className={styles.input}
                placeholder="0.0"
                min="0.01"
                max="100"
                step="0.01"
              />
              {!validateAmount(buyAmount) && buyAmount !== '' && (
                <div style={{ fontSize: '0.8rem', color: '#ff6b6b', marginTop: '4px' }}>
                  Please enter a valid amount (0.01 - 100 BNB)
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
              disabled={isProcessing || !isOnBSC || !validateAmount(buyAmount)}
              whileHover={{ scale: (isProcessing || !isOnBSC || !validateAmount(buyAmount)) ? 1 : 1.02 }}
              whileTap={{ scale: (isProcessing || !isOnBSC || !validateAmount(buyAmount)) ? 1 : 0.98 }}
              className={styles.buyButton}
            >
              {isProcessing ? (
                '🔄 Processing Transaction...'
              ) : !isOnBSC ? (
                '⚠️ Switch to BSC Network'
              ) : !validateAmount(buyAmount) ? (
                '❌ Invalid Amount'
              ) : (
                '🚀 Buy with MetaMask'
              )}
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default MobileMetaMaskPurchase;