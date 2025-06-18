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

// utils/metamaskDeepLink.ts
interface TransactionParams {
  to: string;
  value: string;
  gas?: string;
  gasPrice?: string;
  data?: string;
}

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
  const handleDeepLinkReturn = async () => {
    if (typeof window === 'undefined') return;
  
    const urlParams = new URLSearchParams(window.location.search);
    const txData = urlParams.get('tx');
  
    // Очищаем строку браузера
    window.history.replaceState({}, document.title, window.location.pathname);
  
    if (txData) {
      try {
        const transactionData = JSON.parse(decodeURIComponent(txData));
        console.log('Returned from MetaMask with transaction data:', transactionData);
  
        toast.info('Returned from MetaMask. Processing transaction...');
        
        const txHash = transactionData.hash || transactionData.txHash;
        if (txHash) {
          // Отправляем хеш на бэкенд для проверки
          await sendTransactionToBackend(txHash);
        } else {
          toast.error("Transaction hash not found in MetaMask return data");
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
        toast.success('🎉 Transaction sent to backend for processing!');
        
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

    // Проверяем что мы на BSC
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

  // Deep Link для мобильных - теперь с обработкой хеша
  const handleDeepLinkSend = async (hexValue: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      // Создаем правильный Deep Link для BSC
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
      
      toast.success('🚀 MetaMask opened! Confirm the transaction and the hash will be sent to our backend automatically.', { 
        autoClose: 8000 
      });

      // Запускаем периодическую проверку транзакции
      startTransactionPolling();

      setIsProcessing(false);

    } catch (error) {
      console.error('Deep link error:', error);
      toast.error('Failed to open MetaMask');
      setIsProcessing(false);
    }
  };

  // Периодическая проверка транзакции (для случаев когда хеш не возвращается через URL)
  const startTransactionPolling = () => {
    const interval = setInterval(async () => {
      if (typeof window === 'undefined') return;
      
      // Проверяем, есть ли новые транзакции в MetaMask
      if (window.ethereum && account?.address) {
        try {
          // Получаем последние транзакции пользователя
          const latestBlock = await window.ethereum.request({
            method: 'eth_getBlockByNumber',
            params: ['latest', true]
          });
          
          if (latestBlock && latestBlock.transactions) {
            // Ищем транзакции от нашего пользователя к контракту
            const userTx = latestBlock.transactions.find((tx: any) => 
              tx.from?.toLowerCase() === account.address.toLowerCase() &&
              tx.to?.toLowerCase() === contractAddress.toLowerCase()
            );
            
            if (userTx) {
              console.log('🔍 Found user transaction:', userTx.hash);
              clearInterval(interval);
              await sendTransactionToBackend(userTx.hash);
            }
          }
        } catch (error) {
          console.error('Error polling transactions:', error);
        }
      }
    }, 5000); // Проверяем каждые 5 секунд

    // Останавливаем проверку через 2 минуты
    setTimeout(() => {
      clearInterval(interval);
    }, 120000);
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
      
      // Отправляем хеш на бэкенд
      await sendTransactionToBackend(txHash);
      
      setIsProcessing(false);

    } catch (error: any) {
      console.error('Desktop transaction error:', error);
      toast.error('Transaction failed: ' + (error.message || 'Unknown error'));
      setIsProcessing(false);
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
        <button
          onClick={clearPendingTransaction}
          style={{
            background: 'rgba(255, 193, 7, 0.2)',
            border: '1px solid rgba(255, 193, 7, 0.5)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#FFC107',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Clear Pending
        </button>
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

      {/* Price Debug - только в dev режиме */}
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
              After confirming, the transaction hash will be automatically sent to our backend for processing.
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default MobileMetaMaskPurchase;