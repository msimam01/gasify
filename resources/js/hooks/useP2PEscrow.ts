// useP2PEscrow.ts - Sample hook for P2P escrow using WalletConnect
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// Sample ERC20-like contract ABI (replace with actual escrow contract)
const ESCROW_ABI = [
  {
    inputs: [
      { name: 'buyer', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'createEscrow',
    outputs: [{ name: 'escrowId', type: 'uint256' }],
    stateMutability: 'nonpayable' as const,
    type: 'function' as const,
  },
  {
    inputs: [
      { name: 'escrowId', type: 'uint256' },
    ],
    name: 'releaseEscrow',
    outputs: [],
    stateMutability: 'nonpayable' as const,
    type: 'function' as const,
  },
  {
    inputs: [
      { name: 'escrowId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'cancelEscrow',
    outputs: [],
    stateMutability: 'nonpayable' as const,
    type: 'function' as const,
  },
  {
    inputs: [
      { name: 'escrowId', type: 'uint256' },
    ],
    name: 'getEscrow',
    outputs: [
      { name: 'buyer', type: 'address' },
      { name: 'seller', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
    stateMutability: 'view' as const,
    type: 'function' as const,
  },
] as const;

// Replace with actual escrow contract address
const ESCROW_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

export function useCreateEscrow() {
  const { writeContractAsync: createEscrowAsync, isPending: isCreating } = useWriteContract();

  const createEscrow = async (buyerAddress: string, amount: string) => {
    try {
      const hash = await createEscrowAsync({
        address: ESCROW_CONTRACT_ADDRESS as any,
        abi: ESCROW_ABI,
        functionName: 'createEscrow',
        args: [buyerAddress as any, parseEther(amount)],
      });

      return hash;
    } catch (error) {
      console.error('Error creating escrow:', error);
      throw error;
    }
  };

  return { createEscrow, isCreating };
}

export function useReleaseEscrow() {
  const { writeContractAsync: releaseEscrowAsync, isPending: isReleasing } = useWriteContract();

  const releaseEscrow = async (escrowId: bigint) => {
    try {
      const hash = await releaseEscrowAsync({
        address: ESCROW_CONTRACT_ADDRESS as any,
        abi: ESCROW_ABI,
        functionName: 'releaseEscrow',
        args: [escrowId],
      });

      return hash;
    } catch (error) {
      console.error('Error releasing escrow:', error);
      throw error;
    }
  };

  return { releaseEscrow, isReleasing };
}

export function useCancelEscrow() {
  const { writeContractAsync: cancelEscrowAsync, isPending: isCancelling } = useWriteContract();

  const cancelEscrow = async (escrowId: bigint, amount: string) => {
    try {
      const hash = await cancelEscrowAsync({
        address: ESCROW_CONTRACT_ADDRESS as any,
        abi: ESCROW_ABI,
        functionName: 'cancelEscrow',
        args: [escrowId, parseEther(amount)],
      });

      return hash;
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      throw error;
    }
  };

  return { cancelEscrow, isCancelling };
}

export function useGetEscrow(escrowId: bigint) {
  const { data, isLoading, refetch } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS as any,
    abi: ESCROW_ABI,
    functionName: 'getEscrow',
    args: [escrowId],
  });

  return {
    escrow: data ? {
      buyer: data[0],
      seller: data[1],
      amount: formatEther(data[2]),
      isActive: data[3],
    } : null,
    isLoading,
    refetch,
  };
}

export function useEscrowTransaction() {
  const { isLoading, isSuccess, error } = useWaitForTransactionReceipt();

  return { isLoading, isSuccess, error };
}
