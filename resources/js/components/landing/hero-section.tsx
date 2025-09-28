import { Button } from "@/components/ui/button"
import { ArrowRight, Zap } from "lucide-react"
import { Link } from "@inertiajs/react"
import { route } from 'ziggy-js'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-20 md:py-32">
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full border bg-background px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
            <Zap className="mr-2 h-4 w-4" />
            <span>Revolutionizing Gas Fee Management</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Multi-Chain Gas Fees,<br />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Simplified</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Gasify provides seamless gas fee management across multiple blockchains,
            giving you access to exclusive airdrops and early-stage crypto projects.
            Never miss an opportunity again.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href={route('register')}>
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="#how-it-works">
                How It Works
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10 opacity-10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      </div>
    </section>
  )
}
