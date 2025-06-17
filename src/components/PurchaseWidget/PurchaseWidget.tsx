// components/PurchaseWidget/WorkingPurchaseWidget.tsx
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
import styles from './PurchaseWidget.module.css';

// Создаем клиент ThirdWeb
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

// Утилиты для мобильных устройств
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const hasMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && !!window.ethereum;
};

const redirectToMetaMaskMobile = (dappUrl?: string): void => {
  const currentUrl = dappUrl || window.location.href;
  const encodedUrl = encodeURIComponent(currentUrl);
  window.location.href = `https://metamask.app.link/dapp/${encodedUrl}`;
};

const PurchaseWidget = () => {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  
  const [buyAmount, setBuyAmount] = useState('0.1');
  const [selectedToken, setSelectedToken] = useState<'BNB' | 'USDT' | 'ETH'>('BNB');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStep, setTransactionStep] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [tokenPrice, setTokenPrice] = useState<number>(0.005);
  const [bnbPrice, setBnbPrice] = useState<number>(300);
  const [showMetaMaskHelper, setShowMetaMaskHelper] = useState(false);

  // Проверяем мобильное устройство и загружаем данные API
  useEffect(() => {
    const checkMobile = () => {
      const mobile = isMobileDevice();
      setIsMobile(mobile);
      
      // Показываем помощник MetaMask если на мобильном и нет window.ethereum
      if (mobile && !hasMetaMaskInstalled()) {
        setShowMetaMaskHelper(true);
      }
    };
    
    checkMobile();
    fetchContractAddress();
    fetchTokenPrice();
  }, []);

  // Получаем адрес контракта
  const fetchContractAddress = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.getTransferAddress);
      if (response.ok) {
        const data = await response.text();
        const cleanAddress = data.replace(/['"]/g, '').trim();
        setContractAddress(cleanAddress);
        console.log('Contract address loaded:', cleanAddress);
      } else {
        console.error('Failed to fetch contract address');
        setContractAddress("0xa2c959a7Fbf6d96eA4170e724D871E0556cd8556");
      }
    } catch (error) {
      console.error('Error fetching contract address:', error);
      setContractAddress("0xa2c959a7Fbf6d96eA4170e724D871E0556cd8556");
    }
  };

  // Получаем цену токена
  const fetchTokenPrice = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.getPrice}?token=BNB`);
      if (response.ok) {
        const data = await response.text();
        const price = parseFloat(data.trim());
        if (!isNaN(price) && price > 0) {
          setBnbPrice(price);
          console.log('BNB price loaded:', price);
        } else {
          console.error('Invalid price received:', data);
          setBnbPrice(300);
        }
      }
    } catch (error) {
      console.error('Error fetching token price:', error);
      setBnbPrice(300);
    }
  };

  // Верификация и распределение токенов
  const verifyTransaction = async (txHash: string, amount: string) => {
    try {
      const payload = {
        txHash: txHash,
        userAddress: account?.address || '',
        amountSent: amount.replace(',', '.'),
        symbol: selectedToken
      };

      console.log('Verifying transaction:', payload);

      const response = await fetch(API_ENDPOINTS.verifyAndDistribute, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Verification successful:', result);
        return true;
      } else {
        const error = await response.text();
        console.error('Verification failed:', error);
        return false;
      }
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  };

  // Проверяем сеть
  const isOnBSC = activeChain?.id === bsc.id;

  // Проверяем валидность адреса контракта
  const isValidAddress = (address: string) => {
    return address && /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Основная функция покупки с проверкой мобильного устройства
  const handleBuy = async () => {
    if (!account) {
      toast.warning('Please connect your wallet first! 🦊');
      return;
    }

    // КРИТИЧЕСКИ ВАЖНО: Проверка мобильного устройства
    if (isMobile && !hasMetaMaskInstalled()) {
      toast.info('Redirecting to MetaMask app...', { autoClose: 2000 });
      redirectToMetaMaskMobile();
      return;
    }

    if (!isOnBSC) {
      toast.error('Please switch to BSC network first!');
      return;
    }

    if (!contractAddress || !isValidAddress(contractAddress)) {
      toast.error('Invalid contract address. Please try again.');
      console.error('Invalid contract address:', contractAddress);
      return;
    }

    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Основной метод покупки
    await handleBuyDirect();
  };

  // Прямой метод отправки через MetaMask/кошелек
  const handleBuyDirect = async () => {
    if (!account) {
      toast.error('Wallet not connected');
      return;
    }

    // Еще одна проверка для мобильных устройств
    if (isMobile && !window.ethereum) {
      toast.info('Opening MetaMask app...', { autoClose: 2000 });
      redirectToMetaMaskMobile();
      return;
    }

    if (!window.ethereum) {
      toast.error('Wallet not available');
      return;
    }

    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    setTransactionStep('Preparing transaction...');

    try {
      console.log('Sending to address:', contractAddress);
      console.log('Amount in BNB:', amount);
      
      // Конвертируем в wei (18 decimals)
      const amountWei = BigInt(Math.round(amount * 1e18));
      const hexValue = '0x' + amountWei.toString(16);
      
      console.log('Amount in wei:', amountWei.toString());
      console.log('Hex value:', hexValue);

      setTransactionStep('Sending transaction...');

      // Прямое обращение к кошельку
      const transactionParams = {
        from: account.address,
        to: contractAddress,
        value: hexValue,
        gas: '0x5208', // 21000 gas limit
      };
      
      console.log('Transaction params:', transactionParams);

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParams],
      });

      setTransactionStep('Transaction sent! Verifying...');
      console.log('Transaction hash:', txHash);
      
      // Верифицируем транзакцию через API
      const verificationSuccess = await verifyTransaction(txHash, amount.toString());
      
      if (verificationSuccess) {
        setTransactionStep('Transaction verified! Tokens distributed!');
        
        toast.success("🎉 Purchase successful! CRFX tokens distributed to your wallet! 🦊");
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B35', '#4ECDC4', '#45B7D1']
        });
      } else {
        setTransactionStep('Transaction sent but verification pending...');
        toast.warning("🔄 Transaction sent! Verification in progress...");
      }

      // Сбрасываем форму через 3 секунды
      setTimeout(() => {
        setBuyAmount('0.1');
        setIsProcessing(false);
        setTransactionStep('');
      }, 3000);

    } catch (error: any) {
      console.error('Purchase error:', error);
      
      let errorMessage = '';
      
      if (error.message?.includes('insufficient funds') || error.code === -32000) {
        errorMessage = 'Insufficient BNB balance in your wallet';
      } else if (error.message?.includes('User rejected') || error.code === 4001) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error.message?.includes('gas')) {
        errorMessage = 'Transaction failed due to gas issues';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection';
      } else {
        errorMessage = `Transaction failed: ${error.message || 'Unknown error'}`;
      }
      
      toast.error(errorMessage);
      setIsProcessing(false);
      setTransactionStep('');
    }
  };

  // Функция для открытия MetaMask app
  const handleOpenMetaMaskApp = () => {
    toast.info('Opening MetaMask app...', { autoClose: 2000 });
    redirectToMetaMaskMobile();
  };

  // Расчет токенов
  const calculateTokens = () => {
    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return '0';
    
    const amountUSD = amount * bnbPrice;
    const tokensReceived = amountUSD / tokenPrice;
    
    return Math.floor(tokensReceived).toLocaleString();
  };

  // Quick amounts
  const quickAmounts = ['0.1', '0.5', '1.0', '2.0'];

  return (
    <motion.div 
      className={styles.purchaseWidget}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
    >
      {/* Widget Header */}
      <div className={styles.widgetHeader}>
        <h3>🦊 CRFX PRESALE</h3>
        {isMobile && (
          <div style={{ fontSize: '0.8rem', color: '#4ECDC4', marginTop: '0.5rem' }}>
            📱 Mobile Optimized
          </div>
        )}
      </div>

      {/* Raised Amount & Progress */}
      <div className={styles.raisedSection}>
        <div className={styles.raisedLabel}>RAISED: $325.500</div>
        <div className={styles.stageInfo}>
          <span>Stage 1/6</span>
          <span>32.5% soft cap</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: "32.5%" }}></div>
          <span className={styles.progressPercentage}>32.5%</span>
        </div>
        <div className={styles.priceRow}>
          <span>Current: $0.005</span>
          <span>Next: $0.006</span>
          <span style={{ fontSize: '0.8rem', color: '#4ECDC4' }}>
            📊 1 BNB ≈ ${bnbPrice} ≈ {Math.floor(bnbPrice/tokenPrice).toLocaleString()} CRFX
          </span>
        </div>
      </div>

      {/* Мобильный помощник MetaMask - показываем если кошелек недоступен */}
      {isMobile && showMetaMaskHelper && !account && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(78, 205, 196, 0.1) 100%)',
          border: '1px solid rgba(255, 107, 53, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          margin: '16px 0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📱</div>
          <h4 style={{ 
            color: '#FF6B35', 
            margin: '0 0 8px 0',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            Mobile Wallet Required
          </h4>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            margin: '0 0 16px 0',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            For the best mobile experience, please use MetaMask mobile app or any wallet with WalletConnect support.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleOpenMetaMaskApp}
              style={{
                background: 'linear-gradient(135deg, #FF6B35 0%, #FF8A65 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 20px',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                width: '100%'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🦊 Open in MetaMask App
            </button>
            
            <button
              onClick={() => setShowMetaMaskHelper(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '12px 20px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              💰 Try WalletConnect Instead
            </button>
          </div>
          
          <p style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '12px',
            margin: '12px 0 0 0'
          }}>
            💡 You can also use Trust Wallet, SafePal, or any mobile wallet that supports WalletConnect
          </p>
        </div>
      )}

      {/* Connection Status */}
      {account && (
        <div className={styles.connectionStatus}>
          <span className={styles.connectedDot}></span>
          Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}
          {!isOnBSC && <div className={styles.wrongNetwork}>⚠️ Switch to BSC</div>}
        </div>
      )}

      {/* Если кошелек не подключен и не мобильное устройство или скрыт помощник */}
      {!account && (!isMobile || !showMetaMaskHelper) && (
        <div style={{
          background: 'rgba(78, 205, 196, 0.1)',
          border: '1px solid rgba(78, 205, 196, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          margin: '12px 0',
          textAlign: 'center'
        }}>
          <p style={{ 
            color: '#4ECDC4', 
            margin: '0 0 12px 0',
            fontSize: '0.9rem'
          }}>
            {isMobile ? '📱 Connect your mobile wallet:' : '🦊 Connect your wallet to continue:'}
          </p>
          
          <ConnectButton 
            client={client}
            theme="dark"
            chains={[bsc]}
            connectModal={{
              size: isMobile ? "compact" : "wide",
              title: "Connect to CrazyFox",
              welcomeScreen: !isMobile ? {
                title: "Welcome to CrazyFox",
                subtitle: "Connect your wallet to start buying CRFX tokens",
              } : undefined,
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

      {/* Основная форма - показываем только если кошелек подключен */}
      {account && (
        <>
          {/* Token Selection - только BNB */}
          <div className={styles.paymentMethod}>
            <label>💰 Pay with BNB only</label>
            <div className={styles.tokenSelector}>
              <button 
                className={`${styles.tokenBtn} ${styles.active}`}
                disabled
                type="button"
              >
                🔶 BNB
              </button>
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '8px',
              textAlign: 'center'
            }}>
              📱 Simplified for better mobile compatibility
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className={styles.quickAmounts}>
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                className={`${styles.quickAmountBtn} ${buyAmount === amount ? styles.active : ''}`}
                onClick={() => setBuyAmount(amount)}
                disabled={isProcessing}
              >
                {amount}
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className={styles.amountSection}>
            <div className={styles.inputRow}>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  disabled={isProcessing}
                  className={styles.amountInput}
                  placeholder="0.0"
                  min="0.01"
                  max="10"
                  step="0.01"
                />
                <span className={styles.inputLabel}>Pay with BNB</span>
              </div>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={calculateTokens()}
                  readOnly
                  className={styles.receiveInput}
                  placeholder="0"
                />
                <span className={styles.inputLabel}>Receive $CRFX</span>
                <span className={styles.tokenIcon}>🦊</span>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {isProcessing && (
            <div className={styles.statusMessage}>
              <span className={styles.spinner}>🔄</span>
              {transactionStep || 'Processing transaction...'}
            </div>
          )}

          {/* Buy Button */}
          <motion.button
            className={styles.buyButton}
            onClick={handleBuy}
            disabled={isProcessing || !isOnBSC}
            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          >
            {isProcessing ? (
              <span>🔄 Processing...</span>
            ) : !isOnBSC ? (
              <span>⚠️ Switch to BSC Network</span>
            ) : isMobile && !hasMetaMaskInstalled() ? (
              <span>📱 Open MetaMask App</span>
            ) : (
              <span>🚀 Buy {calculateTokens()} CRFX</span>
            )}
          </motion.button>
        </>
      )}

      {/* Debug info в dev режиме */}
      {process.env.NODE_ENV === 'development' && account && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          <div>Chain ID: {activeChain?.id}</div>
          <div>Is BSC: {isOnBSC ? 'Yes' : 'No'}</div>
          <div>Is Mobile: {isMobile ? 'Yes' : 'No'}</div>
          <div>Has MetaMask: {hasMetaMaskInstalled() ? 'Yes' : 'No'}</div>
          <div>Account: {account.address.slice(0, 10)}...</div>
          <div>Contract: {contractAddress ? `${contractAddress.slice(0, 10)}...` : 'Loading...'}</div>
          <div>Contract Valid: {contractAddress ? isValidAddress(contractAddress) ? 'Yes' : 'No' : 'Unknown'}</div>
          <div>BNB Price: ${bnbPrice}</div>
        </div>
      )}
    </motion.div>
  );
};

export default PurchaseWidget;