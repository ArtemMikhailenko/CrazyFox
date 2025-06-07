// components/SimpleWeb3Buy.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

// Простой Web3 интерфейс без ThirdWeb
declare global {
  interface Window {
    ethereum?: any;
  }
}

// ⭐ НАСТРОЙКИ КОНТРАКТА
const PRESALE_CONTRACT_ADDRESS = "0xD80AC08a2effF26c4465aAF6ff00BE3DaecFF476";
const NETWORK_ID = "0x38"; // BSC Mainnet (56 в hex)

// ABI только нужных функций
const PRESALE_ABI = [
  {
    "inputs": [],
    "name": "buyWithBNB",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPresaleInfo",
    "outputs": [
      {"name": "_totalSoldTokens", "type": "uint256"},
      {"name": "_totalRaisedUSD", "type": "uint256"},
      {"name": "_tokenPriceUSD", "type": "uint256"},
      {"name": "_paymentWallet", "type": "address"},
      {"name": "_tokenWallet", "type": "address"},
      {"name": "_bnbPrice", "type": "uint256"},
      {"name": "_ethPrice", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const SimpleWeb3Buy = () => {
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [buyAmount, setBuyAmount] = useState('0.1');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [presaleData, setPresaleData] = useState<any>(null);

  // Fallback цены
  const [prices] = useState({
    bnb: 300,
    eth: 2000,
    token: 0.005
  });

  // Подключение кошелька
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask or another Web3 wallet!');
      return;
    }

    try {
      // Запрос доступа к кошельку
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Переключение на BSC сеть
        await switchToBSC();
        
        toast.success('Wallet connected! 🦊');
      }
    } catch (error: any) {
      console.error('Connection failed:', error);
      toast.error('Failed to connect wallet');
    }
  };

  // Переключение на BSC
  const switchToBSC = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_ID }],
      });
    } catch (switchError: any) {
      // Если сеть не добавлена, добавляем её
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: NETWORK_ID,
                chainName: 'BSC Mainnet',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: ['https://bsc-dataseed1.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add BSC network:', addError);
        }
      }
    }
  };

  // Проверка подключения при загрузке
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      }
    };

    checkConnection();

    // Слушаем изменения аккаунта
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          setAccount('');
          setIsConnected(false);
        }
      });
    }
  }, []);

  // Получение данных контракта
  const fetchPresaleData = async () => {
    if (!window.ethereum) return;

    try {
      // Простой вызов view функции
      const data = await window.ethereum.request({
        method: 'eth_call',
        params: [
          {
            to: PRESALE_CONTRACT_ADDRESS,
            data: '0x3ccfd60b' // getPresaleInfo() function selector
          },
          'latest'
        ],
      });

      // В реальном проекте здесь нужно декодировать данные
      console.log('Contract data:', data);
      setPresaleData(data);
    } catch (error) {
      console.error('Failed to fetch contract data:', error);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchPresaleData();
    }
  }, [isConnected]);

  // Расчёт токенов
  const calculateUSDValue = (amount: string) => {
    const amountFloat = parseFloat(amount || '0');
    return amountFloat * prices.bnb;
  };

  const calculateTokenAmount = (amount: string) => {
    const usdValue = calculateUSDValue(amount);
    return Math.floor(usdValue / prices.token);
  };

  // Покупка токенов
  const buyTokens = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);

    try {
      // Конвертируем BNB в Wei
      const amountInWei = BigInt(Math.floor(parseFloat(buyAmount) * 10**18));
      const amountHex = '0x' + amountInWei.toString(16);

      // Вызов функции buyWithBNB
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: account,
            to: PRESALE_CONTRACT_ADDRESS,
            value: amountHex,
            data: '0x36b19cd7' // buyWithBNB() function selector
          },
        ],
      });

      console.log('Transaction hash:', txHash);

      // Успех!
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.8 },
        colors: ['#FF6B35', '#4ECDC4', '#45B7D1']
      });

      const tokenAmount = calculateTokenAmount(buyAmount);
      toast.success(`🎉 Transaction sent! You will receive ${tokenAmount.toLocaleString()} CRFX tokens!`);
      
      setShowBuyModal(false);
      setBuyAmount('0.1');

      // Обновляем данные через несколько секунд
      setTimeout(() => {
        fetchPresaleData();
      }, 3000);

    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      if (error.code === 4001) {
        toast.warning('Transaction cancelled by user');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient BNB balance');
      } else {
        toast.error('Transaction failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const usdValue = calculateUSDValue(buyAmount);
  const tokenAmount = calculateTokenAmount(buyAmount);

  return (
    <>
      {/* Main Buy Button */}
      <motion.button
        onClick={() => isConnected ? setShowBuyModal(true) : connectWallet()}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          padding: '20px 40px',
          background: 'linear-gradient(135deg, #FF6B35, #4ECDC4)',
          border: 'none',
          borderRadius: '50px',
          color: '#fff',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.3s ease',
          boxShadow: '0 8px 30px rgba(255, 107, 53, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span style={{ fontSize: '20px' }}>🚀</span>
        <span>{isConnected ? 'Buy $CRFX Now' : 'Connect Wallet'}</span>
        <span style={{ fontSize: '12px', opacity: 0.9 }}>
          {isConnected ? `$${prices.token} per token` : 'MetaMask or Web3 wallet'}
        </span>
      </motion.button>

      {/* Account Info */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#4ECDC4',
            textAlign: 'center'
          }}
        >
          🔗 {account.slice(0, 6)}...{account.slice(-4)}
        </motion.div>
      )}

      {/* Buy Modal */}
      <AnimatePresence>
        {showBuyModal && (
          <motion.div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBuyModal(false)}
          >
            <motion.div 
              style={{
                background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
                borderRadius: '24px',
                maxWidth: '450px',
                width: '100%',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
              }}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(78, 205, 196, 0.1))'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>🦊</span>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #FF6B35, #4ECDC4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: 0
                  }}>
                    Buy CRFX Tokens
                  </h3>
                </div>
                <button 
                  onClick={() => setShowBuyModal(false)}
                  style={{
                    width: '36px',
                    height: '36px',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                {/* Price Info */}
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#b0b0b0', fontSize: '14px', marginBottom: '4px' }}>
                    Token Price
                  </div>
                  <div style={{
                    color: '#4ECDC4',
                    fontSize: '24px',
                    fontWeight: '700'
                  }}>
                    ${prices.token}
                  </div>
                </div>

                {/* Amount Input */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    color: '#fff',
                    fontSize: '14px',
                    marginBottom: '8px',
                    display: 'block',
                    fontWeight: '600'
                  }}>
                    Amount (BNB):
                  </label>
                  <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    min="0.001"
                    step="0.001"
                    placeholder="Enter BNB amount"
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Calculation */}
                <div style={{
                  background: 'rgba(255, 107, 53, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px',
                  border: '1px solid rgba(255, 107, 53, 0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ color: '#ccc', fontSize: '14px' }}>USD Value:</span>
                    <span style={{ color: '#4ECDC4', fontWeight: 'bold' }}>
                      ${usdValue.toFixed(2)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ color: '#ccc', fontSize: '14px' }}>You get:</span>
                    <span style={{ color: '#FF6B35', fontSize: '16px', fontWeight: 'bold' }}>
                      {tokenAmount.toLocaleString()} CRFX
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => setShowBuyModal(false)}
                    style={{
                      padding: '14px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={buyTokens}
                    disabled={isLoading || !buyAmount || parseFloat(buyAmount) <= 0}
                    style={{
                      padding: '14px',
                      background: isLoading ? 
                        'rgba(255, 255, 255, 0.2)' : 
                        'linear-gradient(135deg, #FF6B35, #4ECDC4)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                        <span>Buying...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Buy Now</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Footer */}
                <div style={{
                  textAlign: 'center',
                  marginTop: '20px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                    🔒 Secure • ⚡ Instant • ✅ Direct
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Payments go directly to treasury<br/>
                    Tokens sent instantly to your wallet
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default SimpleWeb3Buy;