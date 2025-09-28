import { Twitter, Github, MessageCircle, Mail } from "lucide-react"
import { Link } from "@inertiajs/react"

const navigation = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'How it works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Airdrops', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Contact', href: '#contact' },
  ],
  legal: [
    { name: 'Privacy', href: '#' },
    { name: 'Terms', href: '#' },
    { name: 'Cookie Policy', href: '#' },
  ],
  social: [
    {
      name: 'Twitter',
      href: '#',
      icon: Twitter,
    },
    {
      name: 'GitHub',
      href: '#',
      icon: Github,
    },
    {
      name: 'Discord',
      href: '#',
      icon: MessageCircle,
    },
  ],
}

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 sm:py-16 lg:px-8">
        <nav className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12" aria-label="Footer">
          <div className="pb-6">
            <h3 className="text-sm font-semibold leading-6">Product</h3>
            <ul className="mt-6 space-y-4">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm leading-6 text-muted-foreground hover:text-foreground">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="pb-6">
            <h3 className="text-sm font-semibold leading-6">Company</h3>
            <ul className="mt-6 space-y-4">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm leading-6 text-muted-foreground hover:text-foreground">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        
        <div className="mt-10 flex flex-col items-center justify-between border-t border-border pt-10 sm:flex-row">
          <div className="flex items-center space-x-6">
            {navigation.social.map((item) => (
              <Link key={item.name} href={item.href} className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </Link>
            ))}
          </div>
          <div className="mt-6 flex items-center space-x-4 text-sm leading-5 text-muted-foreground sm:mt-0">
            <span>© {new Date().getFullYear()} Gasify. All rights reserved.</span>
          </div>
          <div className="mt-6 sm:mt-0">
            <Link href="#" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
              <Mail className="mr-2 h-4 w-4" />
              support@gasify.io
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
