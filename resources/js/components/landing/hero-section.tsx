import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Wallet, Phone } from "lucide-react"
import { Link } from "@inertiajs/react"
import { route } from 'ziggy-js'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-1500"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="mx-auto max-w-5xl text-center">
          {/* Trust Badge */}
          <div className="mb-8 inline-flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 text-sm font-medium text-emerald-400 shadow-lg backdrop-blur-sm">
            <Shield className="mr-2 h-4 w-4" />
            <span>99.7% Scam Block Rate</span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl mb-6">
            Gasify: Your Money,<br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Your Rules, No Scams
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-slate-300 mb-8">
            Scam-proof crypto for northern Nigeria – Airdrops, P2P, Gas in NGN.
            Join 1.2M users earning with $GTRUST. Built for the unbanked, powered by community.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg font-semibold shadow-xl" asChild>
              <a href="tel:*GASIFY#">
                <Phone className="mr-2 h-5 w-5" />
                Dial *GASIFY# to Start
              </a>
            </Button>
            <Button variant="outline" size="lg" className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white px-8 py-4 text-lg font-semibold" asChild>
              <Link href={route('register')}>
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">1.2M+</div>
              <div className="text-slate-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">₦18B+</div>
              <div className="text-slate-400">Protected Assets</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">99.7%</div>
              <div className="text-slate-400">Scam Block Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none"></div>
    </section>
  )
}
