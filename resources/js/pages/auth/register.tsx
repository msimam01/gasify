import { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, ArrowLeft, ArrowRight, User, Shield, Phone, Gift } from 'lucide-react'
import InputError from '@/components/input-error'

const steps = [
    { id: 1, title: 'Account', description: 'Create your account', icon: User },
    { id: 2, title: 'Security', description: 'Secure your account', icon: Shield },
    { id: 3, title: 'Contact', description: 'Verify your identity', icon: Phone },
    { id: 4, title: 'Complete', description: 'Welcome to Gasify!', icon: Gift }
]

export default function Register() {
    const [currentStep, setCurrentStep] = useState(1)

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
    })

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (currentStep === steps.length) {
            post('/register', {
                onSuccess: () => {
                    // Success handled by redirect
                },
            })
        } else {
            handleNext()
        }
    }

    const progress = ((currentStep - 1) / (steps.length - 1)) * 100

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-semibold text-white mb-2">Create Your Account</h3>
                            <p className="text-slate-400">Start your secure crypto journey</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                                    placeholder="John Doe"
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.name} />
                            </div>

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
                                />
                                <InputError message={errors.email} />
                            </div>
                        </div>
                    </div>
                )
            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-semibold text-white mb-2">Secure Your Account</h3>
                            <p className="text-slate-400">Create a strong password for protection</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="bg-slate-700 border-slate-600 text-white"
                                    placeholder="Create a strong password"
                                    required
                                />
                                <InputError message={errors.password} />
                                <p className="text-xs text-slate-500 mt-1">
                                    Must be at least 8 characters long
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="password_confirmation" className="text-slate-300">Confirm Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="bg-slate-700 border-slate-600 text-white"
                                    placeholder="Confirm your password"
                                    required
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>
                        </div>
                    </div>
                )
            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-semibold text-white mb-2">Contact Information</h3>
                            <p className="text-slate-400">We'll use this to secure your account</p>
                        </div>

                        <div className="space-y-4">
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
                                <p className="text-xs text-slate-500 mt-1">
                                    We'll send OTP verification to this number
                                </p>
                            </div>
                        </div>
                    </div>
                )
            case 4:
                return (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Ready to Start!</h3>
                            <p className="text-slate-400 mb-6">
                                Your account will be created with bank-grade security and AI scam protection.
                            </p>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                                    <Gift className="w-5 h-5" />
                                    <span className="font-semibold">Welcome Bonus</span>
                                </div>
                                <p className="text-white font-bold text-lg">₦500 $GTRUST Airdrop!</p>
                                <p className="text-slate-400 text-sm">Claimed upon account creation</p>
                            </div>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <AuthLayout>
            <Head title="Create Account - Gasify" />

            <Card className="bg-slate-800 border-slate-700 max-w-lg">
                <CardContent className="p-8">
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-white">Create Account</h2>
                            <span className="text-sm text-slate-400">
                                Step {currentStep} of {steps.length}
                            </span>
                        </div>

                        <Progress value={progress} className="h-2 bg-slate-700 mb-4" />

                        <div className="flex justify-between">
                            {steps.map((step) => {
                                const Icon = step.icon
                                return (
                                    <div
                                        key={step.id}
                                        className={`flex flex-col items-center ${
                                            step.id <= currentStep ? 'text-emerald-400' : 'text-slate-600'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${
                                            step.id < currentStep ? 'bg-emerald-600 text-white' :
                                            step.id === currentStep ? 'bg-emerald-600 text-white border-2 border-emerald-400' :
                                            'bg-slate-700 text-slate-400'
                                        }`}>
                                            {step.id < currentStep ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                        </div>
                                        <span className="text-xs font-medium">{step.title}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {renderStepContent()}

                        {currentStep < steps.length && (
                            <div className="flex gap-4">
                                {currentStep > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBack}
                                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>
                                )}

                                <Button
                                    type="submit"
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={processing}
                                >
                                    {processing ? 'Processing...' : 'Continue'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}

                        {currentStep === steps.length && (
                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
                                disabled={processing}
                            >
                                {processing ? 'Creating Account...' : 'Create My Account'}
                            </Button>
                        )}
                    </form>

                    {currentStep === 1 && (
                        <div className="text-center mt-6">
                            <span className="text-slate-400">Already have an account? </span>
                            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                                Sign in
                            </Link>
                        </div>
                    )}

                    {/* USSD Fallback */}
                    <div className="text-center mt-4">
                        <div className="text-slate-400 text-sm mb-2">No internet? Use USSD</div>
                        <a
                            href="tel:*GASIFY#"
                            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm"
                        >
                            <Phone className="w-4 h-4" />
                            Dial *GASIFY# to register
                        </a>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center text-xs text-slate-500 mt-6">
                Protected by bank-grade security · AI scam detection active
            </div>
        </AuthLayout>
    )
}
