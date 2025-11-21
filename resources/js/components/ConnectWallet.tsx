import { useAccount, useDisconnect, useChainId } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { IconWallet, IconPlugConnected, IconAlertCircle } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { useEffect, useState, useCallback } from 'react';
import { useAppKit } from '@reown/appkit/react';

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [currentChain, setCurrentChain] = useState<{ id: number; name: string } | null>(null);

  // Get AppKit instance and open function
  const { open } = useAppKit();

  // Check network connectivity and chain support
  useEffect(() => {
    // Set current chain based on chainId
    if (chainId) {
      setCurrentChain({
        id: chainId,
        name: chainId === 1 ? 'Ethereum' : chainId === 137 ? 'Polygon' : `Chain ${chainId}`
      });
    } else {
      setCurrentChain(null);
    }

    const handleOnline = () => {
      setNetworkError(null);
    };

    const handleOffline = () => {
      setNetworkError('No internet connection. Please check your network.');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Initial check
      if (!navigator.onLine) {
        handleOffline();
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Check if connected to a supported chain
  useEffect(() => {
    if (chainId && ![1, 137].includes(chainId)) { // 1: Ethereum, 137: Polygon
      setNetworkError(`Unsupported network. Please switch to Ethereum or Polygon.`);
    } else if (!networkError) {
      setNetworkError(null);
    }
  }, [chainId]);

  const handleConnect = useCallback(async () => {
    if (isConnected) {
      return;
    }

    if (networkError) {
      toast.error(networkError);
      return;
    }

    try {
      // Use AppKit's built-in open function to show wallet selection modal
      await open();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';

      // Handle specific error cases
      if (errorMessage.includes('User rejected')) {
        toast.info('Connection request was rejected');
      } else if (errorMessage.toLowerCase().includes('network') ||
                errorMessage.toLowerCase().includes('connection')) {
        setNetworkError('Network error. Please check your internet connection.');
      } else {
        toast.error(errorMessage);
      }
    }
  }, [isConnected, networkError, open]);

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
    // Show network error banner if there's an error
    if (networkError) {
      const chainName = currentChain?.name || 'Unknown Network';
      return (
        <div className="w-full p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <IconAlertCircle className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{networkError}</p>
              {chainId && (
                <p className="text-xs mt-1">
                  Current chain: {chainName} (ID: {chainId})
                </p>
              )}
            </div>
            <button
              onClick={() => setNetworkError(null)}
              className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-2 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-600">
            <IconPlugConnected className="w-3 h-3 mr-1" />
            Connected
          </Badge>
          <span className="text-sm font-medium">{`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {getChainName(chainId)}
        </div>
        <div className="flex gap-2 mt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(address);
                  toast.success('Address copied to clipboard');
                }}>
                  Copy Address
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await disconnect();
                toast.info('Wallet disconnected');
              } catch (error) {
                console.error('Error disconnecting wallet:', error);
                toast.error('Failed to disconnect wallet');
              }
            }}
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {networkError && (
        <div className="p-2 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-md mb-2">
          {networkError}
        </div>
      )}
      <Button
        onClick={handleConnect}
        className="w-full"
        disabled={isConnected}
      >
        <IconWallet className="w-4 h-4 mr-2" />
        {isConnected ? 'Connected' : 'Connect Wallet'}
      </Button>
    </div>
  );
}
