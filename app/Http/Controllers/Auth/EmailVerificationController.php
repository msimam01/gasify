<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationController extends Controller
{
    /**
     * Show the email verification notice.
     */
    public function show(): Response
    {
        return Inertia::render('auth/verify-email', [
            'status' => session('resent') ? 'verification-link-sent' : null,
        ]);
    }

    /**
     * Mark the authenticated user's email address as verified.
     */
    public function verify(Request $request): RedirectResponse
    {
        $request->user()->markEmailAsVerified();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Send a new email verification notification.
     */
    public function resend(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        $request->user()->sendEmailVerificationNotification();

        return back()->with('resent', true);
    }
}
