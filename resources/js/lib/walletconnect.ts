import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon } from 'wagmi/chains';

// 1. Get projectId from environment variables
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not set');
}

// 2. Create metadata object
export const metadata = {
  name: 'Gasify',
  description: 'Gasify - Your Web3 Wallet',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://gasify.app',
  icons: ['https://gasify.app/logo.png']
};

// 3. Define supported networks (mutable array)
export const networks = [mainnet, polygon];

// 4. Create wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
});

// 5. Create wagmi config
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// 6. Initialize AppKit instance globally
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: [],
    allWallets: true,
    onramp: false,
    swaps: false
  },
  autoConnect: false,
  walletConnectV1: false,
  walletConnectV2: {
    showQrModal: true,
    disableAnalytics: true
  }
});

// Export wagmiConfig as default
export { wagmiConfig as config };
