<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PhoneLoginController extends Controller
{
    public function sendOtp(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+?[1-9]\d{1,14}$/'],
        ]);

        $phone = $request->input('phone');

        // Check if user exists with this phone
        $user = User::where('phone', $phone)->first();
        if (!$user) {
            throw ValidationException::withMessages([
                'phone' => ['No account found with this phone number.'],
            ]);
        }

        // Generate 6-digit OTP
        $otp = random_int(100000, 999999);

        // Cache OTP for 5 minutes with phone as key
        Cache::put("phone_otp:{$phone}", $otp, 300);

        // Store phone in session for next step
        session(['phone_login' => $phone]);

        // TODO: In production, replace with actual SMS service
        Log::info("Phone login OTP for {$phone}: {$otp}");

        return response()->json([
            'message' => 'OTP sent successfully',
            'otp' => config('app.debug') ? $otp : null, // Remove in production
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $phone = session('phone_login');
        $code = $request->input('code');

        if (!$phone) {
            throw ValidationException::withMessages([
                'code' => ['Session expired. Please try again.'],
            ]);
        }

        $cachedOtp = Cache::get("phone_otp:{$phone}");

        if (!$cachedOtp || $cachedOtp != $code) {
            throw ValidationException::withMessages([
                'code' => ['Invalid OTP code.'],
            ]);
        }

        // Find user and login
        $user = User::where('phone', $phone)->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'code' => ['Account not found.'],
            ]);
        }

        // Clear OTP and phone from cache/session
        Cache::forget("phone_otp:{$phone}");
        session()->forget('phone_login');

        // Login user
        Auth::login($user, $request->boolean('remember', false));

        return redirect()->intended('/dashboard');
    }

    public function showOtpForm()
    {
        $phone = session('phone_login');

        if (!$phone) {
            return redirect()->route('login');
        }

        return inertia('auth/PhoneLoginOtp', [
            'phone' => $phone,
        ]);
    }
}
