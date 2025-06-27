// app/wagmi.config.ts - Исправленная версия без TypeScript ошибок
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

// Специальная настройка для Trust Wallet с множественными RPC
const BSC_RPC_URLS = [
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed2.binance.org', 
  'https://bsc-dataseed3.binance.org',
  'https://bsc-dataseed4.binance.org',
  'https://bsc-dataseed1.defibit.io',
  'https://bsc-dataseed1.ninicoin.io',
];

// Функция для получения случайного RPC для Trust Wallet
const getRandomBSCRPC = (): string => {
  const randomIndex = Math.floor(Math.random() * BSC_RPC_URLS.length);
  return BSC_RPC_URLS[randomIndex];
};

// Настройка кошельков с приоритетом для BSC
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Best for BSC',
      wallets: [
        binanceWallet, // Лучший для BSC
        trustWallet,   // Популярен, требует специальной настройки
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
    // Исправленная конфигурация без timeout в fetchOptions
    [bsc.id]: http(getRandomBSCRPC(), {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
  // Увеличиваем интервал опроса для Trust Wallet
  pollingInterval: 4000,
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
    // Убираем дублирующее объявление ethereum - используем расширение существующего типа
    trustwallet?: any;
    TrustWeb3Provider?: any;
  }
}

// Улучшенная проверка Trust Wallet с типизацией
export const isTrustWallet = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const ethereum = (window as any).ethereum;
  
  const checks = [
    ethereum?.isTrust,
    ethereum?.isTrustWallet,
    (window as any).trustwallet,
    (window as any).TrustWeb3Provider,
    navigator.userAgent.includes('Trust'),
    navigator.userAgent.includes('TrustWallet'),
    ethereum?.providers?.some((p: any) => p.isTrust),
  ];
  
  return checks.some(check => !!check);
};
// Проверка Binance Wallet с типизацией
export const isBinanceWallet = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const ethereum = (window as any).ethereum;
  const binanceChain = (window as any).BinanceChain;
  
  return !!(
    binanceChain && 
    (ethereum?.isBinanceWallet || ethereum?.isBinance)
  );
};

// Функция для получения оптимальных параметров газа для Trust Wallet на BSC
export const getTrustWalletOptimalGas = async (): Promise<{gasLimit: bigint, gasPrice: bigint}> => {
  try {
    let gasPriceGwei = 5; // МИНИМУМ 5 gwei для Trust Wallet
    
    // Пробуем получить актуальный gas price
    try {
      const response = await fetch('https://api.bscscan.com/api?module=gastracker&action=gasoracle');
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === '1' && data.result) {
          const safePriceGwei = parseInt(data.result.SafeGasPrice, 10);
          if (!isNaN(safePriceGwei)) {
            // Для Trust Wallet ВСЕГДА минимум 5 gwei, даже если сеть предлагает меньше
            gasPriceGwei = Math.max(safePriceGwei + 2, 5);
          }
        }
      }
    } catch (error) {
      console.log('Failed to get BSC gas price, using 5 gwei minimum');
    }
    
    return {
      gasLimit: BigInt(30000), // Увеличенный лимит для Trust Wallet
      gasPrice: BigInt(gasPriceGwei * 1000000000) // Convert to wei, минимум 5 gwei
    };
  } catch (error) {
    console.error('Failed to get optimal gas for Trust Wallet:', error);
    return {
      gasLimit: BigInt(30000),
      gasPrice: BigInt(5000000000) // 5 gwei обязательный минимум
    };
  }
};

// Безопасная функция для запроса к ethereum provider
const safeEthereumRequest = async (method: string, params: any[] = []): Promise<any> => {
  if (!window.ethereum?.request) {
    throw new Error('Ethereum provider not available');
  }
  
  return window.ethereum.request({ method, params });
};

// Улучшенная функция переключения на BSC для Trust Wallet
export const switchToBSCInTrustWallet = async (): Promise<boolean> => {
  if (!isTrustWallet()) return false;
  
  try {
    console.log('Attempting BSC switch in Trust Wallet...');
    
    // Проверяем текущую сеть
    try {
      const currentChainId = await safeEthereumRequest('eth_chainId');
      
      if (currentChainId === '0x38') {
        console.log('Already on BSC network');
        return true;
      }
    } catch (error) {
      console.log('Failed to get current chain ID:', error);
    }
    
    try {
      // Пробуем переключиться
      await safeEthereumRequest('wallet_switchEthereumChain', [{ chainId: '0x38' }]);
      
      console.log('BSC switch successful in Trust Wallet');
      return true;
      
    } catch (switchError: any) {
      console.log('Switch error:', switchError);
      
      // Если сеть не добавлена, добавляем её
      if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain')) {
        try {
          await safeEthereumRequest('wallet_addEthereumChain', [{
            chainId: '0x38',
            chainName: 'Smart Chain',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18,
            },
            rpcUrls: BSC_RPC_URLS,
            blockExplorerUrls: ['https://bscscan.com'],
            iconUrls: ['https://cryptologos.cc/logos/bnb-bnb-logo.png'],
          }]);
          
          console.log('BSC network added to Trust Wallet');
          
          // После добавления пробуем переключиться еще раз
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await safeEthereumRequest('wallet_switchEthereumChain', [{ chainId: '0x38' }]);
          
          return true;
        } catch (addError) {
          console.error('Failed to add BSC network to Trust Wallet:', addError);
        }
      } else {
        console.error('Trust Wallet switch error:', switchError);
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
    try {
      await safeEthereumRequest('wallet_switchEthereumChain', [{ chainId: '0x38' }]);
      console.log('BSC switch successful via ethereum provider');
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await safeEthereumRequest('wallet_addEthereumChain', [{
            chainId: '0x38',
            chainName: 'Binance Smart Chain',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18,
            },
            rpcUrls: BSC_RPC_URLS,
            blockExplorerUrls: ['https://bscscan.com'],
          }]);
          console.log('BSC network added and switched');
          return true;
        } catch (addError) {
          console.error('Failed to add BSC network:', addError);
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Failed to switch to BSC in Binance Wallet:', error);
    return false;
  }
};

// Улучшенная универсальная функция автоматического переключения на BSC
export const autoSwitchToBSC = async (switchChain: Function): Promise<boolean> => {
  try {
    console.log('Auto-switching to BSC...');
    
    // Специальная обработка для Trust Wallet с дополнительными проверками
    if (isTrustWallet()) {
      console.log('Trust Wallet detected, using specialized BSC switch...');
      
      // Дополнительная проверка состояния Trust Wallet
      try {
        const accounts = await safeEthereumRequest('eth_accounts');
        if (!accounts || accounts.length === 0) {
          throw new Error('Trust Wallet not properly connected');
        }
      } catch (error) {
        console.error('Trust Wallet connection check failed:', error);
      }
      
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
    
    // Для Trust Wallet показываем специальную помощь
    if (isTrustWallet()) {
      console.log('Trust Wallet auto-switch failed, trying manual network addition...');
      
      // Пытаемся добавить сеть если её нет
      try {
        await safeEthereumRequest('wallet_addEthereumChain', [{
          chainId: '0x38',
          chainName: 'Smart Chain',
          nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB', 
            decimals: 18,
          },
          rpcUrls: BSC_RPC_URLS,
          blockExplorerUrls: ['https://bscscan.com'],
        }]);
        return true;
      } catch (addError) {
        console.error('Failed to add BSC network for Trust Wallet:', addError);
      }
    }
    
    // Общий fallback для добавления сети
    if (error.code === 4902) {
      try {
        await safeEthereumRequest('wallet_addEthereumChain', [{
          chainId: '0x38',
          chainName: 'Binance Smart Chain',
          nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18,
          },
          rpcUrls: BSC_RPC_URLS,
          blockExplorerUrls: ['https://bscscan.com'],
        }]);
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
    return Boolean(data.result);
  } catch (error) {
    console.error('BSC network health check failed:', error);
    return false;
  }
};

export const validateTrustWalletTransaction = async (
  to: string, 
  value: bigint, 
  userAddress: string
): Promise<{ isValid: boolean; errors: string[]; suggestions: string[] }> => {
  const errors: string[] = [];
  const suggestions: string[] = [];

  try {
    const ethereum = (window as any).ethereum;
    
    if (!ethereum) {
      errors.push('Ethereum provider not found');
      suggestions.push('Restart Trust Wallet app');
      return { isValid: false, errors, suggestions };
    }

    // Остальные проверки с type assertion...
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (accounts.length === 0 || !accounts.includes(userAddress)) {
      errors.push('Wallet not properly connected');
      suggestions.push('Reconnect wallet');
    }

    const chainId = await ethereum.request({ method: 'eth_chainId' });
    if (chainId !== '0x38') {
      errors.push('Not on BSC network');
      suggestions.push('Switch to BSC network manually');
    }

    const balance = await ethereum.request({
      method: 'eth_getBalance',
      params: [userAddress, 'latest'],
    });
    
    const balanceWei = BigInt(balance);
    const gasBuffer = BigInt('5000000000000000'); // 0.005 BNB буфер для газа
    
    if (balanceWei < (value + gasBuffer)) {
      errors.push('Insufficient balance for transaction + gas');
      suggestions.push('Reduce transaction amount or add more BNB');
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    };

  } catch (error: any) {
    errors.push(`Validation error: ${error.message}`);
    suggestions.push('Restart Trust Wallet and try again');
    
    return { isValid: false, errors, suggestions };
  }
};
// Функция для автоматического исправления проблем Trust Wallet
export const autoFixTrustWalletIssues = async (): Promise<boolean> => {
  if (!isTrustWallet()) return false;

  try {
    console.log('Auto-fixing Trust Wallet issues...');

    // Исправление 1: Переподключение аккаунтов
    try {
      await safeEthereumRequest('wallet_requestPermissions', [{ eth_accounts: {} }]);
    } catch (permError) {
      console.log('Permission request failed:', permError);
    }

    try {
      await safeEthereumRequest('eth_chainId');
      await safeEthereumRequest('net_version');
    } catch (networkError) {
      console.log('Network state refresh failed:', networkError);
    }

    // Исправление 3: Переключение RPC если возможно
    try {
      const randomRPC = getRandomBSCRPC();
      console.log('Suggesting RPC switch to:', randomRPC);
      
      // Здесь мы не можем автоматически поменять RPC в Trust Wallet,
      // но можем предложить пользователю
      return true;
    } catch (rpcError) {
      console.log('RPC suggestion failed:', rpcError);
    }

    return true;
  } catch (error) {
    console.error('Auto-fix failed:', error);
    return false;
  }
};

// Экспорт дополнительных утилит для Trust Wallet
export const trustWalletUtils = {
  getRandomBSCRPC,
  validateTrustWalletTransaction,
  autoFixTrustWalletIssues,
  isTrustWallet,
  switchToBSCInTrustWallet,
  getTrustWalletOptimalGas,
  safeEthereumRequest,
};

// Константы для Trust Wallet
export const TRUST_WALLET_CONSTANTS = {
  MIN_GAS_LIMIT: 25000,
  SAFE_GAS_LIMIT: 30000,
  MIN_GAS_PRICE_GWEI: 5,
  SAFE_GAS_PRICE_GWEI: 8,
  RECOMMENDED_GAS_BUFFER: '0.003', // 0.003 BNB
  BSC_CHAIN_ID: '0x38',
  BSC_CHAIN_ID_DECIMAL: 56,
};