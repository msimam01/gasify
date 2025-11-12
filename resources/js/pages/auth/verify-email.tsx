import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle, RefreshCw, LogOut, Shield, Clock } from 'lucide-react'

export default function VerifyEmail({ status }: { status?: string }) {
    const [isResending, setIsResending] = useState(false)

    const handleResend = async () => {
        setIsResending(true)
        try {
            await router.post('/email/verification-notification', {}, {
                preserveScroll: true,
                onSuccess: () => {
                    // Status will be updated via props
                },
            })
        } finally {
            setIsResending(false)
        }
    }

    const handleLogout = () => {
        router.post('/logout')
    }

    return (
        <AuthLayout>
            <Head title="Verify Your Email - Gasify" />

            <Card className="bg-slate-800 border-slate-700 max-w-lg">
                <CardContent className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                        <p className="text-slate-400">
                            We've sent a verification link to your email address
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Status Message */}
                        {status === 'verification-link-sent' && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    <div>
                                        <p className="text-emerald-400 font-medium">Email sent!</p>
                                        <p className="text-slate-400 text-sm">Check your inbox and spam folder</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-emerald-400 mt-0.5" />
                                <div className="text-left">
                                    <h4 className="text-white font-medium mb-2">What to do next:</h4>
                                    <ol className="text-slate-400 text-sm space-y-1">
                                        <li>1. Open the email from Gasify</li>
                                        <li>2. Click the "Verify Email" button</li>
                                        <li>3. You'll be redirected back here automatically</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Didn't receive email? */}
                        <div className="text-center">
                            <p className="text-slate-400 text-sm mb-4">
                                Didn't receive the email? Check your spam folder or try resending.
                            </p>

                            <Button
                                onClick={handleResend}
                                disabled={isResending}
                                variant="outline"
                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                                {isResending ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Resend Verification Email
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Additional Info */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-blue-400" />
                                <div className="text-left">
                                    <p className="text-blue-400 font-medium">Link expires in 24 hours</p>
                                    <p className="text-slate-400 text-sm">
                                        For security, verification links expire after 24 hours
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Logout Option */}
                        <div className="text-center pt-4 border-t border-slate-700">
                            <p className="text-slate-400 text-sm mb-3">
                                Not your account? Sign out and try again.
                            </p>
                            <Button
                                onClick={handleLogout}
                                variant="ghost"
                                className="text-slate-400 hover:text-white hover:bg-slate-700"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center text-xs text-slate-500 mt-6">
                Protected by bank-grade security · AI scam detection active
            </div>
        </AuthLayout>
    )
}
