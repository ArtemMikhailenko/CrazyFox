'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// === Заглушка для кошелька — замените на вашу реальную интеграцию ===
const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        const net   = await (window as any).ethereum.request({ method: 'net_version' });
        setAccount(accts[0]);
        setIsConnected(true);
        setChainId(parseInt(net, 10));
      } catch (e) {
        console.error('Wallet connection failed:', e);
        alert('Не удалось подключить кошелёк');
      }
    } else {
      alert('Установите MetaMask!');
    }
  };

  const sendTransaction = async (tx: any) => {
    // Здесь должна быть реальная отправка через ethers.js/web3.js
    return new Promise<{ transactionHash: string }>(resolve =>
      setTimeout(() => resolve({ transactionHash: '0x' + Math.random().toString(16).slice(2) }), 2000)
    );
  };

  return { account, isConnected, chainId, connectWallet, sendTransaction };
};

export default function CRFXPresale() {
  const { account, isConnected, chainId, connectWallet, sendTransaction } = useWallet();

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<'BNB' | 'USDT' | 'ETH'>('BNB');
  const [buyAmount, setBuyAmount] = useState('0.01');

  // Transfer address state
  const [transferAddress, setTransferAddress] = useState('');
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Price state
  const [tokenPrice, setTokenPrice] = useState(0);
  const [isPriceLoading, setIsPriceLoading] = useState(false);

  // Purchase processing
  const [isProcessing, setIsProcessing] = useState(false);

  // Presale stats (можно получать отдельно, здесь для примера статично)
  const presaleStats = {
    totalRaised: 1_295_926,
    progress: 81.34,
    currentPrice: 0.005,
    nextPrice: 0.006,
    stage: '4/15',
    listingPrice: 0.026,
  };

  // 1) GET https://crfx.org/getTransferAddress
  const fetchTransferAddress = useCallback(async () => {
    setIsAddressLoading(true);
    setAddressError(null);
    try {
      const res = await fetch('https://crfx.org/getTransferAddress');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Сервер может вернуть plain-string или { address }
      const address = typeof data === 'string' ? data : data.address;
      if (!address) throw new Error('No address in response');
      setTransferAddress(address);
    } catch (err: any) {
      console.error('fetchTransferAddress:', err);
      setAddressError('Не удалось загрузить адрес. Попробуйте снова.');
    } finally {
      setIsAddressLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransferAddress();
  }, [fetchTransferAddress]);

  // 2) GET https://crfx.org/getPrice?token=...
  const fetchPrice = useCallback(async () => {
    setIsPriceLoading(true);
    try {
      const res = await fetch(`https://crfx.org/getPrice?token=${selectedToken}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      // Если сервер вернул { error }
      if (payload && typeof payload === 'object' && 'error' in payload) {
        throw new Error(payload.error);
      }
      // Распознаём формат
      const price = typeof payload === 'number'
        ? payload
        : typeof payload.price === 'number'
          ? payload.price
          : (() => { throw new Error('Invalid price format'); })();
      setTokenPrice(price);
    } catch (err: any) {
      console.error('fetchPrice error:', err);
      // Фоллбэк, если цена не загрузилась
      const fallback = { BNB: 0.000015, USDT: 0.005, ETH: 0.000002 };
      setTokenPrice(fallback[selectedToken]);
      alert(`Не удалось загрузить цену: ${err.message}`);
    } finally {
      setIsPriceLoading(false);
    }
  }, [selectedToken]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  // Helpers
  const calculateTokens = () => {
    // заменяем запятую на точку перед parseFloat
    const amt = parseFloat(buyAmount.replace(',', '.')) || 0;
    return tokenPrice > 0 ? +(amt / tokenPrice).toFixed(2) : 0;
  };
  const usdValue = () => (calculateTokens() * presaleStats.currentPrice).toFixed(2);

  // 3) POST https://crfx.org/verifyAndDistributeTokens
  const handleBuy = async () => {
    if (!isConnected) {
      alert('Сначала подключите кошелёк');
      return;
    }
    if (isAddressLoading) {
      alert('Адрес ещё загружается…');
      return;
    }
    if (addressError || !transferAddress) {
      alert(addressError || 'Адрес не получен');
      return;
    }
    const amt = parseFloat(buyAmount.replace(',', '.'));
    if (isNaN(amt) || amt <= 0) {
      alert('Введите корректную сумму');
      return;
    }
    if (![56, 97].includes(chainId!)) {
      alert('Переключитесь на Binance Smart Chain');
      return;
    }
    if (amt < 0.001) {
      alert(`Минимальная сумма 0.001 ${selectedToken}`);
      return;
    }

    setIsProcessing(true);
    try {
      // Подготовка параметров транзакции
      let txParams: any;
      if (selectedToken === 'BNB') {
        txParams = {
          to: transferAddress,
          value: (amt * 1e18).toString(16),
          gas: '21000',
        };
      } else {
        const contracts: Record<string, string> = {
          USDT: '0x55d398326f99059fF775485246999027B3197955',
          ETH:  '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
        };
        const data =
          '0xa9059cbb' +
          transferAddress.slice(2).padStart(64, '0') +
          Math.floor(amt * 1e18).toString(16).padStart(64, '0');
        txParams = { to: contracts[selectedToken], data, gas: '100000' };
      }

      // Отправляем транзакцию
      const { transactionHash } = await sendTransaction(txParams);

      // Верификация и распределение
      const res = await fetch('https://crfx.org/verifyAndDistributeTokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: transactionHash,
          userAddress: account,
          amountSent: buyAmount.replace(',', '.'),
          symbol: selectedToken,
        }),
      });

      const json = await res.json();
      // Читаем JSON при любом статусе
      if (!res.ok || json.error) {
        throw new Error(json.error || `Server error: ${res.status}`);
      }
      if (json.success) {
        alert(`✔ Успех! Вам распределят ${json.tokensDistributed} CRFX`);
        setShowModal(false);
        setBuyAmount('0.01');
      } else {
        throw new Error(json.message || 'Неизвестная ошибка');
      }
    } catch (err: any) {
      console.error('handleBuy error:', err);
      alert(`Ошибка покупки: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>CRFX Presale</h1>
      {!isConnected ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <button onClick={() => setShowModal(true)}>Buy CRFX</button>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              style={{
                background: '#222',
                padding: 20,
                borderRadius: 8,
                width: 320,
                color: '#fff',
              }}
            >
              <h2>Buy CRFX Tokens</h2>

              {/* Token selector */}
              <label>
                Token:
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value as any)}
                  disabled={isProcessing}
                >
                  <option value="BNB">BNB</option>
                  <option value="USDT">USDT</option>
                  <option value="ETH">ETH</option>
                </select>
              </label>

              {/* Amount input */}
              <label style={{ display: 'block', marginTop: 10 }}>
                Amount ({selectedToken}):
                <input
                  type="number"
                  min="0.001"
                  step="0.000001"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  disabled={isProcessing}
                />
              </label>

              {/* Price info */}
              <div style={{ marginTop: 10 }}>
                {isPriceLoading ? (
                  'Loading price…'
                ) : (
                  <>
                    Price: {tokenPrice} {selectedToken}
                    <br />
                    You receive: {calculateTokens()} CRFX
                    <br />
                    ≈ ${usdValue()} USD
                  </>
                )}
              </div>

              {/* Адрес перевода */}
              <div style={{ marginTop: 10, fontSize: 12, color: '#f90' }}>
                {isAddressLoading && 'Loading address…'}
                {addressError && (
                  <>
                    {addressError}{' '}
                    <button onClick={fetchTransferAddress}>Retry</button>
                  </>
                )}
                {!isAddressLoading && !addressError && transferAddress && (
                  <>Transfer address: {transferAddress}</>
                )}
              </div>

              {/* Actions */}
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button onClick={() => setShowModal(false)} disabled={isProcessing}>
                  Cancel
                </button>
                <button
                  onClick={handleBuy}
                  disabled={
                    isProcessing ||
                    isPriceLoading ||
                    isAddressLoading ||
                    !!addressError ||
                    parseFloat(buyAmount.replace(',', '.')) <= 0
                  }
                >
                  {isProcessing ? 'Processing…' : 'Buy Now'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
