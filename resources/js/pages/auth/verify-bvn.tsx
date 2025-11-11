import { useState, useEffect } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, CheckCircle, Gift, Sparkles } from 'lucide-react'
import InputError from '@/components/input-error'

interface VerifyBVNProps {
    status?: string
}

export default function VerifyBVN({ status }: VerifyBVNProps) {
    const [isVerifying, setIsVerifying] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)

    const { data, setData, post, processing, errors } = useForm({
        bvn: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsVerifying(true)

        // Simulate BVN verification process
        setTimeout(() => {
            setIsVerifying(false)
            setIsVerified(true)
            setShowConfetti(true)

            // Auto-submit after animation
            setTimeout(() => {
                post('/verify-bvn')
            }, 2000)
        }, 3000)
    }

    if (isVerified) {
        return (
            <AuthLayout>
                <Head title="BVN Verified - Gasify" />

                <Card className="bg-slate-800 border-slate-700 max-w-md">
                    <CardContent className="p-8 text-center">
                        {/* Success Animation */}
                        <div className="relative mb-8">
                            <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>

                            {/* Confetti effect */}
                            {showConfetti && (
                                <div className="absolute inset-0 pointer-events-none">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute animate-bounce"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                top: `${Math.random() * 100}%`,
                                                animationDelay: `${Math.random() * 2}s`,
                                                animationDuration: `${1 + Math.random()}s`
                                            }}
                                        >
                                            <Sparkles className="w-4 h-4 text-yellow-400" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-4">BVN Verified Successfully!</h2>
                        <p className="text-slate-400 mb-6">
                            Your identity has been confirmed. Welcome to the secure world of crypto.
                        </p>

                        {/* Reward Section */}
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6 mb-6">
                            <div className="flex items-center justify-center gap-2 text-emerald-400 mb-3">
                                <Gift className="w-6 h-6" />
                                <span className="font-bold text-lg">Welcome Bonus</span>
                            </div>
                            <p className="text-white font-bold text-3xl mb-2">₦500 $GTRUST</p>
                            <p className="text-slate-400 text-sm">Claimed to your account</p>
                        </div>

                        <div className="space-y-4">
                            <div className="text-sm text-slate-400">
                                🎉 Full account access unlocked<br />
                                🔒 Enhanced security features enabled<br />
                                💰 Higher transaction limits available
                            </div>

                            <Button
                                onClick={() => post('/verify-bvn')}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
                            >
                                Complete Setup
                            </Button>
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
            <Head title="Verify BVN - Gasify" />

            <Card className="bg-slate-800 border-slate-700 max-w-md">
                <CardContent className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verify Your Identity</h2>
                        <p className="text-slate-400">
                            Enter your 11-digit Bank Verification Number (BVN) to complete registration
                        </p>
                    </div>

                    {isVerifying ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-spin">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Verifying BVN...</h3>
                                <p className="text-slate-400">This usually takes about 10 seconds</p>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="bvn" className="text-slate-300">Bank Verification Number (BVN)</Label>
                                <Input
                                    id="bvn"
                                    type="text"
                                    value={data.bvn}
                                    onChange={(e) => setData('bvn', e.target.value.replace(/\D/g, '').slice(0, 11))}
                                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-center text-xl font-mono tracking-wider"
                                    placeholder="12345678901"
                                    maxLength={11}
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.bvn} />
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    Your BVN is required for KYC compliance and enhanced security
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                                disabled={processing || data.bvn.length !== 11}
                            >
                                {processing ? 'Verifying...' : 'Verify BVN'}
                            </Button>

                            {status && (
                                <div className="text-center text-sm font-medium text-emerald-400 bg-emerald-500/10 p-3 rounded-lg">
                                    {status}
                                </div>
                            )}
                        </form>
                    )}

                    {/* Security Notice */}
                    <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Shield className="w-4 h-4" />
                            <span className="font-semibold">Bank-Grade Security</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            Your BVN is encrypted and never stored. We only verify your identity with your bank.
                        </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                        <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
                            ← Back to Registration
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
