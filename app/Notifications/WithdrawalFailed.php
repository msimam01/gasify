<?php

namespace App\Notifications;

use App\Models\Transactions;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WithdrawalFailed extends Notification implements ShouldQueue
{
    use Queueable;

    protected $withdrawal;
    protected $errorMessage;

    /**
     * Create a new notification instance.
     */
    public function __construct(Transactions $withdrawal, string $errorMessage)
    {
        $this->withdrawal = $withdrawal;
        $this->errorMessage = $errorMessage;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Withdrawal Failed')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Unfortunately, your withdrawal could not be processed.')
            ->line('Amount: ' . $this->withdrawal->amount . ' ' . $this->withdrawal->currency)
            ->line('Transaction ID: #' . $this->withdrawal->id)
            ->line('Reason: ' . $this->errorMessage)
            ->line('Your funds have been returned to your wallet balance.')
            ->action('View Wallet', url('/wallet'))
            ->line('If you continue to experience issues, please contact our support team.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'withdrawal_id' => $this->withdrawal->id,
            'amount' => $this->withdrawal->amount,
            'currency' => $this->withdrawal->currency,
            'status' => 'failed',
            'error' => $this->errorMessage,
            'message' => 'Your withdrawal of ' . $this->withdrawal->amount . ' ' . $this->withdrawal->currency . ' failed: ' . $this->errorMessage,
        ];
    }
}
