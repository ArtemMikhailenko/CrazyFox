// components/MobileMetaMaskPurchase.tsx - Enhanced with mobile purchase functionality
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

// Множественные BSC RPC endpoints для fallback
const BSC_RPC_ENDPOINTS = [
  'https://bsc-dataseed.binance.org/',
  'https://bsc-dataseed1.defibit.io/',
  'https://bsc-dataseed1.ninicoin.io/',
  'https://rpc.ankr.com/bsc'
];

// Класс для продвинутого polling транзакций
class BSCTransactionPoller {
  private currentProviderIndex = 0;
  private providers: string[];

  constructor() {
    this.providers = BSC_RPC_ENDPOINTS;
  }

  getCurrentProvider() {
    return this.providers[this.currentProviderIndex];
  }

  switchProvider() {
    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
  }

  async pollTransactionWithFallback(txHash: string, maxAttempts = 60, interval = 5000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Пробуем все providers при каждой попытке
      for (let providerAttempt = 0; providerAttempt < this.providers.length; providerAttempt++) {
        try {
          const provider = this.getCurrentProvider();
          const response = await fetch(provider, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getTransactionReceipt',
              params: [txHash],
              id: 1
            })
          });

          const data = await response.json();
          
          if (data.result) {
            return {
              success: true,
              receipt: data.result,
              blockNumber: data.result.blockNumber,
              gasUsed: data.result.gasUsed,
              status: data.result.status === '0x1'
            };
          }

          // Проверяем, существует ли транзакция в mempool
          const txResponse = await fetch(provider, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getTransactionByHash',
              params: [txHash],
              id: 2
            })
          });

          const txData = await txResponse.json();
          if (txData.result && txData.result.blockNumber) {
            console.log(`✅ Transaction ${txHash} mined in block ${txData.result.blockNumber}, waiting for receipt...`);
          }

        } catch (error) {
          console.error(`🔄 Provider ${providerAttempt} failed:`, error);
          this.switchProvider();
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    return { success: false, error: 'Transaction polling timeout' };
  }

  // Мониторинг адреса пользователя для поиска новых транзакций
  async scanAddressForTransactions(address: string, contractAddress: string, amount: string) {
    for (let providerIndex = 0; providerIndex < this.providers.length; providerIndex++) {
      try {
        const provider = this.providers[providerIndex];
        
        // Получаем последний блок
        const latestBlockResponse = await fetch(provider, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: ['latest', true],
            id: 1
          })
        });

        const latestBlockData = await latestBlockResponse.json();
        
        if (latestBlockData.result?.transactions) {
          // Ищем транзакцию пользователя
          const userTx = latestBlockData.result.transactions.find((tx: any) => 
            tx.from?.toLowerCase() === address.toLowerCase() &&
            tx.to?.toLowerCase() === contractAddress.toLowerCase() &&
            tx.value === amount
          );
          
          if (userTx) {
            console.log('🎯 Found user transaction by address scanning:', userTx.hash);
            return userTx.hash;
          }
        }

        // Проверяем несколько предыдущих блоков
        const currentBlockNumber = parseInt(latestBlockData.result.number, 16);
        for (let i = 1; i <= 5; i++) {
          const blockNumber = '0x' + (currentBlockNumber - i).toString(16);
          
          const blockResponse = await fetch(provider, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getBlockByNumber',
              params: [blockNumber, true],
              id: 1
            })
          });

          const blockData = await blockResponse.json();
          
          if (blockData.result?.transactions) {
            const userTx = blockData.result.transactions.find((tx: any) => 
              tx.from?.toLowerCase() === address.toLowerCase() &&
              tx.to?.toLowerCase() === contractAddress.toLowerCase() &&
              tx.value === amount
            );
            
            if (userTx) {
              console.log('🎯 Found user transaction in recent blocks:', userTx.hash);
              return userTx.hash;
            }
          }
        }

      } catch (error) {
        console.error(`🔄 Address scanning failed for provider ${providerIndex}:`, error);
      }
    }
    
    return null;
  }
}

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
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastBalance, setLastBalance] = useState<string>('0');

  const poller = new BSCTransactionPoller();

  useEffect(() => {
    setIsClient(true);
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    fetchContractAddress();
    fetchTokenPrice();
    checkPendingTransaction();

    if (account?.address) {
      trackUserBalance();
    }

    // Очистка при размонтировании
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [account?.address]);

  const fetchContractAddress = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.getTransferAddress);
      if (response.ok) {
        const data = await response.text();
        const cleanAddress = data.replace(/['"]/g, '').trim();
        setContractAddress(cleanAddress);
        console.log('✅ Contract address loaded:', cleanAddress);
      } else {
        setContractAddress("0xa2c959a7Fbf6d96eA4170e724D871E0556cd8556");
      }
    } catch (error) {
      console.error('Error fetching contract address:', error);
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
          console.log('✅ Tokens per BNB loaded:', tokensAmount);
        }
      }
    } catch (error) {
      console.error('Error fetching token price:', error);
    }
  };

  // Отслеживание баланса пользователя для определения новых транзакций
  const trackUserBalance = useCallback(async () => {
    if (!account?.address) return;

    try {
      const response = await fetch(BSC_RPC_ENDPOINTS[0], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [account.address, 'latest'],
          id: 1
        })
      });

      const data = await response.json();
      const currentBalance = data.result;

      if (lastBalance !== '0' && currentBalance !== lastBalance) {
        console.log('💰 Balance changed! Scanning for new transactions...');
        
        // Запускаем сканирование транзакций при изменении баланса
        if (pendingTransaction) {
          const foundTxHash = await poller.scanAddressForTransactions(
            account.address,
            contractAddress,
            pendingTransaction.value
          );
          
          if (foundTxHash) {
            console.log('🎯 Found transaction hash from balance change:', foundTxHash);
            await sendTransactionToBackend(foundTxHash);
          }
        }
      }

      setLastBalance(currentBalance);
    } catch (error) {
      console.error('Balance tracking error:', error);
    }
  }, [account?.address, contractAddress, lastBalance, pendingTransaction]);

  const checkPendingTransaction = () => {
    if (typeof window === 'undefined') return;
    
    const pendingTx = localStorage.getItem('pendingTransaction');
    if (pendingTx) {
      try {
        const txData = JSON.parse(pendingTx);
        const timeDiff = Date.now() - txData.timestamp;
        if (timeDiff < 15 * 60 * 1000) {
          setPendingTransaction(txData);
          startAdvancedTransactionSearch(txData);
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

      console.log('📤 Sending transaction hash to backend:', payload);

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
        console.error('Backend processing failed. Contact support with hash: ' + txHash);
      }
    } catch (error) {
      console.error('Error processing transaction. Please contact support.');
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
        // Fallback к deep link только если нет ethereum provider
        await handleDeepLinkSend(hexValue, amount);
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed: ' + (error.message || 'Unknown error'));
      setIsProcessing(false);
    }
  };

  // НОВЫЙ МЕТОД: Прямая отправка транзакции через provider
  const handleDirectTransaction = async (hexValue: string, amount: number) => {
    try {
      const transactionParams = {
        from: account?.address,
        to: contractAddress,
        value: hexValue,
        gas: '0x5208',
      };

      console.log('🚀 Sending transaction directly through provider...');

      // Сохраняем данные транзакции ДО отправки
      const tempTransactionData = {
        to: contractAddress,
        value: hexValue,
        amount: amount.toString(),
        timestamp: Date.now(),
        userAddress: account?.address,
        symbol: 'BNB',
        status: 'preparing'
      };
      
      localStorage.setItem('pendingTransaction', JSON.stringify(tempTransactionData));
      setPendingTransaction(tempTransactionData);

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParams],
      });

      console.log('✅ Transaction sent with hash:', txHash);
      setTransactionHash(txHash);
      
      // Обновляем данные транзакции с полученным хешем
      const transactionData = {
        ...tempTransactionData,
        txHash: txHash,
        status: 'pending'
      };
      
      localStorage.setItem('pendingTransaction', JSON.stringify(transactionData));
      setPendingTransaction(transactionData);
      
      toast.success('🎉 Transaction sent! Hash: ' + txHash.slice(0, 10) + '...');
      
      // НЕМЕДЛЕННО отправляем хеш на бэкенд
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

  // УЛУЧШЕННЫЙ Deep Link с fallback для устройств без ethereum provider
  const handleDeepLinkSend = async (hexValue: string, amount: number) => {
    if (typeof window === 'undefined') return;
    
    try {
      console.log('📱 Using deep link fallback method...');
      
      // Создаем Deep Link
      const currentUrl = window.location.origin + window.location.pathname;
      const deepLinkUrl = [
        `https://metamask.app.link/send/0x${contractAddress.replace('0x','')}@56`,
        `?value=${hexValue}`,
        `&redirect=true`,
        `&redirectUrl=${encodeURIComponent(currentUrl)}`
      ].join('');
      
      console.log('🔗 Deep Link URL:', deepLinkUrl);
      
      // Сохраняем данные транзакции с дополнительной информацией
      const transactionData = {
        to: contractAddress,
        value: hexValue,
        amount: amount.toString(),
        timestamp: Date.now(),
        userAddress: account?.address,
        symbol: 'BNB',
        status: 'deeplink_sent'
      };
      
      localStorage.setItem('pendingTransaction', JSON.stringify(transactionData));
      setPendingTransaction(transactionData);
      
      toast.info('Opening MetaMask... Please confirm the transaction', { autoClose: 3000 });
      
      // Открываем MetaMask
      window.open(deepLinkUrl, '_blank');
      
      // Запускаем улучшенный поиск транзакции
      startAdvancedTransactionSearch(transactionData);
      
      setIsProcessing(false);
      
      toast.success('🚀 MetaMask opened! After confirming, return to this page.', { 
        autoClose: 8000 
      });

    } catch (error) {
      console.error('Deep link error:', error);
      toast.error('Failed to open MetaMask');
      setIsProcessing(false);
    }
  };

  // УЛУЧШЕННАЯ система поиска транзакций вместо polling
  const startAdvancedTransactionSearch = (txData: any) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    let attempts = 0;
    const maxAttempts = 180; // 15 минут при интервале 5 секунд
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        // Метод 1: Сканирование адреса пользователя
        const foundTxHash = await poller.scanAddressForTransactions(
          txData.userAddress,
          contractAddress,
          txData.value
        );
        
        if (foundTxHash) {
          console.log('🎯 Transaction found via address scanning!');
          clearPolling();
          await sendTransactionToBackend(foundTxHash);
          return;
        }
        
        // Метод 2: Проверка баланса
        await trackUserBalance();
        
        // Метод 3: Проверка фокуса страницы (пользователь вернулся)
        if (!document.hidden && attempts % 6 === 0) { // каждые 30 секунд
          console.log('👁️ User is active, intensifying search...');
          
          // Дополнительная проверка через несколько провайдеров
          for (let i = 0; i < 3; i++) {
            const foundHash = await poller.scanAddressForTransactions(
              txData.userAddress,
              contractAddress,
              txData.value
            );
            
            if (foundHash) {
              clearPolling();
              await sendTransactionToBackend(foundHash);
              return;
            }
          }
        }
        
      } catch (error) {
        console.error('Transaction search error:', error);
      }
      
      // Останавливаем после максимального количества попыток
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPollingInterval(null);
        toast.warning('⏰ Transaction monitoring stopped. Please check your wallet and contact support if needed.');
      }
    }, 5000);
    
    setPollingInterval(interval);
    
    // Слушаем изменения фокуса страницы
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ User returned to page, checking for transactions...');
        // Немедленная проверка при возврате
        poller.scanAddressForTransactions(
          txData.userAddress,
          contractAddress,
          txData.value
        ).then(foundHash => {
          if (foundHash) {
            clearPolling();
            sendTransactionToBackend(foundHash);
          }
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Очистка слушателя через 15 минут
    setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, 15 * 60 * 1000);
  };

  // Очистка polling
  const clearPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const clearPendingTransaction = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pendingTransaction');
    }
    setPendingTransaction(null);
    clearPolling();
  };

  // Ручная проверка транзакции
  const handleManualCheck = async () => {
    if (!pendingTransaction) return;
    
    toast.info('🔍 Scanning blockchain for your transaction...');
    
    try {
      const foundTxHash = await poller.scanAddressForTransactions(
        pendingTransaction.userAddress,
        contractAddress,
        pendingTransaction.value
      );
      
      if (foundTxHash) {
        await sendTransactionToBackend(foundTxHash);
      } else {
        toast.warning('Transaction not found yet. Please wait a bit more or contact support.');
      }
    } catch (error) {
      toast.error('Failed to check transaction. Please try again.');
    }
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

        {/* Enhanced Pending Transaction */}
        {pendingTransaction && (
          <div className={styles.pendingTransaction}>
            <div className={styles.pendingTitle}>
              ⏳ Transaction {pendingTransaction.txHash ? 'Pending' : 'Searching'}
            </div>
            <div className={styles.pendingAmount}>Amount: {pendingTransaction.amount} BNB</div>
            {pendingTransaction.txHash && (
              <div className={styles.pendingHash}>
                Hash: {pendingTransaction.txHash.slice(0, 10)}...
              </div>
            )}
            <div className={styles.pendingTime}>
              {Math.floor((Date.now() - pendingTransaction.timestamp) / 60000)} minutes elapsed
            </div>
            <div className={styles.pendingActions}>
              <button onClick={handleManualCheck} className={styles.checkButton}>
                🔍 Search Now
              </button>
              <button onClick={clearPendingTransaction} className={styles.cancelButton}>
                ❌ Cancel
              </button>
            </div>
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

            {/* Enhanced Buy Button */}
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
                `⏳ Transaction ${pendingTransaction.txHash ? 'Pending' : 'Searching'}`
              ) : window.ethereum ? (
                '🚀 Buy with MetaMask (Direct)'
              ) : (
                '📱 Buy with MetaMask (Mobile)'
              )}
            </motion.button>

            {/* Enhanced Instructions */}
            <div className={styles.instructions}>
              💡 {window.ethereum 
                ? 'Transaction will be sent directly through MetaMask and processed automatically.'
                : 'After confirming in MetaMask, return to this page. Your transaction will be automatically detected with advanced blockchain scanning.'
              }
            </div>

            {/* Technical Info */}
            {isMobile && (
              <div className={styles.technicalInfo}>
                ⚡ Enhanced mobile integration • Automatic transaction detection • Multiple BSC RPC fallbacks
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default MobileMetaMaskPurchase;