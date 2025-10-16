<?php

namespace App\Exceptions;

use Exception;

class BlockchainException extends Exception
{
    protected $userMessage;

    public function __construct(string $message, string $userMessage = null, int $code = 0, \Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->userMessage = $userMessage ?? $this->mapToUserMessage($message);
    }

    public function getUserMessage(): string
    {
        return $this->userMessage;
    }

    /**
     * Map technical error to user-friendly message
     */
    private function mapToUserMessage(string $message): string
    {
        // Network/RPC errors
        if (stripos($message, 'cURL') !== false || stripos($message, 'timeout') !== false) {
            return 'Network temporarily unavailable. Please try again in a few moments.';
        }
        
        if (stripos($message, 'RPC') !== false || stripos($message, 'connection') !== false) {
            return 'Unable to connect to blockchain network. Please try again later.';
        }
        
        // Balance errors
        if (stripos($message, 'insufficient') !== false && stripos($message, 'funds') !== false) {
            return 'Insufficient blockchain balance to complete this withdrawal.';
        }
        
        // Default
        return 'Unable to process blockchain transaction. Please try again.';
    }

    /**
     * Named constructors for common blockchain errors
     */
    public static function insufficientBalance(float $have, float $need, string $currency): self
    {
        return new self(
            "Insufficient balance: have {$have} {$currency}, need {$need} {$currency}",
            "Insufficient blockchain balance. You need at least {$need} {$currency} to complete this withdrawal."
        );
    }

    public static function networkTimeout(string $network): self
    {
        return new self(
            "Network timeout connecting to {$network}",
            "Network temporarily unavailable. Please try again in a few moments."
        );
    }

    public static function invalidAddress(string $address): self
    {
        return new self(
            "Invalid blockchain address: {$address}",
            "Invalid destination address. Please check and try again."
        );
    }

    public static function transactionFailed(string $reason): self
    {
        return new self(
            "Transaction failed: {$reason}",
            "Transaction could not be completed. Please try again."
        );
    }
}
