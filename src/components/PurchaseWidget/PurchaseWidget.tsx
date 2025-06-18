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

// Создаем Deep Link для MetaMask с параметрами транзакции
export const createMetaMaskDeepLink = (params: TransactionParams): string => {
  const baseUrl = 'https://metamask.app.link/send';
  
  const urlParams = new URLSearchParams({
    address: params.to,
    uint256: params.value, // Сумма в wei
    ...(params.gas && { gas: params.gas }),
    ...(params.gasPrice && { gasPrice: params.gasPrice }),
    ...(params.data && { data: params.data })
  });

  return `${baseUrl}?${urlParams.toString()}`;
};

// Альтернативный способ через dapp URL с автовызовом транзакции
export const createDappDeepLinkWithTransaction = (
  contractAddress: string, 
  amount: string, 
  userAddress?: string
): string => {
  // Кодируем параметры транзакции в URL
  const transactionData = {
    to: contractAddress,
    value: amount,
    from: userAddress
  };
  
  const encodedData = encodeURIComponent(JSON.stringify(transactionData));
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const dappUrl = `${currentUrl}?tx=${encodedData}`;
  const encodedDappUrl = encodeURIComponent(dappUrl);
  
  return `https://metamask.app.link/dapp/${encodedDappUrl}`;
};

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
  const [tokenPrice, setTokenPrice] = useState<number>(0.005);
  const [bnbPrice, setBnbPrice] = useState<number>(300);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);

  useEffect(() => {
    // Устанавливаем флаг клиентской стороны
    setIsClient(true);
    
    // Проверяем мобильное устройство
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    fetchContractAddress();
    fetchTokenPrice();
    
    // Проверяем, если пришли из MetaMask с параметрами транзакции
    handleDeepLinkReturn();
    
    // Проверяем ожидающую транзакцию
    checkPendingTransactionOnMount();
  }, []);

  // Загружаем данные
  const fetchContractAddress = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.getTransferAddress);
      if (response.ok) {
        const data = await response.text();
        const cleanAddress = data.replace(/['"]/g, '').trim();
        setContractAddress(cleanAddress);
      } else {
        setContractAddress("0xa2c959a7Fbf6d96eA4170e724D871E0556cd8556");
      }
    } catch (error) {
      setContractAddress("0xa2c959a7Fbf6d96eA4170e724D871E0556cd8556");
    }
  };

  const fetchTokenPrice = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.getPrice}?token=BNB`);
      if (response.ok) {
        const data = await response.text();
        const price = parseFloat(data.trim());
        if (!isNaN(price) && price > 0) {
          setBnbPrice(price);
        } else {
          setBnbPrice(300);
        }
      }
    } catch (error) {
      setBnbPrice(300);
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
        
        // Здесь можно добавить логику для отслеживания статуса транзакции
        toast.info('Returned from MetaMask. Checking transaction status...');
        
        // Очищаем URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error parsing transaction data:', error);
      }
    }
  };

  // Проверка ожидающей транзакции при монтировании компонента
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

  // Основная функция покупки через Deep Link
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

    setIsProcessing(true);

    try {
      // Конвертируем сумму в wei
      const amountWei = BigInt(Math.round(amount * 1e18));
      const hexValue = '0x' + amountWei.toString(16);

      if (isMobile) {
        // МЕТОД 1: Прямой Deep Link на отправку
        await handleDeepLinkSend(hexValue);
      } else {
        // Для десктопа используем обычный метод
        await handleDesktopBuy(hexValue);
      }

    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed: ' + (error.message || 'Unknown error'));
      setIsProcessing(false);
    }
  };

  // Deep Link метод для мобильных устройств
  const handleDeepLinkSend = async (hexValue: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      // ВАРИАНТ 1: Простой Deep Link на отправку
      const deepLinkUrl = `https://metamask.app.link/send?address=${contractAddress}&uint256=${hexValue}`;
      
      toast.info('Opening MetaMask for transaction confirmation...', { autoClose: 3000 });
      
      // Сохраняем данные транзакции в localStorage для отслеживания
      const transactionData = {
        to: contractAddress,
        value: hexValue,
        amount: buyAmount,
        timestamp: Date.now(),
        userAddress: account?.address
      };
      
      localStorage.setItem('pendingTransaction', JSON.stringify(transactionData));
      setPendingTransaction(transactionData);
      
      // Открываем MetaMask
      window.open(deepLinkUrl, '_blank');
      
      // Показываем инструкции пользователю
      toast.success('🚀 MetaMask opened! Confirm the transaction and return to this page.', { 
        autoClose: 8000 
      });

      setIsProcessing(false);

    } catch (error) {
      console.error('Deep link error:', error);
      toast.error('Failed to open MetaMask');
      setIsProcessing(false);
    }
  };

  // Альтернативный метод через DApp Deep Link
  const handleDappDeepLink = async (hexValue: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      // ВАРИАНТ 2: DApp Deep Link с автовызовом транзакции
      const transactionData = {
        to: contractAddress,
        value: hexValue,
        from: account?.address,
        action: 'purchase',
        amount: buyAmount
      };
      
      const encodedData = encodeURIComponent(JSON.stringify(transactionData));
      const currentUrl = window.location.href.split('?')[0]; // Убираем существующие параметры
      const dappUrl = `${currentUrl}?autoTx=${encodedData}`;
      const encodedDappUrl = encodeURIComponent(dappUrl);
      
      const deepLinkUrl = `https://metamask.app.link/dapp/${encodedDappUrl}`;
      
      toast.info('Opening DApp in MetaMask...', { autoClose: 3000 });
      
      // Сохраняем состояние
      localStorage.setItem('pendingTransaction', JSON.stringify(transactionData));
      setPendingTransaction(transactionData);
      
      // Открываем DApp в MetaMask
      window.location.href = deepLinkUrl;

    } catch (error) {
      console.error('DApp deep link error:', error);
      toast.error('Failed to open DApp in MetaMask');
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

      toast.success('🎉 Transaction sent! Hash: ' + txHash);
      
      // Здесь можно добавить верификацию через API
      
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

  // Расчет токенов
  const calculateTokens = () => {
    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return '0';
    
    const amountUSD = amount * bnbPrice;
    const tokensReceived = amountUSD / tokenPrice;
    
    return Math.floor(tokensReceived).toLocaleString();
  };

  const quickAmounts = ['0.1', '0.5', '1.0', '2.0'];
  const isOnBSC = activeChain?.id === bsc.id;

  // Не рендерим до тех пор, пока компонент не смонтирован на клиенте
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
              Confirm the transaction and return to this page.
            </div>
          )}

          {/* Alternative Deep Link Method Button */}
          {isMobile && !isProcessing && (
            <motion.button
              onClick={() => handleDappDeepLink('0x' + BigInt(Math.round(parseFloat(buyAmount.replace(',', '.')) * 1e18)).toString(16))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              🔄 Try DApp Method
            </motion.button>
          )}
        </>
      )}
    </motion.div>
  );
};

export default MobileMetaMaskPurchase;