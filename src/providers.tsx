'use client';

import * as React from 'react';
import { useEffect } from 'react';
import {
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  QueryClientProvider,
  QueryClient,
} from '@tanstack/react-query';
import { config } from './wagmi.config';
import { bsc } from 'wagmi/chains';

// Import i18n configuration
import './locales/i18n';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize i18n on client side
  useEffect(() => {
    // This ensures i18n is initialized when the component mounts
    import('./locales/i18n');
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#FF6B35',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          modalSize="compact"
          appInfo={{
            appName: 'CrazyFox Presale',
            learnMoreUrl: 'https://www.crazy-fox.io/',
          }}
          showRecentTransactions={true}
          initialChain={bsc}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}