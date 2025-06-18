// components/MobileMetaMaskPurchase.tsx
'use client';

import { useState, useEffect } from 'react';
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
  const [isPollingTransaction, setIsPollingTransaction] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    fetchContractAddress();
    fetchTokenPrice();
    handleDeepLinkReturn();
    checkPendingTransactionOnMount();
  }, []);

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

  // Обработка возврата из MetaMask
  const handleDeepLinkReturn = () => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const txData = urlParams.get('tx');
    
    if (txData) {
      try {
        const transactionData = JSON.parse(decodeURIComponent(txData));
        console.log('Returned from MetaMask with transaction data:', transactionData);
        
        toast.info('Returned from MetaMask. Checking transaction status...');
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Начинаем поллинг транзакции
        if (transactionData.hash) {
          startTransactionPolling(transactionData.hash);
        }
      } catch (error) {
        console.error('Error parsing transaction data:', error);
      }
    }
  };

  // Проверка ожидающей транзакции
  const checkPendingTransactionOnMount = () => {
    if (typeof window === 'undefined') return;
    
    const pendingTx = localStorage.getItem('pendingTransaction');
    if (pendingTx) {
      try {
        const txData = JSON.parse(pendingTx);
        setPendingTransaction(txData);
        
        // Если есть pending транзакция, предлагаем проверить её статус
        if (txData.userAddress === account?.address) {
          toast.info('You have a pending transaction. Click "Check Transaction" to verify its status.', {
            autoClose: false
          });
        }
      } catch (error) {
        localStorage.removeItem('pendingTransaction');
      }
    }
  };

  // Поллинг статуса транзакции
  const startTransactionPolling = async (txHash: string) => {
    if (!txHash || isPollingTransaction) return;
    
    setIsPollingTransaction(true);
    console.log('🔍 Starting transaction polling for:', txHash);
    
    let attempts = 0;
    const maxAttempts = 20; // 20 попыток = 2 минуты
    
    const pollTransaction = async () => {
      attempts++;
      
      try {
        // Проверяем статус транзакции через RPC
        const receipt = await checkTransactionStatus(txHash);
        
        if (receipt && receipt.status === '0x1') {
          // Транзакция подтверждена
          console.log('✅ Transaction confirmed:', txHash);
          toast.success('🎉 Transaction confirmed! Distributing tokens...');
          
          // Вызываем API для распределения токенов
          await verifyAndDistributeTokens(txHash);
          setIsPollingTransaction(false);
          return;
        } else if (receipt && receipt.status === '0x0') {
          // Транзакция не удалась
          console.log('❌ Transaction failed:', txHash);
          toast.error('Transaction failed. Please try again.');
          clearPendingTransaction();
          setIsPollingTransaction(false);
          return;
        }
        
        // Если транзакция еще не подтверждена и не достигли лимита попыток
        if (attempts < maxAttempts) {
          console.log(`⏳ Transaction pending... Attempt ${attempts}/${maxAttempts}`);
          setTimeout(pollTransaction, 6000); // Проверяем каждые 6 секунд
        } else {
          console.log('⏰ Polling timeout reached');
          toast.warning('Transaction is taking longer than expected. Please check manually or contact support.');
          setIsPollingTransaction(false);
        }
        
      } catch (error) {
        console.error('Error polling transaction:', error);
        if (attempts < maxAttempts) {
          setTimeout(pollTransaction, 6000);
        } else {
          setIsPollingTransaction(false);
        }
      }
    };
    
    // Начинаем поллинг через 3 секунды
    setTimeout(pollTransaction, 3000);
  };

  // Проверка статуса транзакции через RPC
  const checkTransactionStatus = async (txHash: string) => {
    try {
      const response = await fetch('https://bsc-dataseed.binance.org/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [txHash],
          id: 1
        })
      });
      
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return null;
    }
  };

  // Основная функция покупки
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

    if (activeChain?.id !== bsc.id) {
      toast.error('Please switch to BSC network');
      return;
    }

    setIsProcessing(true);

    try {
      const amountWei = BigInt(Math.round(amount * 1e18));
      const hexValue = '0x' + amountWei.toString(16);

      if (isMobile) {
        await handleDeepLinkSend(hexValue);
      } else {
        await handleDesktopBuy(hexValue);
      }

    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed: ' + (error.message || 'Unknown error'));
      setIsProcessing(false);
    }
  };

  // Deep Link для мобильных
  const handleDeepLinkSend = async (hexValue: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const deepLinkUrl = `https://metamask.app.link/send/0x${contractAddress.replace('0x', '')}@56?value=${hexValue}`;
      
      console.log('🔗 Deep Link URL:', deepLinkUrl);
      
      toast.info('Opening MetaMask for transaction confirmation...', { autoClose: 3000 });
      
      // Сохраняем данные транзакции
      const transactionData = {
        to: contractAddress,
        value: hexValue,
        amount: buyAmount,
        timestamp: Date.now(),
        userAddress: account?.address,
        symbol: 'BNB'
      };
      
      localStorage.setItem('pendingTransaction', JSON.stringify(transactionData));
      setPendingTransaction(transactionData);
      
      // Открываем MetaMask
      window.open(deepLinkUrl, '_blank');
      
      toast.success('🚀 MetaMask opened! After confirming the transaction, return to this page and click "Check Transaction" button.', { 
        autoClose: 10000 
      });

      setIsProcessing(false);

    } catch (error) {
      console.error('Deep link error:', error);
      toast.error('Failed to open MetaMask');
      setIsProcessing(false);
    }
  };

  // Обычный метод для десктопа
  const handleDesktopBuy = async (hexValue: string) => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('MetaMask not found');
      setIsProcessing(false);
      return;
    }

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

      console.log('✅ Transaction sent:', txHash);
      setTransactionHash(txHash);
      
      toast.success('🎉 Transaction sent! Hash: ' + txHash);
      
      // Вызываем API для верификации и распределения токенов
      await verifyAndDistributeTokens(txHash);
      
      setIsProcessing(false);

    } catch (error: any) {
      console.error('Desktop transaction error:', error);
      toast.error('Transaction failed: ' + (error.message || 'Unknown error'));
      setIsProcessing(false);
    }
  };

  // Верификация и распределение токенов
  const verifyAndDistributeTokens = async (txHash: string) => {
    try {
      const payload = {
        txHash: txHash,
        userAddress: account?.address || '',
        amountSent: buyAmount.replace(',', '.'),
        symbol: 'BNB'
      };

      console.log('📤 Sending verification request:', payload);

      const response = await fetch(API_ENDPOINTS.verifyAndDistribute, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.text();
        console.log('✅ Verification successful:', result);
        toast.success('🎉 Tokens distributed successfully!');
        
        clearPendingTransaction();
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        console.error('❌ Verification failed:', response.status);
        toast.error('Verification failed. Please contact support with transaction hash: ' + txHash);
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Error verifying transaction. Please contact support.');
    }
  };

  // Ручная проверка транзакции
  const manualTransactionCheck = async () => {
    if (!pendingTransaction || !account) return;
    
    const userAddress = account.address.toLowerCase();
    const timestamp = pendingTransaction.timestamp;
    const amount = parseFloat(pendingTransaction.amount);
    
    setIsPollingTransaction(true);
    toast.info('🔍 Searching for your transaction...');
    
    try {
      // Ищем транзакции пользователя за последние 30 минут
      const transactions = await findUserTransactions(userAddress, contractAddress, timestamp);
      
      if (transactions.length > 0) {
        // Находим транзакцию с подходящей суммой
        //@ts-ignore
        const matchingTx = transactions.find(tx => {
          const txAmount = parseFloat(tx.value) / 1e18;
          return Math.abs(txAmount - amount) < 0.001; // Допуск 0.001 BNB
        });
        
        if (matchingTx) {
          toast.success('✅ Transaction found! Verifying...');
          await verifyAndDistributeTokens(matchingTx.hash);
        } else {
          toast.warning('No matching transaction found. Please wait a bit more or contact support.');
        }
      } else {
        toast.warning('No recent transactions found. Please ensure the transaction was completed.');
      }
      
    } catch (error) {
      console.error('Error in manual check:', error);
      toast.error('Error checking transaction. Please try again.');
    } finally {
      setIsPollingTransaction(false);
    }
  };

  // Поиск транзакций пользователя
  const findUserTransactions = async (userAddress: string, toAddress: string, sinceTimestamp: number) => {
    // Здесь можно использовать BSCScan API или другой блокчейн эксплорер
    // Пример с BSCScan API:
    try {
      const apiKey = process.env.NEXT_PUBLIC_BSCSCAN_API_KEY || 'YourBSCScanAPIKey';
      const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${userAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        const cutoffTime = Math.floor(sinceTimestamp / 1000) - 1800; // 30 минут назад
        
        return data.result.filter((tx: any) => 
          tx.to.toLowerCase() === toAddress.toLowerCase() &&
          parseInt(tx.timeStamp) >= cutoffTime &&
          tx.isError === '0'
        );
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };

  // Очистка ожидающей транзакции
  const clearPendingTransaction = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pendingTransaction');
    }
    setPendingTransaction(null);
  };

  // Компонент ожидающей транзакции
  const PendingTransactionComponent = () => {
    if (!pendingTransaction) return null;
    
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
          ⏳ Transaction Pending
        </h4>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', margin: '0 0 12px 0' }}>
          Amount: {pendingTransaction.amount} BNB
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={manualTransactionCheck}
            disabled={isPollingTransaction}
            style={{
              background: 'rgba(76, 175, 80, 0.2)',
              border: '1px solid rgba(76, 175, 80, 0.5)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#4CAF50',
              fontSize: '0.9rem',
              cursor: isPollingTransaction ? 'not-allowed' : 'pointer'
            }}
          >
            {isPollingTransaction ? '🔄 Checking...' : '🔍 Check Transaction'}
          </button>
          <button
            onClick={clearPendingTransaction}
            disabled={isPollingTransaction}
            style={{
              background: 'rgba(244, 67, 54, 0.2)',
              border: '1px solid rgba(244, 67, 54, 0.5)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#F44336',
              fontSize: '0.9rem',
              cursor: isPollingTransaction ? 'not-allowed' : 'pointer'
            }}
          >
            ❌ Clear
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
    
    console.log('🧮 Token calculation:', {
      amount: amount,
      tokensPerBnb: tokensPerBnb,
      tokensReceived: tokensReceived
    });
    
    return Math.floor(tokensReceived).toLocaleString();
  };

  // Компонент отладки цен
  const PriceDebugComponent = () => {
    const amount = parseFloat(buyAmount.replace(',', '.'));
    const tokensReceived = amount * tokensPerBnb;
    
    return (
      <div style={{
        background: 'rgba(255, 255, 0, 0.1)',
        border: '1px solid rgba(255, 255, 0, 0.3)',
        borderRadius: '12px',
        padding: '12px',
        margin: '12px 0',
        fontSize: '0.8rem',
        color: '#FFD700'
      }}>
        <div>🔍 Debug Info:</div>
        <div>Tokens per 1 BNB: {tokensPerBnb.toLocaleString()}</div>
        <div>Your amount: {amount} BNB</div>
        <div>You get: {Math.floor(tokensReceived).toLocaleString()} CRFX</div>
      </div>
    );
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
            📱 Mobile Deep Link Optimized
          </div>
        )}
      </div>

      {/* Price Debug */}
      {process.env.NODE_ENV === 'development' && <PriceDebugComponent />}

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
            disabled={isProcessing || !isOnBSC}
            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
            style={{
              width: '100%',
              background: isProcessing || !isOnBSC 
                ? 'rgba(255, 255, 255, 0.3)' 
                : 'linear-gradient(135deg, #FF6B35 0%, #4ECDC4 100%)',
              border: 'none',
              borderRadius: '16px',
              padding: '16px',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: isProcessing || !isOnBSC ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {isProcessing ? (
              <span>🔄 Processing...</span>
            ) : !isOnBSC ? (
              <span>⚠️ Switch to BSC Network</span>
            ) : isMobile ? (
              <span>📱 Buy via MetaMask App</span>
            ) : (
              <span>🚀 Buy {calculateTokens()} CRFX</span>
            )}
          </motion.button>

          {/* Instructions for mobile */}
          {isMobile && (
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
              💡 Clicking "Buy" will open MetaMask app with pre-filled transaction. 
              After confirming the transaction, return to this page and click "Check Transaction" button.
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default MobileMetaMaskPurchase;