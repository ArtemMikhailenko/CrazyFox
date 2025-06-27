// app/wagmi.config.ts - Виправлена версія з оптимізованими параметрами газу для BSC
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

// Оновлені RPC для кращої сумісності з Trust Wallet
const BSC_RPC_URLS = [
  'https://bsc-dataseed.bnbchain.org', // Офіційний Binance endpoint
  'https://rpc.ankr.com/bsc',
  'https://bsc-rpc.publicnode.com',
  'https://bsc.drpc.org',
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed2.binance.org',
];

// Функція для отримання випадкового RPC
const getRandomBSCRPC = (): string => {
  const randomIndex = Math.floor(Math.random() * BSC_RPC_URLS.length);
  return BSC_RPC_URLS[randomIndex];
};

// Настройка кошельків з пріоритетом для BSC
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Best for BSC',
      wallets: [
        binanceWallet,
        trustWallet,
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
    bsc,
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  transports: {
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
  pollingInterval: 4000,
});

// Глобальні типи
declare global {
  interface Window {
    BinanceChain?: {
      bnbSign?: (address: string, message: string) => Promise<{ publicKey: string; signature: string }>;
      switchNetwork?: (networkId: string) => Promise<string>;
      requestAccounts?: () => Promise<string[]>;
      on?: (eventName: string, callback: Function) => void;
      removeListener?: (eventName: string, callback: Function) => void;
    };
    trustwallet?: any;
    TrustWeb3Provider?: any;
  }
}

// Покращена перевірка Trust Wallet
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

// Перевірка Binance Wallet
export const isBinanceWallet = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const ethereum = (window as any).ethereum;
  const binanceChain = (window as any).BinanceChain;
  
  return !!(
    binanceChain && 
    (ethereum?.isBinanceWallet || ethereum?.isBinance)
  );
};

// ВИПРАВЛЕНА функція для отримання оптимальних параметрів газу
export const getTrustWalletOptimalGas = async (): Promise<{gasLimit: bigint, gasPrice: bigint}> => {
  try {
    let gasPriceGwei = 3; // ЗБІЛЬШЕНО мінімум до 3 gwei
    
    // Отримуємо актуальний gas price з BSC API
    try {
      const response = await fetch('https://api.bscscan.com/api?module=gastracker&action=gasoracle');
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === '1' && data.result) {
          const safePriceGwei = parseInt(data.result.SafeGasPrice, 10);
          if (!isNaN(safePriceGwei)) {
            // Для Trust Wallet використовуємо SafeGasPrice + буфер, мінімум 3 gwei
            gasPriceGwei = Math.max(safePriceGwei + 1, 3);
            
            // Максимум 15 gwei для стандартних операцій
            gasPriceGwei = Math.min(gasPriceGwei, 15);
          }
        }
      }
    } catch (error) {
      console.log('Failed to get BSC gas price, using 3 gwei default');
    }
    
    return {
      gasLimit: BigInt(21000), // Стандартний газ ліміт для BNB трансферів
      gasPrice: BigInt(gasPriceGwei * 1000000000) // Конвертуємо в wei
    };
  } catch (error) {
    console.error('Failed to get optimal gas for Trust Wallet:', error);
    return {
      gasLimit: BigInt(21000),
      gasPrice: BigInt(3000000000) // 3 gwei як fallback
    };
  }
};

// Функція для отримання оптимального gas price для різних кошельків
export const getOptimalGasPrice = async (walletType: 'trust' | 'binance' | 'other' = 'other'): Promise<bigint> => {
  try {
    const response = await fetch('https://api.bscscan.com/api?module=gastracker&action=gasoracle');
    let baseGasPrice = 3; // Базовий 3 gwei
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === '1' && data.result) {
        const safePriceGwei = parseInt(data.result.SafeGasPrice, 10);
        if (!isNaN(safePriceGwei)) {
          baseGasPrice = Math.max(safePriceGwei, 3);
        }
      }
    }
    
    // Налаштування для різних кошельків
    switch (walletType) {
      case 'trust':
        // Trust Wallet потребує стабільної ціни газу
        return BigInt(Math.max(baseGasPrice + 1, 3) * 1000000000);
      case 'binance':
        // Binance Wallet оптимізований для BSC
        return BigInt(Math.max(baseGasPrice, 3) * 1000000000);
      default:
        // Інші кошельки
        return BigInt(Math.max(baseGasPrice + 1, 3) * 1000000000);
    }
  } catch (error) {
    console.error('Failed to get optimal gas price:', error);
    // Fallback значення для різних кошельків
    const fallbackPrices = {
      trust: 4, // 4 gwei для Trust Wallet
      binance: 3, // 3 gwei для Binance Wallet
      other: 3 // 3 gwei для інших
    };
    return BigInt(fallbackPrices[walletType] * 1000000000);
  }
};

// Безпечна функція для запиту до ethereum provider
const safeEthereumRequest = async (method: string, params: any[] = []): Promise<any> => {
  if (!window.ethereum?.request) {
    throw new Error('Ethereum provider not available');
  }
  
  return window.ethereum.request({ method, params });
};

// ВИПРАВЛЕНА функція переключення на BSC для Trust Wallet
export const switchToBSCInTrustWallet = async (): Promise<boolean> => {
  if (!isTrustWallet()) return false;
  
  try {
    console.log('Attempting BSC switch in Trust Wallet...');
    
    // Перевіряємо поточну мережу
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
      // Спроба переключитися
      await safeEthereumRequest('wallet_switchEthereumChain', [{ chainId: '0x38' }]);
      
      console.log('BSC switch successful in Trust Wallet');
      return true;
      
    } catch (switchError: any) {
      console.log('Switch error:', switchError);
      
      // Якщо мережа не додана, додаємо її
      if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain')) {
        try {
          await safeEthereumRequest('wallet_addEthereumChain', [{
            chainId: '0x38',
            chainName: 'BNB Smart Chain',
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
          
          // Після додавання пробуємо переключитися ще раз
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await safeEthereumRequest('wallet_switchEthereumChain', [{ chainId: '0x38' }]);
          
          return true;
        } catch (addError) {
          console.error('Failed to add BSC network to Trust Wallet:', addError);
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Failed to switch to BSC in Trust Wallet:', error);
    return false;
  }
};

// Функція переключення на BSC для Binance Wallet
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
    
    // Метод 2: Через стандартний ethereum provider
    try {
      await safeEthereumRequest('wallet_switchEthereumChain', [{ chainId: '0x38' }]);
      console.log('BSC switch successful via ethereum provider');
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await safeEthereumRequest('wallet_addEthereumChain', [{
            chainId: '0x38',
            chainName: 'BNB Smart Chain',
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

// ВИПРАВЛЕНА універсальна функція автоматичного переключення на BSC
export const autoSwitchToBSC = async (switchChain: Function): Promise<boolean> => {
  try {
    console.log('Auto-switching to BSC...');
    
    // Спеціальна обробка для Trust Wallet
    if (isTrustWallet()) {
      console.log('Trust Wallet detected, using specialized BSC switch...');
      
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
    
    // Спеціальна обробка для Binance Wallet
    if (isBinanceWallet()) {
      const switched = await switchToBSCInBinanceWallet();
      if (switched) return true;
    }
    
    // Для всіх інших кошельків використовуємо wagmi
    await switchChain({ chainId: bsc.id });
    return true;
    
  } catch (error: any) {
    console.error('Auto BSC switch failed:', error);
    
    // Fallback для додавання мережі
    if (error.code === 4902) {
      try {
        await safeEthereumRequest('wallet_addEthereumChain', [{
          chainId: '0x38',
          chainName: 'BNB Smart Chain',
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

// Функція для перевірки стану BSC мережі
export const checkBSCNetworkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://bsc-dataseed.bnbchain.org', {
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

// ВИПРАВЛЕНА функція валідації транзакції для Trust Wallet
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
    // ВИПРАВЛЕНО: Збільшено буфер для газу відповідно до нових вимог
    const gasBuffer = BigInt('10000000000000000'); // 0.01 BNB буфер для газу
    
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

// Функція для автоматичного виправлення проблем Trust Wallet
export const autoFixTrustWalletIssues = async (): Promise<boolean> => {
  if (!isTrustWallet()) return false;

  try {
    console.log('Auto-fixing Trust Wallet issues...');

    // Виправлення 1: Переподключення аккаунтів
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

    // Виправлення 3: Переключення RPC якщо можливо
    try {
      const randomRPC = getRandomBSCRPC();
      console.log('Suggesting RPC switch to:', randomRPC);
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

// Експорт додаткових утиліт для Trust Wallet
export const trustWalletUtils = {
  getRandomBSCRPC,
  validateTrustWalletTransaction,
  autoFixTrustWalletIssues,
  isTrustWallet,
  switchToBSCInTrustWallet,
  getTrustWalletOptimalGas,
  getOptimalGasPrice,
  safeEthereumRequest,
};

// ОНОВЛЕНІ константи для Trust Wallet з новими вимогами газу
export const TRUST_WALLET_CONSTANTS = {
  MIN_GAS_LIMIT: 21000,
  SAFE_GAS_LIMIT: 23000,
  MIN_GAS_PRICE_GWEI: 3, // ЗБІЛЬШЕНО з 5 до 3
  SAFE_GAS_PRICE_GWEI: 5, // ЗБІЛЬШЕНО з 8 до 5
  MAX_GAS_PRICE_GWEI: 15, // НОВИЙ: максимальна ціна газу
  RECOMMENDED_GAS_BUFFER: '0.01', // ЗБІЛЬШЕНО з 0.003 до 0.01 BNB
  BSC_CHAIN_ID: '0x38',
  BSC_CHAIN_ID_DECIMAL: 56,
};