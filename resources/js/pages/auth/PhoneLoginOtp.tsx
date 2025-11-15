import { useState, useEffect } from 'react'
import { Head, Link } from '@inertiajs/react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Phone, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react'
import InputError from '@/components/input-error'
import { router } from '@inertiajs/react'

interface PhoneLoginOtpProps {
    phone: string
    errors?: {
        code?: string
    }
    status?: string
}

export default function PhoneLoginOtp({ phone, errors, status }: PhoneLoginOtpProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [resendTimer, setResendTimer] = useState(45)
    const [canResend, setCanResend] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Countdown timer for resend
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            setCanResend(true)
        }
    }, [resendTimer])

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return // Only allow single digits

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`)
            nextInput?.focus()
        }

        // Auto-submit when all digits are filled
        if (newOtp.every(digit => digit !== '') && index === 5) {
            handleSubmit()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`)
            prevInput?.focus()
        }
    }

    const handleSubmit = () => {
        setIsSubmitting(true)
        const code = otp.join('')
        router.post('/phone-login/verify-otp', { code, remember: true }, {
            onFinish: () => setIsSubmitting(false)
        })
    }

    const handleResend = () => {
        router.post('/phone-login/send-otp', { phone }, {
            onSuccess: () => {
                setResendTimer(45)
                setCanResend(false)
                setOtp(['', '', '', '', '', ''])
            }
        })
    }

    const handleUssdDial = () => {
        window.location.href = `tel:*GASIFY*123*${otp.join('')}#`
    }

    return (
        <AuthLayout>
            <Head title="Verify Phone Login - Gasify" />

            <Card className="bg-slate-800 border-slate-700 max-w-md">
                <CardContent className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Phone className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verify Your Phone</h2>
                        <p className="text-slate-400">
                            Enter the 6-digit code sent to
                        </p>
                        <p className="text-emerald-400 font-semibold">
                            {phone || '+234 xxx xxx 1234'}
                        </p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-6">
                        {/* OTP Input */}
                        <div>
                            <Label className="text-slate-300 text-center block mb-4">Enter verification code</Label>
                            <div className="flex gap-2 justify-center">
                                {otp.map((digit, index) => (
                                    <Input
                                        key={index}
                                        id={`otp-${index}`}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-12 h-12 text-center text-2xl font-bold bg-slate-700 border-slate-600 text-white"
                                        autoFocus={index === 0}
                                        disabled={isSubmitting}
                                    />
                                ))}
                            </div>
                            <InputError message={errors?.code} />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
                            disabled={isSubmitting || otp.some(digit => digit === '')}
                        >
                            {isSubmitting ? 'Verifying...' : 'Verify & Login'}
                        </Button>

                        {status && (
                            <div className="text-center text-sm font-medium text-emerald-400 bg-emerald-500/10 p-3 rounded-lg">
                                {status}
                            </div>
                        )}
                    </form>

                    {/* Resend Section */}
                    <div className="mt-6 text-center">
                        <p className="text-slate-400 text-sm mb-4">
                            Didn't receive the code?
                        </p>

                        {canResend ? (
                            <Button
                                onClick={handleResend}
                                variant="outline"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Resend Code
                            </Button>
                        ) : (
                            <p className="text-slate-500 text-sm">
                                Resend in {resendTimer}s
                            </p>
                        )}
                    </div>

                    {/* USSD Fallback */}
                    <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                        <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                            <Phone className="w-4 h-4" />
                            <span className="font-semibold">USSD Alternative</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">
                            Dial this code to verify instantly:
                        </p>
                        <Button
                            onClick={handleUssdDial}
                            variant="outline"
                            className="w-full border-emerald-600 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                        >
                            *GASIFY*123*{otp.join('')}#
                        </Button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                            ← Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center text-xs text-slate-500 mt-6">
                Protected by bank-grade security · AI scam detection active
            </div>
        </AuthLayout>
    )
}
