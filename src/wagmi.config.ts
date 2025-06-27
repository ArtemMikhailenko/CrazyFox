// app/wagmi.config.ts - Улучшенная версия с поддержкой автоматического BSC
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

// Настройка кошельков с приоритетом для BSC
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended for BSC',
      wallets: [
        binanceWallet, // Первый для BSC
        trustWallet,   // Популярен в BSC экосистеме
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
    bsc,      // BSC первым (это важно!)
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  transports: {
    [bsc.id]: http('https://bsc-dataseed1.binance.org'),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
});

// Глобальные типы для Binance Wallet
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
  }
}

// Проверка Binance Wallet
export const isBinanceWallet = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(
    window.BinanceChain && 
    (window.ethereum?.isBinanceWallet || window.ethereum?.isBinance)
  );
};

// Улучшенная функция переключения на BSC в Binance Wallet
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
          params: [{ chainId: '0x38' }], // BSC chainId в hex
        });
        console.log('BSC switch successful via ethereum provider');
        return true;
      } catch (switchError: any) {
        // Если сеть не добавлена, добавляем её
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

// Общая функция для автоматического переключения на BSC для любого кошелька
export const autoSwitchToBSC = async (switchChain: Function): Promise<boolean> => {
  try {
    console.log('Auto-switching to BSC...');
    
    // Проверяем если это Binance Wallet
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
            rpcUrls: ['https://bsc-dataseed1.binance.org'],
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