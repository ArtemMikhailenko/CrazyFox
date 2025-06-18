// components/MobileMetaMaskPurchase.tsx
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
import { bsc } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "d28d89a66e8eb5e73d6a9c8eeaa0645a"
});

// API endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crfx.org";
const API_ENDPOINTS = {
  getTransferAddress: `${API_BASE_URL}/getTransferAddress`,
  getPrice: `${API_BASE_URL}/getPrice`,
  verifyAndDistribute: `${API_BASE_URL}/verifyAndDistributeTokens`
};

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

const MobileMetaMaskPurchase = () => {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  
  const [buyAmount, setBuyAmount] = useState('0.1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [tokensPerBnb, setTokensPerBnb] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastBalance, setLastBalance] = useState<string>('0');

  const poller = new BSCTransactionPoller();

  useEffect(() => {
    setIsClient(true);
    
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    fetchContractAddress();
    fetchTokenPrice();
    checkPendingTransactionOnMount();
    
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

  // Получаем адрес контракта
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

  // Получаем количество токенов за 1 BNB
  const fetchTokenPrice = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.getPrice}?token=BNB`);
      if (response.ok) {
        const data = await response.text();
        const tokensAmount = parseFloat(data.trim());
        if (!isNaN(tokensAmount) && tokensAmount > 0) {
          setTokensPerBnb(tokensAmount);
          console.log('✅ Tokens per BNB loaded:', tokensAmount);
        } else {
          console.warn('⚠️ Invalid tokens per BNB, using fallback');
          setTokensPerBnb(60000);
        }
      }
    } catch (error) {
      console.error('Error fetching token price:', error);
      setTokensPerBnb(60000);
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

  // Проверка ожидающей транзакции при загрузке
  const checkPendingTransactionOnMount = () => {
    if (typeof window === 'undefined') return;
    
    const pendingTx = localStorage.getItem('pendingTransaction');
    if (pendingTx) {
      try {
        const txData = JSON.parse(pendingTx);
        setPendingTransaction(txData);
        
        // Если есть pending транзакция и прошло меньше 15 минут, начинаем улучшенный поиск
        const timeDiff = Date.now() - txData.timestamp;
        if (timeDiff < 15 * 60 * 1000) { // 15 минут
          startAdvancedTransactionSearch(txData);
        }
      } catch (error) {
        localStorage.removeItem('pendingTransaction');
      }
    }
  };

  // Отправка хеша транзакции на бэкенд
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.text();
        console.log('✅ Backend processing successful:', result);
        toast.success('🎉 Transaction processed successfully!');
        
        // Очищаем pending transaction
        clearPendingTransaction();
        
        // Конфетти!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        console.error('❌ Backend processing failed:', response.status);
        toast.error('Backend processing failed. Please contact support with transaction hash: ' + txHash);
      }
    } catch (error) {
      console.error('Backend request error:', error);
      toast.error('Error sending transaction to backend. Please contact support.');
    }
  };

  // Основная функция покупки - ИСПРАВЛЕННАЯ ВЕРСИЯ
  const handleMobileBuy = async () => {
    if (!account) {
      toast.warning('Please connect your wallet first! 🦊');
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

    // Проверяем что мы на BSC
    if (activeChain?.id !== bsc.id) {
      toast.error('Please switch to BSC network');
      return;
    }

    setIsProcessing(true);

    try {
      const amountWei = BigInt(Math.round(amount * 1e18));
      const hexValue = '0x' + amountWei.toString(16);

      // Используем ПРЯМУЮ отправку транзакции через provider вместо deep link
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
        gas: '0x5208', // 21000 gas для простого перевода
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

      // Отправляем транзакцию
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
      console.error('Direct transaction error:', error);
      
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

  // Очистка ожидающей транзакции
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

  // Компонент ожидающей транзакции
  const PendingTransactionComponent = () => {
    if (!pendingTransaction) return null;
    
    const timeElapsed = Date.now() - pendingTransaction.timestamp;
    const minutesElapsed = Math.floor(timeElapsed / 60000);
    
    return (
      <div style={{
        background: 'rgba(255, 193, 7, 0.1)',
        border: '1px solid rgba(255, 193, 7, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        margin: '12px 0',
        textAlign: 'center'
      }}>
        <h4 style={{ color: '#FFC107', margin: '0 0 8px 0' }}>
          ⏳ Transaction {pendingTransaction.txHash ? 'Pending' : 'Searching'}
        </h4>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', margin: '0 0 8px 0' }}>
          Amount: {pendingTransaction.amount} BNB
        </p>
        {pendingTransaction.txHash && (
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', margin: '0 0 8px 0' }}>
            Hash: {pendingTransaction.txHash.slice(0, 10)}...
          </p>
        )}
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', margin: '0 0 12px 0' }}>
          {pendingTransaction.txHash ? 'Confirming' : 'Searching'} for {minutesElapsed} minutes...
        </p>
        
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleManualCheck}
            style={{
              background: 'rgba(78, 205, 196, 0.3)',
              border: '1px solid rgba(78, 205, 196, 0.5)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#4ECDC4',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            🔍 Search Now
          </button>
          <button
            onClick={clearPendingTransaction}
            style={{
              background: 'rgba(255, 107, 53, 0.3)',
              border: '1px solid rgba(255, 107, 53, 0.5)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#FF6B35',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            ❌ Cancel
          </button>
        </div>
      </div>
    );
  };

  // Правильный расчет токенов
  const calculateTokens = () => {
    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0 || tokensPerBnb <= 0) return '0';
    
    const tokensReceived = amount * tokensPerBnb;
    return Math.floor(tokensReceived).toLocaleString();
  };

  const quickAmounts = ['0.1', '0.5', '1.0', '2.0'];
  const isOnBSC = activeChain?.id === bsc.id;

  if (!isClient) {
    return null;
  }

  return (
    <motion.div 
      style={{
        background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(78, 205, 196, 0.1) 100%)',
        borderRadius: '20px',
        padding: '24px',
        maxWidth: '400px',
        margin: '0 auto',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#FF6B35', margin: '0 0 8px 0', fontSize: '1.5rem' }}>
          🦊 CRFX PRESALE
        </h3>
        {isMobile && (
          <div style={{ fontSize: '0.8rem', color: '#4ECDC4' }}>
            📱 Mobile Optimized v2.0
          </div>
        )}
      </div>

      {/* Connection Status */}
      {account && (
        <div style={{
          background: 'rgba(78, 205, 196, 0.1)',
          border: '1px solid rgba(78, 205, 196, 0.3)',
          borderRadius: '12px',
          padding: '12px',
          margin: '12px 0',
          textAlign: 'center',
          fontSize: '0.9rem',
          color: '#4ECDC4'
        }}>
          ✅ Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}
          {!isOnBSC && <div style={{ color: '#FF6B35', marginTop: '4px' }}>⚠️ Switch to BSC</div>}
        </div>
      )}

      {/* Pending Transaction */}
      <PendingTransactionComponent />

      {/* Connect Wallet */}
      {!account && (
        <div style={{
          background: 'rgba(78, 205, 196, 0.1)',
          border: '1px solid rgba(78, 205, 196, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          margin: '12px 0',
          textAlign: 'center'
        }}>
          <p style={{ color: '#4ECDC4', margin: '0 0 12px 0', fontSize: '0.9rem' }}>
            Connect your wallet to continue:
          </p>
          
          <ConnectButton 
            client={client}
            theme="dark"
            chains={[bsc]}
            connectModal={{
              size: isMobile ? "compact" : "wide",
              title: "Connect to CrazyFox",
              showThirdwebBranding: false,
            }}
            connectButton={{
              style: {
                backgroundColor: '#FF6B35',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                maxWidth: '250px'
              }
            }}
          />
        </div>
      )}

      {/* Main Form */}
      {account && (
        <>
          {/* Quick Amounts */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
              Quick amounts (BNB):
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBuyAmount(amount)}
                  disabled={isProcessing}
                  style={{
                    background: buyAmount === amount ? '#FF6B35' : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: 'white',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    flex: '1',
                    minWidth: 'calc(25% - 6px)'
                  }}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
              Amount (BNB):
            </label>
            <input
              type="number"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              disabled={isProcessing}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '14px',
                color: 'white',
                fontSize: '1.1rem',
                textAlign: 'center'
              }}
              placeholder="0.0"
              min="0.01"
              max="10"
              step="0.01"
            />
          </div>

          {/* You Receive */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', marginBottom: '4px' }}>
              You receive:
            </div>
            <div style={{ color: '#4ECDC4', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {calculateTokens()} CRFX 🦊
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem', marginTop: '4px' }}>
              Rate: {tokensPerBnb.toLocaleString()} CRFX per 1 BNB
            </div>
          </div>

          {/* Buy Button */}
          <motion.button
            onClick={handleMobileBuy}
            disabled={isProcessing || !isOnBSC || !!pendingTransaction}
            whileHover={{ scale: (isProcessing || !isOnBSC || !!pendingTransaction) ? 1 : 1.02 }}
            whileTap={{ scale: (isProcessing || !isOnBSC || !!pendingTransaction) ? 1 : 0.98 }}
            style={{
              width: '100%',
              background: (isProcessing || !isOnBSC || !!pendingTransaction)
                ? 'rgba(255, 255, 255, 0.3)' 
                : 'linear-gradient(135deg, #FF6B35 0%, #4ECDC4 100%)',
              border: 'none',
              borderRadius: '16px',
              padding: '16px',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: (isProcessing || !isOnBSC || !!pendingTransaction) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {isProcessing ? (
              <span>🔄 Processing...</span>
            ) : !isOnBSC ? (
              <span>⚠️ Switch to BSC Network</span>
            ) : !!pendingTransaction ? (
              <span>⏳ Transaction {pendingTransaction.txHash ? 'Pending' : 'Searching'}</span>
            ) : window.ethereum ? (
              <span>🚀 Buy {calculateTokens()} CRFX</span>
            ) : (
              <span>📱 Buy via MetaMask</span>
            )}
          </motion.button>

          {/* Instructions */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(78, 205, 196, 0.1)',
            borderRadius: '12px',
            fontSize: '0.8rem',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            💡 {window.ethereum 
              ? 'Transaction will be sent directly through MetaMask and processed automatically.'
              : 'After confirming in MetaMask, return to this page. Your transaction will be automatically detected.'
            }
          </div>

          {/* Technical Info */}
          <div style={{
            marginTop: '12px',
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            fontSize: '0.7rem',
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center'
          }}>
            ⚡ Enhanced mobile integration • Automatic transaction detection • Multiple BSC RPC fallbacks
          </div>
        </>
      )}
    </motion.div>
  );
};

export default MobileMetaMaskPurchase;