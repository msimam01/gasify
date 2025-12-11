<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Services\VirtualAccountService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class PaystackWebhookController extends Controller
{
    public function __construct(
        protected VirtualAccountService $virtualAccountService
    ) {}

    /**
     * Handle Paystack webhook events
     */
    public function handle(Request $request): Response
    {
        try {
            // Verify webhook signature
            $signature = $request->header('x-paystack-signature');
            $payload = $request->getContent();
            $secretKey = config('services.paystack.webhook_secret');

            if (!$this->verifySignature($payload, $signature, $secretKey)) {
                Log::warning('Invalid Paystack webhook signature');
                return response('Invalid signature', 401);
            }

            $data = json_decode($payload, true);

            if (!$data) {
                return response('Invalid JSON', 400);
            }

            // Handle the webhook
            $this->virtualAccountService->handleWebhook($data);

            return response('OK', 200);

        } catch (\Exception $e) {
            Log::error('Paystack webhook processing error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response('Webhook processing failed', 500);
        }
    }

    /**
     * Verify Paystack webhook signature
     */
    private function verifySignature(string $payload, string $signature, string $secret): bool
    {
        if (!$signature || !$secret) {
            return false;
        }

        $hash = hash_hmac('sha512', $payload, $secret);
        
        return hash_equals($signature, $hash);
    }
}
