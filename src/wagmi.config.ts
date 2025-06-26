// app/wagmi.config.ts - Updated with Binance Wallet
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
} from '@rainbow-me/rainbowkit/wallets';

// Импортируем Binance Wallet
import { binanceWallet } from '@rainbow-me/rainbowkit/wallets';

// Настройка кошельков с Binance Wallet в приоритете для BSC
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        binanceWallet, // Добавляем Binance Wallet первым для BSC
        metaMaskWallet,
        trustWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
    {
      groupName: 'Other',
      wallets: [
        rainbowWallet,
        phantomWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: 'CrazyFox Presale',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  }
);

export const config = createConfig({
  connectors,
  chains: [
    bsc, // BSC первым для совместимости с Binance Wallet
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  transports: {
    // Используем несколько RPC для BSC для лучшей надежности
    [bsc.id]: http('https://bsc-dataseed1.binance.org'),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
});

// Дополнительная конфигурация для Binance Wallet
declare global {
  interface Window {
    BinanceChain?: {
      bnbSign?: (address: string, message: string) => Promise<{ publicKey: string; signature: string }>;
      switchNetwork?: (networkId: string) => Promise<string>;
      requestAccounts?: () => Promise<string[]>;
      on?: (eventName: string, callback: Function) => void;
      removeListener?: (eventName: string, callback: Function) => void;
    };
  }
}

// Utility функция для проверки Binance Wallet
export const isBinanceWallet = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window.BinanceChain && window.ethereum?.isBinanceWallet);
};

// Функция для автоматического переключения на BSC в Binance Wallet
export const switchToBSCInBinanceWallet = async (): Promise<boolean> => {
  if (!isBinanceWallet()) return false;
  
  try {
    if (window.BinanceChain?.switchNetwork) {
      await window.BinanceChain.switchNetwork('bsc-mainnet');
      return true;
    }
    
    // Fallback через стандартный ethereum provider
    if (window.ethereum) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }], // BSC chainId
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to switch to BSC in Binance Wallet:', error);
    return false;
  }
};