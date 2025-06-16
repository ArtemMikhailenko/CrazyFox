// components/PurchaseWidget/PurchaseWidget.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import styles from './PurchaseWidget.module.css';

// Utility function to detect mobile devices
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Enhanced Wallet Hook
const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        const network = await (window as any).ethereum.request({ 
          method: 'net_version' 
        });
        setAccount(accounts[0]);
        setIsConnected(true);
        setChainId(parseInt(network, 10));
      } catch (error) {
        console.error('Wallet connection error:', error);
        throw new Error('Failed to connect wallet');
      }
    } else {
      throw new Error('MetaMask not found. Please install MetaMask!');
    }
  };

  // Enhanced transaction function with mobile deeplink support
  const sendTransaction = async (tx: any) => {
    try {
      // Check if we're on mobile and should use deeplink
      if (isMobile() && (window as any).ethereum?.isMetaMask) {
        console.log('Using deeplink for mobile transaction');
        return await sendTransactionViaDeeplink(tx);
      } else {
        // Desktop or non-MetaMask mobile wallet - use standard method
        const txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [tx],
        });
        return { transactionHash: txHash };
      }
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  };

  // Deeplink transaction function for mobile
  const sendTransactionViaDeeplink = async (tx: any) => {
    return new Promise((resolve, reject) => {
      try {
        // Construct deeplink URL based on transaction type
        let deeplinkUrl = '';
        
        if (tx.data) {
          // Token transfer deeplink
          deeplinkUrl = `https://metamask.app.link/send/${tx.to}@${tx.chainId || 56}?value=${tx.value || '0x0'}&data=${tx.data}`;
        } else {
          // Native token (BNB) transfer deeplink
          const valueInHex = tx.value || '0x0';
          deeplinkUrl = `https://metamask.app.link/send/${tx.to}@${tx.chainId || 56}?value=${valueInHex}`;
        }

        console.log('Opening deeplink:', deeplinkUrl);

        // Open deeplink
        window.open(deeplinkUrl, '_blank');

        // Since we can't directly get the transaction hash from deeplink,
        // we'll need to implement a different flow or ask user for confirmation
        setTimeout(() => {
          // For now, we'll simulate success and let the verification API handle the rest
          // In a real implementation, you might want to:
          // 1. Show a modal asking user to confirm transaction completion
          // 2. Poll the blockchain for recent transactions from the user's address
          // 3. Implement a callback mechanism
          
          resolve({ 
            transactionHash: 'deeplink_initiated', // Placeholder
            isDeeplink: true 
          });
        }, 3000);

      } catch (error) {
        reject(error);
      }
    });
  };

  const switchToBSC = async () => {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }], // BSC Mainnet
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, add it
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x38',
            chainName: 'Binance Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/']
          }]
        });
      } else {
        throw error;
      }
    }
  };

  return { account, isConnected, chainId, connectWallet, sendTransaction, switchToBSC };
};

// PurchaseWidget Component
const PurchaseWidget = () => {
  const { account, isConnected, chainId, connectWallet, sendTransaction, switchToBSC } = useWallet();
  
  const [buyAmount, setBuyAmount] = useState('0.1');
  const [selectedToken, setSelectedToken] = useState<'BNB' | 'USDT' | 'ETH'>('BNB');
  
  // Address states
  const [transferAddress, setTransferAddress] = useState('');
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string|null>(null);

  // Price states
  const [tokenPrice, setTokenPrice] = useState(0);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string|null>(null);

  // Transaction states
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStep, setTransactionStep] = useState('');
  const [isDeeplinkFlow, setIsDeeplinkFlow] = useState(false);

  // Connection states
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if user is on BSC
  const isOnBSC = () => {
    const validChainIds = [56, 97]; // BSC Mainnet and Testnet
    return validChainIds.includes(chainId!);
  };

  // Enhanced address fetching with better error handling
  const fetchTransferAddress = useCallback(async () => {
    setIsAddressLoading(true);
    setAddressError(null);
    try {
      const response = await fetch('https://crfx.org/getTransferAddress', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const address = typeof data === 'string' ? data : data.address;
      
      if (!address || typeof address !== 'string') {
        throw new Error('Invalid address format received');
      }
      
      // Basic address validation
      if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid address format');
      }
      
      setTransferAddress(address);
    } catch (error: any) {
      console.error('Address fetch error:', error);
      setAddressError(`Failed to load address: ${error.message}`);
    } finally {
      setIsAddressLoading(false);
    }
  }, []);

  // Enhanced price fetching
  const fetchPrice = useCallback(async () => {
    setIsPriceLoading(true);
    setPriceError(null);
    try {
      const response = await fetch(`https://crfx.org/getPrice?token=${selectedToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      let price: number;
      if (typeof data === 'number') {
        price = data;
      } else if (typeof data.price === 'number') {
        price = data.price;
      } else {
        throw new Error('Invalid price format received');
      }
      
      if (price <= 0) {
        throw new Error('Invalid price value');
      }
      
      setTokenPrice(price);
    } catch (error: any) {
      console.error('Price fetch error:', error);
      setPriceError(`Failed to load price: ${error.message}`);
      
      // Fallback prices
      const fallbackPrices = { BNB: 0.000015, USDT: 0.005, ETH: 0.000002 };
      setTokenPrice(fallbackPrices[selectedToken]);
    } finally {
      setIsPriceLoading(false);
    }
  }, [selectedToken]);

  // Load data on component mount and token change
  useEffect(() => {
    fetchTransferAddress();
  }, [fetchTransferAddress]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  // Enhanced token calculation
  const calculateTokens = () => {
    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0 || tokenPrice <= 0) return '0';
    const tokens = amount * tokenPrice;

    return tokens.toFixed(2);
  };

  // Enhanced wallet connection
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
      toast.success('Wallet connected successfully! 🦊');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Quick amount selection
  const quickAmounts = ['0.1', '0.5', '1.0', '2.0'];
  
  const handleQuickAmount = (amount: string) => {
    setBuyAmount(amount);
  };

  // Mobile deeplink confirmation modal component
  const DeeplinkConfirmationModal = () => {
    if (!isDeeplinkFlow) return null;

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <h3>📱 Transaction Initiated</h3>
          <p>MetaMask should have opened on your device. Please complete the transaction in MetaMask app.</p>
          <div className={styles.modalButtons}>
            <button 
              onClick={handleTransactionCompleted}
              className={styles.confirmBtn}
            >
              ✅ I completed the transaction
            </button>
            <button 
              onClick={handleTransactionCancelled}
              className={styles.cancelBtn}
            >
              ❌ Cancel
            </button>
          </div>
          <p className={styles.modalNote}>
            💡 If MetaMask didn't open, make sure you have the MetaMask app installed on your device.
          </p>
        </div>
      </div>
    );
  };

  // Handle mobile deeplink flow completion
  const handleTransactionCompleted = async () => {
    setIsDeeplinkFlow(false);
    setTransactionStep('Verifying transaction...');
    
    try {
      // For deeplink flow, we need to verify differently
      // This could involve polling recent transactions or asking for tx hash
      const verificationResponse = await fetch('https://crfx.org/verifyDeeplinkTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: account,
          amountSent: buyAmount,
          symbol: selectedToken,
          timestamp: Date.now()
        }),
      });

      const verificationData = await verificationResponse.json();

      if (verificationData.success) {
        toast.success("🎉 Purchase successful! CRFX tokens will be distributed to your wallet! 🦊");
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B35', '#4ECDC4', '#45B7D1']
        });
        setBuyAmount('0.1');
      } else {
        throw new Error(verificationData.message || 'Transaction verification failed');
      }
    } catch (error: any) {
      toast.error(`Verification failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setTransactionStep('');
    }
  };

  const handleTransactionCancelled = () => {
    setIsDeeplinkFlow(false);
    setIsProcessing(false);
    setTransactionStep('');
    toast.info('Transaction cancelled');
  };

  // Enhanced purchase function with mobile deeplink support
  const handleBuy = async () => {
    if (!isConnected) {
      await handleConnectWallet();
      return;
    }

    if (!isOnBSC()) {
      try {
        await switchToBSC();
      } catch (error) {
        toast.error('Please switch to BSC network manually');
        return;
      }
    }

    if (isAddressLoading) {
      toast.error('Transfer address is still loading. Please wait.');
      return;
    }

    if (addressError) {
      toast.error(`Address error: ${addressError}`);
      return;
    }

    if (priceError) {
      toast.error(`Price error: ${priceError}`);
      return;
    }

    const amount = parseFloat(buyAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    setTransactionStep('Preparing transaction...');

    try {
      let transaction: any;
      
      if (selectedToken === 'BNB') {
        // For BNB transfers
        const valueInWei = Math.floor(amount * 1e18);
        transaction = {
          from: account,
          to: transferAddress,
          value: `0x${valueInWei.toString(16)}`,
          chainId: 56, // BSC chainId for deeplink
        };
      } else {
        // Token contract addresses on BSC
        const tokenContracts = {
          USDT: '0x55d398326f99059fF775485246999027B3197955',
          ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
        };

        const tokenAmount = Math.floor(amount * 1e18);
        
        const transferData = 
          '0xa9059cbb' +
          transferAddress.slice(2).padStart(64, '0') +
          tokenAmount.toString(16).padStart(64, '0');

        transaction = {
          from: account,
          to: tokenContracts[selectedToken],
          data: transferData,
          chainId: 56,
        };
      }

      setTransactionStep('Sending transaction...');
      
      const result = await sendTransaction(transaction);
        //@ts-ignore
      if (result.isDeeplink) {
        // Mobile deeplink flow
        setIsDeeplinkFlow(true);
        setTransactionStep('Please complete transaction in MetaMask app...');
      } else {
        // Desktop flow - continue with normal verification
        //@ts-ignore
        if (!result.transactionHash) {
          throw new Error('Transaction failed - no hash received');
        }

        setTransactionStep('Transaction sent, waiting for confirmation...');
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        setTransactionStep('Verifying transaction with server...');
        
        const verificationResponse = await fetch('https://crfx.org/verifyAndDistributeTokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            //@ts-ignore
            txHash: result.transactionHash,
            userAddress: account,
            amountSent: amount.toString(),
            symbol: selectedToken,
          }),
        });

        const verificationData = await verificationResponse.json();

        if (!verificationResponse.ok || verificationData.error || !verificationData.success) {
          const errorMessage = verificationData?.error || 
                             verificationData?.message || 
                             `Server error: ${verificationResponse.status}`;
          throw new Error(errorMessage);
        }

        toast.success("🎉 Purchase successful! CRFX tokens will be distributed to your wallet! 🦊");
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B35', '#4ECDC4', '#45B7D1']
        });

        setBuyAmount('0.1');
        setTransactionStep('');
        setIsProcessing(false);
      }

    } catch (error: any) {
      console.error('Purchase error:', error);
      
      let errorMessage = '';
      
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in your wallet for this transaction.';
      } else if (error.message.includes('User denied') || error.code === 4001) {
        errorMessage = 'Transaction was cancelled by user.';
      } else if (error.code === -32602) {
        errorMessage = 'Invalid transaction parameters.';
      } else {
        errorMessage = error.message || 'Unknown error occurred.';
      }
      
      toast.error(errorMessage);
      
      if (!isDeeplinkFlow) {
        setIsProcessing(false);
        setTransactionStep('');
      }
    }
  };

  return (
    <>
      <motion.div 
        className={styles.purchaseWidget}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      >
        {/* Widget Header */}
        <div className={styles.widgetHeader}>
          <h3>🦊 CRFX PRESALE</h3>
          {isMobile() && (
            <div className={styles.mobileIndicator}>📱 Mobile Optimized</div>
          )}
        </div>

        {/* Raised Amount & Progress */}
        <div className={styles.raisedSection}>
          <div className={styles.raisedLabel}>RAISED: $1,295,926</div>
          <div className={styles.stageInfo}>
            <span>Stage 1/9</span>
            <span>11.84% of target</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: "11.84%" }}></div>
            <span className={styles.progressPercentage}>11.84%</span>
          </div>
          <div className={styles.priceRow}>
            <span>Current: $0.005</span>
            <span>Next: $0.006</span>
          </div>
        </div>

        {/* Connection Status */}
        {isConnected && account && (
          <div className={styles.connectionStatus}>
            <span className={styles.connectedDot}></span>
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
            {!isOnBSC() && <div className={styles.wrongNetwork}>⚠️ Switch to BSC</div>}
          </div>
        )}

        {/* Token Selection */}
        <div className={styles.paymentMethod}>
          <label>💰 Pay with {selectedToken}</label>
          <div className={styles.tokenSelector}>
            <button 
              className={`${styles.tokenBtn} ${selectedToken === 'BNB' ? styles.active : ''}`}
              onClick={() => setSelectedToken('BNB')}
              disabled={isProcessing}
              type="button"
            >
              BNB
            </button>
            <button 
              className={`${styles.tokenBtn} ${selectedToken === 'USDT' ? styles.active : ''}`}
              onClick={() => setSelectedToken('USDT')}
              disabled={isProcessing}
              type="button"
            >
              USDT
            </button>
            <button 
              className={`${styles.tokenBtn} ${selectedToken === 'ETH' ? styles.active : ''}`}
              onClick={() => setSelectedToken('ETH')}
              disabled={isProcessing}
              type="button"
            >
              ETH
            </button>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className={styles.quickAmounts}>
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              className={`${styles.quickAmountBtn} ${buyAmount === amount ? styles.active : ''}`}
              onClick={() => handleQuickAmount(amount)}
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
                type="text"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                disabled={isProcessing}
                className={styles.amountInput}
                placeholder="0.0"
              />
              <span className={styles.inputLabel}>Pay with {selectedToken}</span>
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
        {isProcessing && !isDeeplinkFlow && (
          <div className={styles.statusMessage}>
            <span className={styles.spinner}>🔄</span>
            {transactionStep}
          </div>
        )}

        {addressError && (
          <div className={styles.errorMessage}>
            Address loading error. 
            <button onClick={fetchTransferAddress} className={styles.retryBtn}>
              Retry
            </button>
          </div>
        )}

        {priceError && (
          <div className={styles.errorMessage}>
            Price loading error. 
            <button onClick={fetchPrice} className={styles.retryBtn}>
              Retry
            </button>
          </div>
        )}

        {/* Buy Button */}
        <motion.button
          className={styles.buyButton}
          onClick={handleBuy}
          disabled={isProcessing || isAddressLoading || isPriceLoading || !!addressError || !!priceError}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isProcessing ? (
            <span>🔄 Processing...</span>
          ) : !isConnected ? (
            <span>🦊 Connect Wallet</span>
          ) : !isOnBSC() ? (
            <span>🔄 Switch to BSC</span>
          ) : (
            <span>🚀 Buy CRFX Now</span>
          )}
        </motion.button>
      </motion.div>

      {/* Mobile Deeplink Confirmation Modal */}
      <DeeplinkConfirmationModal />
    </>
  );
};

export default PurchaseWidget;