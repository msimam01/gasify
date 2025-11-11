import { Twitter, MessageCircle, Mail, MapPin } from "lucide-react"
import { Link } from "@inertiajs/react"
import { Button } from "@/components/ui/button"

const navigation = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Airdrops', href: '#' },
    { name: 'P2P Trading', href: '#' },
    { name: 'Gas Management', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'DAO', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Careers', href: '#' },
  ],
  support: [
    { name: 'Help Center', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Community', href: '#' },
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
      name: 'WhatsApp',
      href: '#',
      icon: MessageCircle,
    },
  ],
}

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 sm:py-16 lg:px-8">
        {/* Newsletter Signup */}
        <div className="mb-12 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
          <p className="text-slate-300 mb-6">Get the latest on airdrops, DAO votes, and Gasify updates.</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3">
              Subscribe
            </Button>
          </div>
        </div>

        <nav className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12" aria-label="Footer">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-3">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-slate-300 hover:text-emerald-400 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-slate-300 hover:text-emerald-400 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-3">
              {navigation.support.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-slate-300 hover:text-emerald-400 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-slate-300 hover:text-emerald-400 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="flex items-center space-x-6">
                {navigation.social.map((item) => (
                  <Link key={item.name} href={item.href} className="text-slate-400 hover:text-emerald-400 transition-colors">
                    <span className="sr-only">{item.name}</span>
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Made for North, Trusted by All
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="#" className="flex items-center text-slate-400 hover:text-emerald-400 transition-colors">
                <Mail className="mr-2 h-4 w-4" />
                support@gasify.io
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500">
            <p>© {new Date().getFullYear()} Gasify. All rights reserved. Built for Africa's crypto future.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
