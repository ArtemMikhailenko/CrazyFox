// wagmi.config.ts
import { createConfig, http } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  bsc,
} from 'wagmi/chains';
import {
  connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  trustWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
  phantomWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Настройка кошельков
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
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
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID',
  }
);

export const config = createConfig({
  connectors,
  chains: [
    bsc, // Primary chain for presale
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
  ssr: true, // If your dApp uses server side rendering (SSR)
});
