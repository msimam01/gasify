import { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, ArrowLeft, ArrowRight, Gift } from 'lucide-react'
import InputError from '@/components/input-error'

const steps = [
    { id: 1, title: 'Email', description: 'Create your account' },
    { id: 2, title: 'Password', description: 'Secure your account' },
    { id: 3, title: 'Phone', description: 'Verify your identity' },
    { id: 4, title: 'BVN', description: 'Complete verification' },
    { id: 5, title: 'Done', description: 'Welcome to Gasify!' }
]

export default function Register() {
    const [currentStep, setCurrentStep] = useState(1)

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        bvn: '',
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
            post('/register')
        } else {
            handleNext()
        }
    }

    const progress = ((currentStep - 1) / (steps.length - 1)) * 100

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
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
                )
            case 2:
                return (
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
                )
            case 3:
                return (
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
                        </div>
                        <p className="text-sm text-slate-400">
                            We'll send an OTP to verify your phone number
                        </p>
                    </div>
                )
            case 4:
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="bvn" className="text-slate-300">Bank Verification Number (BVN)</Label>
                            <Input
                                id="bvn"
                                type="text"
                                value={data.bvn}
                                onChange={(e) => setData('bvn', e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                                placeholder="Enter your 11-digit BVN"
                                maxLength={11}
                                required
                            />
                            <InputError message={errors.bvn} />
                        </div>
                        <p className="text-sm text-slate-400">
                            BVN verification takes ~10 seconds and is required for full account access
                        </p>
                    </div>
                )
            case 5:
                return (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Account Created!</h3>
                            <p className="text-slate-400 mb-4">
                                Welcome to Gasify. Your account is now active and secure.
                            </p>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                                <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                                    <Gift className="w-5 h-5" />
                                    <span className="font-semibold">Bonus Reward</span>
                                </div>
                                <p className="text-white font-bold text-lg">₦500 $GTRUST Airdrop Claimed!</p>
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
                            <h2 className="text-xl font-bold text-white">Create Account</h2>
                            <span className="text-sm text-slate-400">
                                Step {currentStep} of {steps.length}
                            </span>
                        </div>
                        <Progress value={progress} className="h-2 bg-slate-700" />
                        <div className="flex justify-between mt-2">
                            {steps.map((step) => (
                                <div
                                    key={step.id}
                                    className={`flex flex-col items-center ${
                                        step.id <= currentStep ? 'text-emerald-400' : 'text-slate-600'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                        step.id < currentStep ? 'bg-emerald-600 text-white' :
                                        step.id === currentStep ? 'bg-emerald-600 text-white' :
                                        'bg-slate-700 text-slate-400'
                                    }`}>
                                        {step.id < currentStep ? <CheckCircle className="w-4 h-4" /> : step.id}
                                    </div>
                                    <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
                                </div>
                            ))}
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
                                    {processing ? 'Processing...' : currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                                    {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
                                </Button>
                            </div>
                        )}

                        {currentStep === steps.length && (
                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
                            >
                                Start Trading Securely
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
                </CardContent>
            </Card>

            <div className="text-center text-xs text-slate-500 mt-6">
                By creating an account, you agree to our Terms of Service and Privacy Policy
            </div>
        </AuthLayout>
    )
}
