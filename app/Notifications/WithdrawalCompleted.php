<?php

namespace App\Notifications;

use App\Models\Transactions;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WithdrawalCompleted extends Notification implements ShouldQueue
{
    use Queueable;

    protected $withdrawal;
    protected $explorerUrl;

    /**
     * Create a new notification instance.
     */
    public function __construct(Transactions $withdrawal, ?string $explorerUrl = null)
    {
        $this->withdrawal = $withdrawal;
        $this->explorerUrl = $explorerUrl;
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
        $message = (new MailMessage)
            ->subject('Withdrawal Completed Successfully')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Your withdrawal has been completed successfully.')
            ->line('Amount: ' . $this->withdrawal->amount . ' ' . $this->withdrawal->currency)
            ->line('Transaction ID: #' . $this->withdrawal->id);

        if ($this->explorerUrl) {
            $message->action('View on Blockchain Explorer', $this->explorerUrl);
        }

        return $message->line('Thank you for using our platform!');
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
            'status' => 'completed',
            'explorer_url' => $this->explorerUrl,
            'message' => 'Your withdrawal of ' . $this->withdrawal->amount . ' ' . $this->withdrawal->currency . ' has been completed successfully.',
        ];
    }
}
