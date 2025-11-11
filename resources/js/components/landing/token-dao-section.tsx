import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Vote, Coins, TrendingUp } from "lucide-react"

const tokenomicsData = [
  { name: 'Community Rewards', value: 40, color: '#10B981' },
  { name: 'DAO Treasury', value: 25, color: '#3B82F6' },
  { name: 'Development', value: 20, color: '#8B5CF6' },
  { name: 'Liquidity', value: 10, color: '#F59E0B' },
  { name: 'Team (Vested)', value: 5, color: '#EF4444' }
]

const daoFeatures = [
  {
    icon: Vote,
    title: "Vote on Features",
    description: "Decide what gets built next. Your $GTRUST = Your vote."
  },
  {
    icon: Coins,
    title: "Gas Fee Credits",
    description: "Use $GTRUST to pay for transaction fees at discounted rates."
  },
  {
    icon: TrendingUp,
    title: "Staking Rewards",
    description: "Lock $GTRUST for governance rights and earn protocol fees."
  }
]

export function TokenDaoSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-slate-900 to-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Power It with $GTRUST</h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            The native token that fuels Gasify's ecosystem. Earn, stake, and govern the future of crypto in Nigeria.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Tokenomics Chart */}
          <div>
            <h3 className="text-2xl font-bold mb-6">Tokenomics Breakdown</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tokenomicsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tokenomicsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              {tokenomicsData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="text-sm">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-slate-400">{item.value}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DAO Features */}
          <div>
            <h3 className="text-2xl font-bold mb-6">Join the DAO</h3>
            <p className="text-slate-300 mb-8">
              Vote via USSD or app. Every $GTRUST holder participates in shaping Gasify's future.
            </p>

            <div className="space-y-6 mb-8">
              {daoFeatures.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
                    <p className="text-slate-300">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg font-semibold">
              Claim Airdrop
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
