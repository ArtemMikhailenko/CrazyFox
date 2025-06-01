// contexts/WalletContext.tsx
// Более продвинутый контекст для управления кошельком

'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

// Типы
interface EthereumProvider {
  isMetaMask?: boolean;
  isTrust?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
          //@ts-ignore

    ethereum?: EthereumProvider;
  }
}

type WalletType = 'MetaMask' | 'Trust Wallet' | 'WalletConnect' | '';

interface WalletState {
  isConnected: boolean;
  address: string;
  walletType: WalletType;
  isConnecting: boolean;
  chainId: string;
  balance: string;
  showModal: boolean;
}

type WalletAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: { address: string; walletType: WalletType; chainId?: string } }
  | { type: 'SET_DISCONNECTED' }
  | { type: 'SET_BALANCE'; payload: string }
  | { type: 'SET_CHAIN_ID'; payload: string }
  | { type: 'TOGGLE_MODAL'; payload?: boolean };

const initialState: WalletState = {
  isConnected: false,
  address: '',
  walletType: '',
  isConnecting: false,
  chainId: '',
  balance: '0',
  showModal: false,
};

// BSC Network configuration
const BSC_CHAIN_CONFIG = {
  chainId: '0x38', // 56 in decimal
  chainName: 'Binance Smart Chain',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://bsc-dataseed.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com/'],
};

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload };
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: true,
        address: action.payload.address,
        walletType: action.payload.walletType,
        chainId: action.payload.chainId || '',
        isConnecting: false,
        showModal: false,
      };
    case 'SET_DISCONNECTED':
      return {
        ...initialState,
        showModal: false,
      };
    case 'SET_BALANCE':
      return { ...state, balance: action.payload };
    case 'SET_CHAIN_ID':
      return { ...state, chainId: action.payload };
    case 'TOGGLE_MODAL':
      return { ...state, showModal: action.payload ?? !state.showModal };
    default:
      return state;
  }
}

interface WalletContextType extends WalletState {
  connectMetaMask: () => Promise<void>;
  connectTrustWallet: () => Promise<void>;
  connectWalletConnect: () => Promise<void>;
  disconnect: () => void;
  switchToBSC: () => Promise<void>;
  getBalance: () => Promise<void>;
  formatAddress: (address: string) => string;
  toggleModal: (show?: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // Utility functions
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getBalance = async (): Promise<void> => {
    if (!window.ethereum || !state.address) return;

    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [state.address, 'latest'],
      });
      
      // Convert from Wei to BNB
      const balanceInBNB = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
      dispatch({ type: 'SET_BALANCE', payload: balanceInBNB });
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  };

  const switchToBSC = async (): Promise<void> => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BSC_CHAIN_CONFIG],
          });
        } catch (addError) {
          console.error('Error adding BSC network:', addError);
          toast.error('Failed to add BSC network');
        }
      } else {
        console.error('Error switching to BSC:', switchError);
        toast.error('Failed to switch to BSC network');
      }
    }
  };

  const connectMetaMask = async (): Promise<void> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('MetaMask is not installed!');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    dispatch({ type: 'SET_CONNECTING', payload: true });

    try {
      // Switch to BSC first
      await switchToBSC();

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({
          method: 'eth_chainId',
        });

        dispatch({
          type: 'SET_CONNECTED',
          payload: {
            address: accounts[0],
            walletType: 'MetaMask',
            chainId,
          },
        });

        toast.success('MetaMask connected successfully! 🦊');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Get balance
        setTimeout(getBalance, 1000);
      }
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
      toast.error('Failed to connect MetaMask');
      dispatch({ type: 'SET_CONNECTING', payload: false });
    }
  };

  const connectTrustWallet = async (): Promise<void> => {
    if (typeof window === 'undefined' || !window.ethereum?.isTrust) {
      toast.error('Trust Wallet not detected!');
      window.open('https://trustwallet.com/download', '_blank');
      return;
    }

    dispatch({ type: 'SET_CONNECTING', payload: true });

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({
          method: 'eth_chainId',
        });

        dispatch({
          type: 'SET_CONNECTED',
          payload: {
            address: accounts[0],
            walletType: 'Trust Wallet',
            chainId,
          },
        });

        toast.success('Trust Wallet connected successfully! 🔷');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        setTimeout(getBalance, 1000);
      }
    } catch (error) {
      console.error('Failed to connect Trust Wallet:', error);
      toast.error('Failed to connect Trust Wallet');
      dispatch({ type: 'SET_CONNECTING', payload: false });
    }
  };

  const connectWalletConnect = async (): Promise<void> => {
    toast.info('WalletConnect integration coming soon! 🚀');
    dispatch({ type: 'TOGGLE_MODAL', payload: false });
  };

  const disconnect = (): void => {
    dispatch({ type: 'SET_DISCONNECTED' });
    toast.info('Wallet disconnected');
  };

  const toggleModal = (show?: boolean): void => {
    dispatch({ type: 'TOGGLE_MODAL', payload: show });
  };

  // Effects
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === 'undefined' || !window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({
            method: 'eth_chainId',
          });

          let walletType: WalletType = '';
          if (window.ethereum.isMetaMask) walletType = 'MetaMask';
          else if (window.ethereum.isTrust) walletType = 'Trust Wallet';

          dispatch({
            type: 'SET_CONNECTED',
            payload: {
              address: accounts[0],
              walletType,
              chainId,
            },
          });

          setTimeout(getBalance, 1000);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    checkConnection();

    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          dispatch({ type: 'SET_DISCONNECTED' });
        } else {
          dispatch({
            type: 'SET_CONNECTED',
            payload: {
              address: accounts[0],
              walletType: state.walletType,
            },
          });
          setTimeout(getBalance, 1000);
        }
      };

      const handleChainChanged = (chainId: string) => {
        dispatch({ type: 'SET_CHAIN_ID', payload: chainId });
        if (chainId !== BSC_CHAIN_CONFIG.chainId) {
          toast.warning('Please switch to BSC network for full functionality');
        }
        setTimeout(getBalance, 1000);
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
            //@ts-ignore

      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                //@ts-ignore

          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const contextValue: WalletContextType = {
    ...state,
    connectMetaMask,
    connectTrustWallet,
    connectWalletConnect,
    disconnect,
    switchToBSC,
    getBalance,
    formatAddress,
    toggleModal,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Компонент кнопки кошелька
export function WalletButton({ className = '' }: { className?: string }) {
  const {
    isConnected,
    isConnecting,
    address,
    walletType,
    balance,
    chainId,
    disconnect,
    toggleModal,
    formatAddress,
    switchToBSC,
  } = useWallet();

  const isOnBSC = chainId === BSC_CHAIN_CONFIG.chainId;

  if (isConnected) {
    return (
      <div className={`wallet-connected ${className}`}>
        <div className="wallet-info">
          <div className="wallet-header">
            <span className="wallet-type">
              {walletType === 'MetaMask' ? '🦊' : walletType === 'Trust Wallet' ? '🔷' : '🔗'}
              {walletType}
            </span>
            <button onClick={disconnect} className="disconnect-btn">
              ✕
            </button>
          </div>
          <div className="wallet-details">
            <div className="address">{formatAddress(address)}</div>
            <div className="balance">{balance} BNB</div>
            {!isOnBSC && (
              <button onClick={switchToBSC} className="switch-network-btn">
                Switch to BSC
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => toggleModal(true)}
      disabled={isConnecting}
      className={`wallet-connect-btn ${className}`}
    >
      {isConnecting ? '🔄 Connecting...' : '🔗 Connect Wallet'}
    </button>
  );
}