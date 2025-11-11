<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;

class SocialController extends Controller
{
    /**
     * Redirect to Google OAuth.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google OAuth callback.
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            $user = User::where('email', $googleUser->email)->first();

            if ($user) {
                // Link Google account to existing user
                $user->update([
                    'provider' => 'google',
                    'provider_id' => $googleUser->id,
                ]);
            } else {
                // Create new user
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'phone' => null, // Will need to be filled later
                    'password' => Hash::make(uniqid()), // Random password
                    'provider' => 'google',
                    'provider_id' => $googleUser->id,
                    'email_verified_at' => now(),
                ]);
            }

            Auth::login($user);

            return redirect()->intended(route('dashboard', absolute: false));
        } catch (\Exception $e) {
            return redirect('/login')->withErrors([
                'social' => 'Unable to authenticate with Google.',
            ]);
        }
    }

    /**
     * Redirect to X (Twitter) OAuth.
     */
    public function redirectToX(): RedirectResponse
    {
        return Socialite::driver('twitter')->redirect();
    }

    /**
     * Handle X (Twitter) OAuth callback.
     */
    public function handleXCallback(): RedirectResponse
    {
        try {
            $xUser = Socialite::driver('twitter')->user();

            $user = User::where('email', $xUser->email)->first();

            if ($user) {
                // Link X account to existing user
                $user->update([
                    'provider' => 'twitter',
                    'provider_id' => $xUser->id,
                ]);
            } else {
                // Create new user
                $user = User::create([
                    'name' => $xUser->name,
                    'email' => $xUser->email,
                    'phone' => null, // Will need to be filled later
                    'password' => Hash::make(uniqid()), // Random password
                    'provider' => 'twitter',
                    'provider_id' => $xUser->id,
                    'email_verified_at' => now(),
                ]);
            }

            Auth::login($user);

            return redirect()->intended(route('dashboard', absolute: false));
        } catch (\Exception $e) {
            return redirect('/login')->withErrors([
                'social' => 'Unable to authenticate with X (Twitter).',
            ]);
        }
    }
}
