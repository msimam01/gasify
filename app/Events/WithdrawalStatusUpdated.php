<?php

namespace App\Events;

use App\Models\Transactions;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WithdrawalStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $withdrawal;
    public $status;
    public $message;
    public $explorerUrl;
    public $error;

    /**
     * Create a new event instance.
     */
    public function __construct(Transactions $withdrawal, string $status, string $message, ?string $explorerUrl = null, ?string $error = null)
    {
        $this->withdrawal = $withdrawal;
        $this->status = $status;
        $this->message = $message;
        $this->explorerUrl = $explorerUrl;
        $this->error = $error;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->withdrawal->user_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'withdrawal.status.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'withdrawal_id' => $this->withdrawal->id,
            'status' => $this->status,
            'message' => $this->message,
            'explorer_url' => $this->explorerUrl,
            'error' => $this->error,
            'amount' => $this->withdrawal->amount,
            'currency' => $this->withdrawal->currency,
        ];
    }
}
