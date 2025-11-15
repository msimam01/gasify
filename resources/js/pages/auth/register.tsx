import { useState, useEffect } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, ArrowLeft, ArrowRight, User, Shield, Phone, Gift, Edit3 } from 'lucide-react'
import InputError from '@/components/input-error'
import { countries } from 'countries-list'
import ReactCountryFlag from 'react-country-flag'
import { route } from 'ziggy-js'
import { toast } from 'react-toastify'

const countryOptions = Object.entries(countries).map(([code, country], index) => {
    const phoneCodes = Object.values(country.phone)
    const phoneCode = phoneCodes.find(Boolean) as string || ''
    return {
        id: index + 1,
        code: code.toUpperCase(),
        name: country.name,
        nativeName: country.native,
        phoneCode,
        continent: country.continent || '',
    }
})

const steps = [
    { id: 1, title: 'Account', description: 'Create your account', icon: User },
    { id: 2, title: 'Security', description: 'Secure your account', icon: Shield },
    { id: 3, title: 'Location', description: 'Your location & contact', icon: Phone },
    { id: 4, title: 'Complete', description: 'Welcome to Gasify!', icon: Gift }
]

interface ValidationErrors {
    name?: string
    email?: string
    password?: string
    password_confirmation?: string
    phone?: string
    country?: string
    city?: string
}

interface TouchedFields {
    name?: boolean
    email?: boolean
    password?: boolean
    password_confirmation?: boolean
    phone?: boolean
    country?: boolean
    city?: boolean
}

export default function Register() {
    const [currentStep, setCurrentStep] = useState(1)
    const [countryId, setCountryId] = useState<number | null>(null)
    const [stateId, setStateId] = useState<number | null>(null)
    const [countryCode, setCountryCode] = useState("")
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
    const [touched, setTouched] = useState<TouchedFields>({})

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        country: '',
        city: '',
    })

    // Real-time validation
    useEffect(() => {
        const errors: ValidationErrors = {}

        // Step 1 validations
        if (currentStep >= 1) {
            if (!data.name.trim()) {
                errors.name = 'Full name is required'
            } else if (data.name.trim().length < 2) {
                errors.name = 'Name must be at least 2 characters'
            }

            if (!data.email.trim()) {
                errors.email = 'Email is required'
            } else if (!/\S+@\S+\.\S+/.test(data.email)) {
                errors.email = 'Please enter a valid email address'
            }
        }

        // Step 2 validations
        if (currentStep >= 2) {
            if (!data.password) {
                errors.password = 'Password is required'
            } else if (data.password.length < 8) {
                errors.password = 'Password must be at least 8 characters'
            } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
                errors.password = 'Password must contain uppercase, lowercase, and number'
            }

            if (!data.password_confirmation) {
                errors.password_confirmation = 'Please confirm your password'
            } else if (data.password !== data.password_confirmation) {
                errors.password_confirmation = 'Passwords do not match'
            }
        }

        // Step 3 validations
        if (currentStep >= 3) {
            if (!countryId) {
                errors.country = 'Please select your country'
            }

            if (!data.city.trim()) {
                errors.city = 'City is required'
            }

            if (!data.phone.trim()) {
                errors.phone = 'Phone number is required'
            } else if (!/^\+?[\d\s-()]{10,}$/.test(data.phone.replace(/\s/g, ''))) {
                errors.phone = 'Please enter a valid phone number'
            }
        }

        setValidationErrors(errors)
    }, [data, currentStep, countryId])

    const handleNext = () => {
        // Check if current step has validation errors
        const currentStepErrors = Object.keys(validationErrors).filter(key => {
            switch (currentStep) {
                case 1: return ['name', 'email'].includes(key)
                case 2: return ['password', 'password_confirmation'].includes(key)
                case 3: return ['country', 'city', 'phone'].includes(key)
                default: return false
            }
        })

        if (currentStepErrors.length === 0 && currentStep < steps.length) {
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
                    toast.success('Account created successfully! Welcome to Gasify!')
                    // Success handled by redirect
                },
                onError: (errors) => {
                    if (errors.email) {
                        toast.error('This email is already registered')
                    } else {
                        toast.error('Failed to create account. Please try again.')
                    }
                }
            })
        } else {
            handleNext()
        }
    }

    const progress = ((currentStep - 1) / (steps.length - 1)) * 100

    const isStepValid = () => {
        switch (currentStep) {
            case 1: return !validationErrors.name && !validationErrors.email
            case 2: return !validationErrors.password && !validationErrors.password_confirmation
            case 3: return !validationErrors.country && !validationErrors.city && !validationErrors.phone
            case 4: return true
            default: return false
        }
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-semibold text-white mb-2">Create Your Account</h3>
                            <p className="text-slate-400">Start your secure crypto journey</p>
                        </div>

                        {/* Social Login Options */}
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-600" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-slate-800 px-2 text-slate-400">Or continue with</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <a
                                    href={route('social.redirect', 'google')}
                                    className="flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
                                    Google
                                </a>

                                <a
                                    href={route('social.redirect', 'x')}
                                    className="flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
                                >
                                    <img src="/icons/x.svg" alt="X" className="w-5 h-5" />
                                    X
                                </a>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-600" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-800 px-2 text-slate-400">Create with email</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" className="text-slate-300">Full Name *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                                    className={`bg-slate-700 border-slate-600 text-white placeholder-slate-400 ${
                                        touched.name && validationErrors.name ? 'border-red-500' : touched.name && data.name && !validationErrors.name ? 'border-green-500' : ''
                                    }`}
                                    placeholder="John Doe"
                                    required
                                    autoFocus
                                />
                                <InputError message={touched.name && (validationErrors.name || errors.name)} />
                            </div>

                            <div>
                                <Label htmlFor="email" className="text-slate-300">Email Address *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                                    className={`bg-slate-700 border-slate-600 text-white placeholder-slate-400 ${
                                        touched.email && validationErrors.email ? 'border-red-500' : touched.email && data.email && !validationErrors.email ? 'border-green-500' : ''
                                    }`}
                                    placeholder="your@email.com"
                                    required
                                />
                                <InputError message={touched.email && (validationErrors.email || errors.email)} />
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
                                <Label htmlFor="password" className="text-slate-300">Password *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                                    className={`bg-slate-700 border-slate-600 text-white ${
                                        touched.password && validationErrors.password ? 'border-red-500' : touched.password && data.password && !validationErrors.password ? 'border-green-500' : ''
                                    }`}
                                    placeholder="Create a strong password"
                                    required
                                />
                                <InputError message={touched.password && (validationErrors.password || errors.password)} />
                                <div className="text-xs text-slate-500 mt-1 space-y-1">
                                    <p>Password must contain:</p>
                                    <ul className="list-disc list-inside ml-2">
                                        <li className={data.password.length >= 8 ? 'text-green-400' : ''}>At least 8 characters</li>
                                        <li className={/(?=.*[a-z])/.test(data.password) ? 'text-green-400' : ''}>One lowercase letter</li>
                                        <li className={/(?=.*[A-Z])/.test(data.password) ? 'text-green-400' : ''}>One uppercase letter</li>
                                        <li className={/(?=.*\d)/.test(data.password) ? 'text-green-400' : ''}>One number</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="password_confirmation" className="text-slate-300">Confirm Password *</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    onBlur={() => setTouched(prev => ({ ...prev, password_confirmation: true }))}
                                    className={`bg-slate-700 border-slate-600 text-white ${
                                        touched.password_confirmation && validationErrors.password_confirmation ? 'border-red-500' :
                                        touched.password_confirmation && data.password_confirmation && data.password === data.password_confirmation ? 'border-green-500' : ''
                                    }`}
                                    placeholder="Confirm your password"
                                    required
                                />
                                <InputError message={touched.password_confirmation && validationErrors.password_confirmation} />
                                {touched.password_confirmation && data.password_confirmation && data.password === data.password_confirmation && (
                                    <p className="text-xs text-green-400 mt-1">✓ Passwords match</p>
                                )}
                            </div>
                        </div>
                    </div>
                )
            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-semibold text-white mb-2">Location & Contact</h3>
                            <p className="text-slate-400">Tell us about yourself for account verification</p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="country" className="text-slate-300">Country *</Label>
                                    <Select
                                        value={countryId?.toString() || ''}
                                onValueChange={(value) => {
                                    const selectedCountry = countryOptions.find(c => c.id.toString() === value)
                                    setCountryId(selectedCountry ? selectedCountry.id : null)
                                    setData('country', selectedCountry ? selectedCountry.name : '')
                                    setTouched(prev => ({ ...prev, country: true, city: false, phone: false }))
                                    setData('city', '')
                                    setCountryCode(selectedCountry ? selectedCountry.phoneCode : '')
                                }}
                                    >
                                        <SelectTrigger className={`bg-slate-700 border-slate-600 text-white ${
                                            validationErrors.country ? 'border-red-500' : data.country && !validationErrors.country ? 'border-green-500' : ''
                                        }`}>
                                            <SelectValue placeholder="Select your country" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-600">
                                            {countryOptions.map((country) => (
                                                <SelectItem key={country.id} value={country.id.toString()} className="text-white hover:bg-slate-700">
                                                    <div className="flex items-center gap-2">
                                                        <ReactCountryFlag countryCode={country.code} svg className="w-5 h-4" />
                                                        <span>{country.name}</span>
                                                        <span className="text-slate-400">(+{country.phoneCode})</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={validationErrors.country} />
                                </div>

                                <div>
                                    <Label htmlFor="city" className="text-slate-300">City *</Label>
                                    <Input
                                        id="city"
                                        type="text"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        onBlur={() => setTouched(prev => ({ ...prev, city: true }))}
                                        className={`bg-slate-700 border-slate-600 text-white placeholder-slate-400 ${
                                            touched.city && validationErrors.city ? 'border-red-500' : touched.city && data.city && !validationErrors.city ? 'border-green-500' : ''
                                        }`}
                                        placeholder="Enter your city"
                                        required
                                    />
                                    <InputError message={touched.city && validationErrors.city} />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="phone" className="text-slate-300">Phone Number *</Label>
                                <div className="flex gap-2">
                                    <div className="flex items-center px-3 bg-slate-700 border border-slate-600 rounded-md">
                                        <span className="text-white">+{countryCode}</span>
                                    </div>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                                        className={`bg-slate-700 border-slate-600 text-white placeholder-slate-400 flex-1 ${
                                            touched.phone && validationErrors.phone ? 'border-red-500' : touched.phone && data.phone && !validationErrors.phone ? 'border-green-500' : ''
                                        }`}
                                        placeholder="XXX XXX XXXX"
                                        required
                                    />
                                </div>
                                <InputError message={touched.phone && (validationErrors.phone || errors.phone)} />
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
                                    className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white ${
                                        !isStepValid() ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    disabled={processing || !isStepValid()}
                                >
                                    {processing ? 'Processing...' : 'Continue'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}

                        {currentStep === steps.length && (
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCurrentStep(3)}
                                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                                    >
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Edit Info
                                    </Button>

                                    <Button
                                        type="submit"
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
                                        disabled={processing}
                                    >
                                        {processing ? 'Creating Account...' : 'Create My Account'}
                                    </Button>
                                </div>
                            </div>
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
