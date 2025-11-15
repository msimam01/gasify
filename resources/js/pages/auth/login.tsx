import { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Phone, Mail, Shield } from 'lucide-react'
import InputError from '@/components/input-error'

interface LoginProps {
    status?: string
    canResetPassword: boolean
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
    const [remember, setRemember] = useState(false)

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        phone: '',
        password: '',
        remember: false,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (loginMethod === 'email') {
            post('/login', {
                onSuccess: () => reset('password'),
            })
        } else {
            // Phone login - send OTP first
            post('/phone-login/send-otp', {
                onSuccess: () => {
                    // Reset form and switch to OTP page
                    reset('password')
                    window.location.href = '/phone-login/otp'
                }
            })
        }
    }

    return (
        <AuthLayout>
            <Head title="Secure Login - Gasify" />

            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-slate-400">Access your secure crypto account</p>
                    </div>

                    <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as 'email' | 'phone')}>
                        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                            <TabsTrigger value="email" className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                            </TabsTrigger>
                            <TabsTrigger value="phone" className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Phone
                            </TabsTrigger>
                        </TabsList>

                        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                            <TabsContent value="email" className="space-y-4 mt-0">
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

                                <div>
                                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white"
                                        required
                                    />
                                    <InputError message={errors.password} />
                                </div>
                            </TabsContent>

                            <TabsContent value="phone" className="space-y-4 mt-0">
                                <div>
                                    <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                                        placeholder="+234 xxx xxx xxxx"
                                        required
                                    />
                                    <InputError message={errors.phone} />
                                </div>

                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                        <Phone className="w-4 h-4" />
                                        <span className="font-medium">Phone Verification</span>
                                    </div>
                                    <p className="text-sm text-slate-300">
                                        We'll send a 6-digit OTP code to your phone number for verification.
                                    </p>
                                </div>
                            </TabsContent>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        checked={remember}
                                        onCheckedChange={(checked) => {
                                            setRemember(checked as boolean)
                                            setData('remember', checked as boolean)
                                        }}
                                    />
                                    <Label htmlFor="remember" className="text-sm text-slate-400">
                                        Remember me
                                    </Label>
                                </div>

                                {canResetPassword && (
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-emerald-400 hover:text-emerald-300"
                                    >
                                        Forgot password?
                                    </Link>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
                                disabled={processing}
                            >
                                {processing ? 'Logging in...' : 'Login Securely'}
                            </Button>

                            {status && (
                                <div className="text-center text-sm font-medium text-emerald-400 bg-emerald-500/10 p-3 rounded-lg">
                                    {status}
                                </div>
                            )}

                            {/* Social Login Buttons */}
                            <div className="mt-6 space-y-3">
                                <a
                                    href={route('social.redirect', 'google')}
                                    className="flex items-center justify-center w-full gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
                                    Continue with Google
                                </a>

                                <a
                                    href={route('social.redirect', 'x')}
                                    className="flex items-center justify-center w-full gap-3 px-4 py-3 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
                                >
                                    <img src="/icons/x.svg" alt="X" className="w-5 h-5" />
                                    Continue with X
                                </a>
                            </div>

                            {/* USSD Fallback */}
                            <div className="text-center">
                                <div className="text-slate-400 text-sm mb-2">No internet? Use USSD</div>
                                <a
                                    href="tel:*GASIFY#"
                                    className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium"
                                >
                                    <Phone className="w-4 h-4" />
                                    Dial *GASIFY# to login
                                </a>
                            </div>

                            <div className="text-center">
                                <span className="text-slate-400">New to Gasify? </span>
                                <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
                                    Create account
                                </Link>
                            </div>
                        </form>
                    </Tabs>
                </CardContent>
            </Card>

            <div className="text-center text-xs text-slate-500 mt-6">
                Protected by bank-grade security · AI scam detection active
            </div>
        </AuthLayout>
    )
}
