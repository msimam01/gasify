import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon, solana } from '@reown/appkit/networks';
import { projectId } from './walletconnect';

// Create wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, polygon, solana],
  projectId,
  ssr: true
});

console.log('WagmiAdapter initialized successfully');
