import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"
import { useState, useEffect } from "react"

const testimonials = [
  {
    name: "Aminu Ibrahim",
    location: "Kano",
    text: "Saved ₦50K from a crypto scam thanks to Gasify's AI coach. Now I earn daily with $GTRUST!",
    rating: 5,
    avatar: "🇳🇬"
  },
  {
    name: "Fatima Hassan",
    location: "Lagos",
    text: "The USSD feature is a game-changer. I check my portfolio and vote in DAO even without internet.",
    rating: 5,
    avatar: "🇳🇬"
  },
  {
    name: "Chukwuma Nwosu",
    location: "Abuja",
    text: "P2P trading with escrow protection gave me peace of mind. 120 POS partners make it trustworthy.",
    rating: 5,
    avatar: "🇳🇬"
  },
  {
    name: "Zainab Umar",
    location: "Kaduna",
    text: "Earning 12% APY on my savings vault while sleeping. Gasify understands Nigerian needs.",
    rating: 5,
    avatar: "🇳🇬"
  },
  {
    name: "Ibrahim Musa",
    location: "Sokoto",
    text: "The Hausa AI coach caught a phishing attempt instantly. This app protects our community.",
    rating: 5,
    avatar: "🇳🇬"
  }
]

const stats = [
  { label: "Active Users", value: "1.2M+", color: "text-emerald-400" },
  { label: "Assets Protected", value: "₦18B+", color: "text-blue-400" },
  { label: "POS Partners", value: "120+", color: "text-purple-400" },
  { label: "Scam Blocks", value: "2.1M+", color: "text-orange-400" }
]

export function SocialProofSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-20 bg-slate-800">
      <div className="container mx-auto px-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`text-4xl font-bold mb-2 ${stat.color}`}>{stat.value}</div>
              <div className="text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Carousel */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Trusted by Nigerians Nationwide</h2>

          <div className="relative">
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-8">
                <Quote className="w-12 h-12 text-emerald-400 mb-6" />

                <blockquote className="text-xl text-slate-200 mb-6 leading-relaxed">
                  "{testimonials[currentIndex].text}"
                </blockquote>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-xl mr-4">
                      {testimonials[currentIndex].avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonials[currentIndex].name}</div>
                      <div className="text-slate-400">{testimonials[currentIndex].location}</div>
                    </div>
                  </div>

                  <div className="flex">
                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Carousel indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
