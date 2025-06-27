// app/wagmi.config.ts - Обновленная версия с исправлениями для Trust Wallet
import { createConfig, http } from 'wagmi';
import { bsc, mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  trustWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
  phantomWallet,
  injectedWallet,
  binanceWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Настройка кошельков с специальной поддержкой Trust Wallet
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended for BSC',
      wallets: [
        binanceWallet, // Лучший для BSC
        trustWallet,   // Популярен, но требует оптимизации
        metaMaskWallet,
      ],
    },
    {
      groupName: 'Other Wallets',
      wallets: [
        coinbaseWallet,
        walletConnectWallet,
        rainbowWallet,
        phantomWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: 'CrazyFox Presale',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '68e6993e072db866f348eddaa67146e8',
  }
);

export const config = createConfig({
  connectors,
  chains: [
    bsc,      // BSC первым для оптимизации
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  transports: {
    // Множественные RPC для BSC для надежности
    [bsc.id]: http('https://bsc-dataseed1.binance.org'),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
});

// Глобальные типы
declare global {
  interface Window {
    BinanceChain?: {
      bnbSign?: (address: string, message: string) => Promise<{ publicKey: string; signature: string }>;
      switchNetwork?: (networkId: string) => Promise<string>;
      requestAccounts?: () => Promise<string[]>;
      on?: (eventName: string, callback: Function) => void;
      removeListener?: (eventName: string, callback: Function) => void;
    };
    ethereum?: any;
    trustwallet?: any;
  }
}

// Улучшенная проверка Trust Wallet
export const isTrustWallet = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Проверяем множественные способы определения Trust Wallet
  return !!(
    window.ethereum?.isTrust ||
    window.ethereum?.isTrustWallet ||
    window.trustwallet ||
    navigator.userAgent.includes('Trust') ||
    navigator.userAgent.includes('TrustWallet')
  );
};

// Проверка Binance Wallet
export const isBinanceWallet = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(
    window.BinanceChain && 
    (window.ethereum?.isBinanceWallet || window.ethereum?.isBinance)
  );
};

// Функция для получения оптимальных параметров газа для Trust Wallet
export const getTrustWalletOptimalGas = async (): Promise<{gasLimit: bigint, gasPrice: bigint}> => {
  try {
    // Получаем актуальный gas price для BSC
    const response = await fetch('https://api.bscscan.com/api?module=gastracker&action=gasoracle');
    const data = await response.json();
    
    let gasPriceGwei = 5; // Default 5 gwei
    
    if (data.status === '1' && data.result) {
      // Используем FastGasPrice для Trust Wallet для большей надежности
      gasPriceGwei = Math.max(parseInt(data.result.FastGasPrice), 5);
    }
    
    return {
      gasLimit: BigInt(25000), // Увеличенный лимит для Trust Wallet
      gasPrice: BigInt(gasPriceGwei * 1000000000) // Convert to wei
    };
  } catch (error) {
    console.error('Failed to get optimal gas for Trust Wallet:', error);
    return {
      gasLimit: BigInt(25000),
      gasPrice: BigInt(5000000000) // 5 gwei fallback
    };
  }
};

// Функция переключения на BSC для Trust Wallet
export const switchToBSCInTrustWallet = async (): Promise<boolean> => {
  if (!isTrustWallet()) return false;
  
  try {
    console.log('Attempting BSC switch in Trust Wallet...');
    
    if (window.ethereum) {
      try {
        // Сначала пробуем переключиться
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }], // BSC chainId
        });
        console.log('BSC switch successful in Trust Wallet');
        return true;
      } catch (switchError: any) {
        // Если сеть не добавлена, добавляем её
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x38',
                chainName: 'Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: [
                  'https://bsc-dataseed1.binance.org',
                  'https://bsc-dataseed2.binance.org',
                  'https://bsc-dataseed3.binance.org'
                ],
                blockExplorerUrls: ['https://bscscan.com'],
              }],
            });
            console.log('BSC network added to Trust Wallet');
            return true;
          } catch (addError) {
            console.error('Failed to add BSC network to Trust Wallet:', addError);
          }
        } else {
          console.error('Trust Wallet switch error:', switchError);
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Failed to switch to BSC in Trust Wallet:', error);
    return false;
  }
};

// Функция переключения на BSC для Binance Wallet
export const switchToBSCInBinanceWallet = async (): Promise<boolean> => {
  if (!isBinanceWallet()) return false;
  
  try {
    console.log('Attempting BSC switch in Binance Wallet...');
    
    // Метод 1: Через BinanceChain API
    if (window.BinanceChain?.switchNetwork) {
      try {
        await window.BinanceChain.switchNetwork('bsc-mainnet');
        console.log('BSC switch successful via BinanceChain API');
        return true;
      } catch (error) {
        console.log('BinanceChain.switchNetwork failed, trying fallback...');
      }
    }
    
    // Метод 2: Через стандартный ethereum provider
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
        console.log('BSC switch successful via ethereum provider');
        return true;
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x38',
                chainName: 'Binance Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: ['https://bsc-dataseed1.binance.org'],
                blockExplorerUrls: ['https://bscscan.com'],
              }],
            });
            console.log('BSC network added and switched');
            return true;
          } catch (addError) {
            console.error('Failed to add BSC network:', addError);
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Failed to switch to BSC in Binance Wallet:', error);
    return false;
  }
};

// Универсальная функция автоматического переключения на BSC
export const autoSwitchToBSC = async (switchChain: Function): Promise<boolean> => {
  try {
    console.log('Auto-switching to BSC...');
    
    // Специальная обработка для Trust Wallet
    if (isTrustWallet()) {
      const switched = await switchToBSCInTrustWallet();
      if (switched) return true;
    }
    
    // Специальная обработка для Binance Wallet
    if (isBinanceWallet()) {
      const switched = await switchToBSCInBinanceWallet();
      if (switched) return true;
    }
    
    // Для всех остальных кошельков используем wagmi
    await switchChain({ chainId: bsc.id });
    return true;
    
  } catch (error: any) {
    console.error('Auto BSC switch failed:', error);
    
    // Пытаемся добавить сеть если её нет
    if (error.code === 4902 && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x38',
            chainName: 'Binance Smart Chain',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18,
            },
            rpcUrls: [
              'https://bsc-dataseed1.binance.org',
              'https://bsc-dataseed2.binance.org'
            ],
            blockExplorerUrls: ['https://bscscan.com'],
          }],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add BSC network:', addError);
      }
    }
    
    return false;
  }
};

// Функция для проверки состояния BSC сети
export const checkBSCNetworkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://bsc-dataseed1.binance.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });
    
    const data = await response.json();
    return !!data.result;
  } catch (error) {
    console.error('BSC network health check failed:', error);
    return false;
  }
};