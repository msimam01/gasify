<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Modules\Auth\DTOs\RegisterDto;
use App\Modules\Auth\Services\AuthService;
use App\Services\WalletService;
use App\Services\VirtualAccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(
        protected AuthService $authService,
        protected WalletService $walletService,
        protected VirtualAccountService $virtualAccountService
    ) {}

    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $dto = RegisterDto::fromRequest($request->all());

        $user = $this->authService->register($dto);

        // 🔑 initialize wallets
        $this->walletService->initializeUserWallets($user);

        // 💰 create virtual account for user
        $this->virtualAccountService->createForUser($user);

        // Login the user
        Auth::login($user);

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
