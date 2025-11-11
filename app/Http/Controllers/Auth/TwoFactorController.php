<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorController extends Controller
{
    /**
     * Show the two-factor authentication challenge view.
     */
    public function show(): Response
    {
        return Inertia::render('auth/two-factor-challenge');
    }

    /**
     * Enable two-factor authentication for the user.
     */
    public function enable(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $user = $request->user();

        if (!$user->two_factor_secret) {
            $user->enableTwoFactorAuthentication();
        }

        if ($user->confirmTwoFactorAuth($request->code)) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        return back()->withErrors([
            'code' => 'The provided two-factor authentication code was invalid.',
        ]);
    }

    /**
     * Disable two-factor authentication for the user.
     */
    public function disable(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => 'required|string|current_password',
        ]);

        $request->user()->disableTwoFactorAuthentication();

        return back();
    }

    /**
     * Show the recovery codes for the user.
     */
    public function recoveryCodes(Request $request): Response
    {
        return Inertia::render('auth/two-factor-recovery-codes', [
            'recoveryCodes' => decrypt($request->user()->two_factor_recovery_codes),
        ]);
    }

    /**
     * Regenerate recovery codes for the user.
     */
    public function regenerateRecoveryCodes(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => 'required|string|current_password',
        ]);

        $request->user()->regenerateRecoveryCodes();

        return back();
    }
}
