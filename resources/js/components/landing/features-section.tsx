import { Card, CardContent } from "@/components/ui/card"
import { Search, Handshake, Fuel, PiggyBank, MessageSquare, Users } from "lucide-react"

const features = [
  {
    name: 'Airdrop Discovery',
    description: 'Spot legit drops on Solana/ETH – Filters & Alerts. Never miss valuable opportunities.',
    icon: Search,
    color: 'bg-blue-600'
  },
  {
    name: 'P2P Trading',
    description: 'Secure swaps with escrow & local ratings. Trade safely with verified Nigerian users.',
    icon: Handshake,
    color: 'bg-emerald-600'
  },
  {
    name: 'Gas Management',
    description: 'Buy credits in NGN – Auto-optimize fees. Save up to 70% on transaction costs.',
    icon: Fuel,
    color: 'bg-orange-600'
  },
  {
    name: 'Savings Vaults',
    description: 'Lock & earn 12% APY – No bank needed. Your crypto works for you 24/7.',
    icon: PiggyBank,
    color: 'bg-purple-600'
  },
  {
    name: 'USSD/WhatsApp Bot',
    description: 'Offline access: *GASIFY# for balance & votes. Crypto in your pocket, always.',
    icon: MessageSquare,
    color: 'bg-green-600'
  },
  {
    name: 'DAO Governance',
    description: 'Vote with $GTRUST – Own the platform. Your voice shapes Gasify\'s future.',
    icon: Users,
    color: 'bg-indigo-600'
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Gasify 2.0: The Complete Crypto Super App
          </h2>
          <p className="text-xl text-slate-300">
            From airdrops to governance, everything you need to thrive in crypto – built for Nigeria.
          </p>
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={feature.name} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 group">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.name}</h3>
                  <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
