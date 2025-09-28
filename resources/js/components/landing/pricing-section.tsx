import { CheckCircle2, Zap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@inertiajs/react"
import { route } from "ziggy-js"

const features = [
  'Multi-Chain Gas Management',
  'Airdrop Notifications',
  'Portfolio Tracking',
  'Gas Fee Optimization',
  '24/7 Support',
  'Exclusive Alpha Calls',
]

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for getting started',
    features: [0, 1, 2],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    description: 'For serious crypto users',
    features: [0, 1, 2, 3, 4],
    cta: 'Go Pro',
    popular: true,
  },
  {
    name: 'Whale',
    price: '$99',
    description: 'For professionals & institutions',
    features: [0, 1, 2, 3, 4, 5],
    cta: 'Enterprise',
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, Transparent Pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your needs. No hidden fees.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md ${
                plan.popular ? 'border-primary/50 ring-2 ring-primary/20' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </div>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Free' && <span className="text-muted-foreground">/month</span>}
                </div>
                <p className="mt-2 text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={feature} className="flex items-center">
                    <CheckCircle2
                      className={`mr-2 h-5 w-5 ${
                        plan.features.includes(index) ? 'text-primary' : 'text-muted-foreground/30'
                      }`}
                    />
                    <span
                      className={!plan.features.includes(index) ? 'text-muted-foreground/60' : ''}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className={`mt-8 w-full ${plan.popular ? 'bg-primary' : ''}`}
                variant={plan.popular ? 'default' : 'outline'}
                asChild
              >
                <Link href={plan.price === 'Free' ? route('register') : '#'}>
                  {plan.cta}
                  {plan.popular && <Zap className="ml-2 h-4 w-4" />}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border bg-card p-8 text-center">
          <div className="mx-auto flex max-w-2xl flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Need something custom?</h3>
            <p className="mt-2 text-muted-foreground">
              We offer custom solutions for institutions and high-volume users.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="#contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
