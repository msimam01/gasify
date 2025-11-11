import { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import InputError from '@/components/input-error'

export default function ForgotPassword({ status }: { status?: string }) {
    const [emailSent, setEmailSent] = useState(false)

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post('/forgot-password', {
            onSuccess: () => {
                setEmailSent(true)
                reset()
            },
        })
    }

    if (emailSent) {
        return (
            <AuthLayout>
                <Head title="Reset Link Sent - Gasify" />

                <Card className="bg-slate-800 border-slate-700 max-w-md">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
                        <p className="text-slate-300 mb-6">
                            We've sent a password reset link to your email address. Click the link to reset your password.
                        </p>

                        <div className="bg-slate-700 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                                <Mail className="w-4 h-4" />
                                <span className="font-semibold">Also check your SMS</span>
                            </div>
                            <p className="text-sm text-slate-400">
                                For faster access, we've also sent an SMS with additional reset instructions.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-400">
                                Didn't receive the email? Check your spam folder or try again.
                            </p>

                            <Button
                                onClick={() => setEmailSent(false)}
                                variant="outline"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                                Try Different Email
                            </Button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-700">
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

    return (
        <AuthLayout>
            <Head title="Reset Password - Gasify" />

            <Card className="bg-slate-800 border-slate-700 max-w-md">
                <CardContent className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
                        <p className="text-slate-400">
                            Enter your email address and we'll send you a reset link plus SMS code.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                                placeholder="your@email.com"
                                required
                                autoFocus
                            />
                            <InputError message={errors.email} />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
                            disabled={processing}
                        >
                            {processing ? 'Sending...' : 'Send Reset Link'}
                        </Button>

                        {status && (
                            <div className="text-center text-sm font-medium text-emerald-400 bg-emerald-500/10 p-3 rounded-lg">
                                {status}
                            </div>
                        )}
                    </form>

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
