import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, Shield, Coins } from "lucide-react"

const valueProps = [
  {
    icon: DollarSign,
    title: "Zero-Fee NGN Ramps",
    description: "Convert Naira to crypto instantly with no hidden fees. Direct bank transfers and mobile money integration.",
    benefits: ["Instant conversion", "Bank-grade security", "No minimum deposit"],
    cta: "Learn More"
  },
  {
    icon: Shield,
    title: "AI Scam Coach in Hausa/Pidgin",
    description: "Our AI analyzes transactions in real-time, speaking your language to protect you from crypto scams.",
    benefits: ["24/7 protection", "Multi-language support", "Smart alerts"],
    cta: "Try Demo"
  },
  {
    icon: Coins,
    title: "Earn $GTRUST Daily",
    description: "Stake, trade, or hold $GTRUST to earn up to 12% APY. Your rewards, your rules.",
    benefits: ["Daily rewards", "Compound interest", "Flexible staking"],
    cta: "Start Earning"
  }
]

export function ValuePropSection() {
  return (
    <section className="py-20 bg-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Choose Gasify?</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Built for Nigeria's crypto pioneers. Secure, local, and rewarding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {valueProps.map((prop, index) => (
            <Card key={index} className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-emerald-600 rounded-lg flex items-center justify-center mb-6">
                  <prop.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-4">{prop.title}</h3>
                <p className="text-slate-300 mb-6">{prop.description}</p>

                <ul className="space-y-2 mb-6">
                  {prop.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center text-sm text-slate-400">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>

                <button className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  {prop.cta} →
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
