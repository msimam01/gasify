import { useState, useEffect } from "react"
import { Link } from "@inertiajs/react"
import { route } from 'ziggy-js'
import { Menu, X, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: 'Features', href: '#features' },
  { name: 'How it works', href: '#how-it-works' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'FAQs', href: '#faq' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/80 backdrop-blur-md border-b' : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto flex items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="#" className="-m-1.5 p-1.5 flex items-center">
            <Zap className="h-6 w-6 text-primary" />
            <span className="ml-2 text-xl font-bold">Gasify</span>
          </Link>
        </div>
        
        <div className="flex lg:hidden
        ">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-foreground/70"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium leading-6 text-foreground/70 hover:text-primary transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-4">
          <Button variant="ghost" asChild>
            <Link href={route('login')}>Log in</Link>
          </Button>
          <Button asChild>
            <Link href={route('register')}>Get started</Link>
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`lg:hidden ${mobileMenuOpen ? 'fixed inset-0 z-50' : 'hidden'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background p-6 sm:max-w-sm sm:ring-1 sm:ring-foreground/10">
          <div className="flex items-center justify-between">
            <Link href="#" className="-m-1.5 p-1.5 flex items-center">
              <Zap className="h-6 w-6 text-primary" />
              <span className="ml-2 text-xl font-bold">Gasify</span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-foreground/70"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-foreground/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-medium leading-7 text-foreground/70 hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                <div className="flex flex-col gap-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={route('login')} onClick={() => setMobileMenuOpen(false)}>
                      Log in
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href={route('register')} onClick={() => setMobileMenuOpen(false)}>
                      Get started
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
