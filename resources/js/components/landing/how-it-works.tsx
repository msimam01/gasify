import { Wallet, Zap, Rocket, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@inertiajs/react"
import { route } from 'ziggy-js'

const steps = [
  {
    name: 'Connect Your Wallet',
    description: 'Securely connect your preferred Web3 wallet to get started.',
    icon: Wallet,
  },
  {
    name: 'Select Network',
    description: 'Choose from our supported blockchains to manage gas fees.',
    icon: CheckCircle2,
  },
  {
    name: 'Fund & Manage',
    description: 'Deposit funds and let Gasify handle your gas fee management.',
    icon: Zap,
  },
  {
    name: 'Earn Rewards',
    description: 'Get access to exclusive airdrops and early project opportunities.',
    icon: Rocket,
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How Gasify Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get started in minutes and take control of your cross-chain gas fees
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="relative">
            <div className="absolute left-8 top-0 h-full w-0.5 bg-border md:left-1/2"></div>
            
            {steps.map((step, index) => (
              <div 
                key={step.name}
                className={`relative mb-12 flex items-start gap-6 md:${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div className={`absolute left-8 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground md:left-1/2 md:-translate-x-1/2 ${index === 0 ? 'ring-4 ring-primary/20' : ''}`}>
                  <step.icon className="h-4 w-4" />
                </div>
                
                <div className={`w-full rounded-xl border bg-card p-6 shadow-sm md:w-5/12 ${index % 2 === 0 ? 'md:mr-auto md:pr-16' : 'md:ml-auto md:pl-16'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{step.name}</h3>
                  </div>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link href={route('register')}>
              Get Started Now
              <Rocket className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
