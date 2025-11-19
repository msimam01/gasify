import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppKit } from '@reown/appkit/react';
import { IconWallet } from '@tabler/icons-react';

export default function ConnectWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const getChainName = (chainId: number | undefined) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 101: return 'Solana';
      case 1011: return 'Solana Devnet';
      default: return 'Multi-Chain';
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex flex-col items-center gap-2 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-600">
            <IconWallet className="w-3 h-3 mr-1" />
            Connected
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            {getChainName(chainId)}
          </Badge>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Full address: {address}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => {
        console.log('Opening WalletConnect modal');
        open();
      }}
      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
    >
      <IconWallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
