import { createAppKit, AppKit } from '@reown/appkit/react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon } from 'wagmi/chains';
import * as React from 'react';

// 1. Get projectId from environment variables
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not set');
}

// 2. Create a metadata object
const metadata = {
  name: 'Gasify',
  description: 'Gasify - Your Web3 Wallet',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://gasify.app',
  icons: ['https://gasify.app/logo.png']
};

// 3. Define networks with proper types for AppKit
const networks = [
  {
    id: `eip155:${mainnet.id}`,
    name: mainnet.name,
    chainId: `eip155:${mainnet.id}`,
    chainNamespace: 'eip155',
    rpcUrls: {
      default: { http: [mainnet.rpcUrls.default.http[0]] },
      public: { http: [mainnet.rpcUrls.default.http[0]] } // Fallback to default if public not available
    },
    blockExplorers: {
      default: { url: mainnet.blockExplorers?.default?.url || '', name: 'Etherscan' }
    },
    nativeCurrency: {
      name: mainnet.nativeCurrency.name,
      symbol: mainnet.nativeCurrency.symbol,
      decimals: mainnet.nativeCurrency.decimals
    },
    testnet: false
  },
  {
    id: `eip155:${polygon.id}`,
    name: polygon.name,
    chainId: `eip155:${polygon.id}`,
    chainNamespace: 'eip155',
    rpcUrls: {
      default: { http: [polygon.rpcUrls.default.http[0]] },
      public: { http: [polygon.rpcUrls.default.http[0]] } // Fallback to default if public not available
    },
    blockExplorers: {
      default: { url: polygon.blockExplorers?.default?.url || '', name: 'Polygonscan' }
    },
    nativeCurrency: {
      name: polygon.nativeCurrency.name,
      symbol: polygon.nativeCurrency.symbol,
      decimals: polygon.nativeCurrency.decimals
    },
    testnet: false
  }
];

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
  metadata,
  customRpcUrls: {
    [`eip155:${mainnet.id}`]: 'https://eth.llamarpc.com',
    [`eip155:${polygon.id}`]: 'https://polygon-rpc.com'
  }
});

// 5. Create AppKit instance
export const appKitConfig = {
  adapters: [wagmiAdapter],
  networks: [networks[0], ...networks.slice(1)],
  projectId,
  metadata,
  features: {
    analytics: false
  }
};

// Create AppKit instance
let appKitInstance: AppKit | null = null;

try {
  appKitInstance = createAppKit(appKitConfig);
  
  // Make appKit globally available for debugging purposes
  if (typeof window !== 'undefined') {
    (window as any).appKit = appKitInstance;
  }
  
  console.log('AppKit initialized successfully');
} catch (error) {
  console.error('Failed to initialize AppKit:', error);
  throw error; // Re-throw to prevent the app from starting with a broken wallet
}

export const appKit = appKitInstance;

// 6. Create wagmi config
export const config = createConfig({
  chains: [mainnet, polygon],
  transports: {
    [mainnet.id]: http(mainnet.rpcUrls.default.http[0]),
    [polygon.id]: http(polygon.rpcUrls.default.http[0])
  },
  ssr: true
});

export const wagmiConfig = config; // For backward compatibility

// 7. Create query client
export const queryClient = new QueryClient();

// 8. Create AppKit provider component
export const AppKitProvider = ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </WagmiProvider>
);
