import { CheckCircle2, Zap, Globe, Shield, Rocket, BarChart2, Users } from "lucide-react"

const features = [
  {
    name: 'Multi-Chain Support',
    description: 'Manage gas fees across multiple blockchains from a single dashboard.',
    icon: Globe,
  },
  {
    name: 'Airdrop Access',
    description: 'Get exclusive access to thousands of airdrops and early-stage crypto projects.',
    icon: Rocket,
  },
  {
    name: 'Gas Optimization',
    description: 'Smart algorithms to help you save on transaction fees across networks.',
    icon: Zap,
  },
  {
    name: 'Secure & Private',
    description: 'Non-custodial solution that keeps you in control of your assets.',
    icon: Shield,
  },
  {
    name: 'Portfolio Tracking',
    description: 'Monitor all your cross-chain assets in one place with real-time updates.',
    icon: BarChart2,
  },
  {
    name: 'Community Driven',
    description: 'Join a growing community of crypto enthusiasts and developers.',
    icon: Users,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need in one place
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Gasify provides a comprehensive suite of tools to manage your crypto transactions
            and maximize your opportunities in the blockchain space.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 opacity-0 transition-all duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
