<?php

namespace App\Services;

use Edgaras\Ethereum\Ethereum;
use Edgaras\Ethereum\Wallet;
use Edgaras\Ethereum\Utils;
use Exception;
use Illuminate\Support\Facades\Log;

class EthereumService
{
    protected Ethereum $eth;
    protected int $chainId;
    protected string $rpcUrl;
    protected array $networks;
    protected string $currentNetwork;

    public function __construct()
    {
        $this->networks = [
            'ethereum' => [
                'rpc_url' => env('ETHEREUM_RPC'),
                'chain_id' => 11155111, // Sepolia
                'explorer_url' => 'https://sepolia.etherscan.io/tx/',
            ],
            'binance' => [
                'rpc_url' => env('BSC_RPC'),
                'chain_id' => 56,
                'explorer_url' => 'https://bscscan.com/tx/',
            ],
            'arbitrum' => [
                'rpc_url' => env('ARBITRUM_RPC'),
                'chain_id' => 42161,
                'explorer_url' => 'https://arbiscan.io/tx/',
            ],
            'optimism' => [
                'rpc_url' => env('OPTIMISM_RPC'),
                'chain_id' => 10,
                'explorer_url' => 'https://optimistic.etherscan.io/tx/',
            ],
        ];

        $this->setNetwork('ethereum');
    }

    /**
     * Switch the RPC & chain context to a named network.
     */
    public function setNetwork(string $network): self
    {
        if (!isset($this->networks[$network])) {
            throw new Exception("Unsupported network: {$network}");
        }

        $cfg = $this->networks[$network];
        if (empty($cfg['rpc_url'])) {
            throw new Exception("RPC URL not configured for network: {$network}");
        }

        $this->rpcUrl = $cfg['rpc_url'];
        $this->chainId = $cfg['chain_id'];
        $this->currentNetwork = $network;

        // Initialize the edgaras Ethereum client
        $this->eth = new Ethereum($this->rpcUrl, $this->chainId);

        return $this;
    }

    /**
     * Send ETH (or token, optionally) transaction.
     *
     * Params should include:
     *  - from
     *  - to
     *  - value (in Wei as int/string)
     *  - private_key (hex, without 0x or with)
     *  - optional: network
     *  - optional: token_contract (for ERC-20)
     *  - optional: gas, maxFeePerGas, maxPriorityFeePerGas for EIP-1559
     */
    public function sendTransaction(array $params): string
    {
        foreach (['from', 'to', 'value', 'private_key'] as $field) {
            if (!isset($params[$field])) {
                throw new Exception("Missing required parameter: {$field}");
            }
        }

        $network = $params['network'] ?? 'ethereum';
        $this->setNetwork($network);

        $from = $params['from'];
        $to = $params['to'];
        $rawValue = $params['value'];
        
        // Convert value to proper format
        // The edgaras library expects value in Ether (as string with decimals)
        // If we receive Wei, we need to convert to Ether
        $valueInEther = $this->convertToEther($rawValue);
        
        $privateKey = ltrim($params['private_key'], '0x');

        Log::info('Initiating transaction', [
            'network' => $network,
            'chain_id' => $this->chainId,
            'from' => $from,
            'to' => $to,
            'value_wei' => $rawValue,
            'value_ether' => $valueInEther,
            'is_token' => isset($params['token_contract']) ? 'yes' : 'no',
        ]);

        // Set the wallet (signer) to the private key
        $wallet = new Wallet('0x' . $privateKey);
        $this->eth->setWallet($wallet);

        try {
            // If token transfer is requested
            if (isset($params['token_contract'])) {
                throw new Exception("Token transfer not implemented in this method. Use sendTokenTransaction() instead.");
            }

            // Determine whether to use legacy or EIP-1559
            $useEip1559 = isset($params['maxFeePerGas']) && isset($params['maxPriorityFeePerGas']);

            if ($useEip1559) {
                $maxFeePerGas = $params['maxFeePerGas'];
                $maxPriorityFeePerGas = $params['maxPriorityFeePerGas'];

                // EIP-1559 transaction
                $txHash = $this->eth->sendEtherEIP1559(
                    $to,
                    $valueInEther,
                    $maxFeePerGas,
                    $maxPriorityFeePerGas
                );
            } else {
                // Legacy (Type-0) transaction
                // The sendEther method expects value in Ether (string)
                $txHash = $this->eth->sendEther($to, $valueInEther);
            }

            Log::info('Transaction sent successfully', [
                'tx_hash' => $txHash,
                'from' => $from,
                'to' => $to,
                'value_ether' => $valueInEther,
                'network' => $network,
                'explorer_url' => $this->getTransactionUrl($txHash),
            ]);

            return $txHash;

        } catch (Exception $e) {
            Log::error('Ethereum transaction failed', [
                'error' => $e->getMessage(),
                'from' => $from,
                'to' => $to,
                'network' => $network,
                'chain_id' => $this->chainId,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Convert Wei (or BigInteger) to Ether string
     * 
     * @param mixed $value Value in Wei (int, string, or BigInteger)
     * @return string Value in Ether (e.g., "0.01")
     */
    protected function convertToEther($value): string
    {
        // Handle BigInteger objects
        if (is_object($value)) {
            if (method_exists($value, 'toString')) {
                $value = $value->toString();
            } elseif (method_exists($value, '__toString')) {
                $value = (string)$value;
            } elseif (property_exists($value, 'value')) {
                $value = (string)$value->value;
            } else {
                throw new Exception("Unable to convert value object to string");
            }
        }

        // Ensure value is numeric string
        $value = (string)$value;
        
        if (!is_numeric($value)) {
            throw new Exception("Invalid value: must be numeric");
        }

        // Convert Wei to Ether using bcmath for precision
        // 1 ETH = 10^18 Wei
        $ether = bcdiv($value, '1000000000000000000', 18);
        
        // Remove trailing zeros but keep at least one decimal place
        $ether = rtrim(rtrim($ether, '0'), '.');
        
        // If empty or just a decimal point, return "0"
        if (empty($ether) || $ether === '.') {
            return '0';
        }

        return $ether;
    }

    /**
     * Convert Ether to Wei
     * 
     * @param string|float $ether Value in Ether
     * @return string Value in Wei
     */
    protected function convertToWei($ether): string
    {
        $ether = (string)$ether;
        
        if (!is_numeric($ether)) {
            throw new Exception("Invalid ether value: must be numeric");
        }

        // Convert Ether to Wei using bcmath for precision
        // 1 ETH = 10^18 Wei
        return bcmul($ether, '1000000000000000000', 0);
    }

    /**
     * Get balance of an address (in Ether, as string)
     */
    public function getBalance(string $address): string
    {
        return $this->eth->getBalanceInEther($address);
    }

    /**
     * Get balance in Wei
     */
    public function getBalanceInWei(string $address): string
    {
        $etherBalance = $this->eth->getBalanceInEther($address);
        return $this->convertToWei($etherBalance);
    }

    /**
     * Wait for transaction to be confirmed (or included).
     * Returns receipt or null/throws if not confirmed.
     */
    public function waitForConfirmation(string $txHash, int $maxAttempts = 60, int $delaySeconds = 2): array
    {
        return $this->eth->waitForConfirmation($txHash, maxAttempts: $maxAttempts, delaySeconds: $delaySeconds);
    }

    /**
     * Get transaction URL (explorer link)
     */
    public function getTransactionUrl(string $txHash): string
    {
        return $this->networks[$this->currentNetwork]['explorer_url'] . $txHash;
    }

    /**
     * Get details / receipt of a transaction
     */
    public function getTransactionReceipt(string $txHash): array
    {
        return $this->eth->getTransactionReceipt($txHash);
    }

    /**
     * Get transaction info (sender, to, value, etc.)
     */
    public function getTransaction(string $txHash): array
    {
        return $this->eth->getTransaction($txHash);
    }

    /**
     * Get current gas price
     */
    public function getGasPrice(): string
    {
        return $this->eth->getGasPrice();
    }

    /**
     * Estimate gas for a transaction
     */
    public function estimateGas(string $to, string $valueInEther): int
    {
        return $this->eth->estimateGas($to, $valueInEther);
    }
}