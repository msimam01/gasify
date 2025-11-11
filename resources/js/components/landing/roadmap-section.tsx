import { CheckCircle, Circle, MapPin } from "lucide-react"

const roadmapItems = [
  {
    phase: "MVP Live",
    date: "Q4 2024",
    status: "completed",
    description: "Core gas management and airdrop features launched. 50K+ users onboarded.",
    highlights: ["Multi-chain gas optimization", "Airdrop discovery", "Basic P2P trading"]
  },
  {
    phase: "$GTRUST Launched",
    date: "Q1 2025",
    status: "completed",
    description: "Native token launch with DAO governance. Community rewards program initiated.",
    highlights: ["Token launch", "DAO voting system", "Staking rewards"]
  },
  {
    phase: "Gasify 2.0",
    date: "Q2 2025",
    status: "current",
    description: "Complete super app with AI scam coach, USSD integration, and savings vaults.",
    highlights: ["AI scam protection", "USSD/WhatsApp bots", "12% APY vaults"]
  },
  {
    phase: "Pan-Africa Expansion",
    date: "2026",
    status: "upcoming",
    description: "Launch in 5+ African countries with localized features and partnerships.",
    highlights: ["Multi-country support", "Local partnerships", "Regional DAO"]
  }
]

export function RoadmapSection() {
  return (
    <section className="py-20 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Our Journey to Date</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            From MVP to Africa's leading crypto super app. Here's what's been accomplished and what's next.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 via-blue-400 to-purple-400"></div>

            <div className="space-y-12">
              {roadmapItems.map((item, index) => (
                <div key={index} className="relative flex items-start">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 ${
                    item.status === 'completed' ? 'bg-emerald-600 border-emerald-400' :
                    item.status === 'current' ? 'bg-blue-600 border-blue-400' :
                    'bg-slate-700 border-slate-600'
                  }`}>
                    {item.status === 'completed' ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : item.status === 'current' ? (
                      <MapPin className="w-8 h-8 text-white" />
                    ) : (
                      <Circle className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="ml-8 flex-1">
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">{item.phase}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          item.status === 'completed' ? 'bg-emerald-600 text-white' :
                          item.status === 'current' ? 'bg-blue-600 text-white' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {item.date}
                        </span>
                      </div>

                      <p className="text-slate-300 mb-4">{item.description}</p>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-white">Key Highlights:</h4>
                        <ul className="space-y-1">
                          {item.highlights.map((highlight, i) => (
                            <li key={i} className="flex items-center text-sm text-slate-400">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
