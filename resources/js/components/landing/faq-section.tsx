import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link } from "@inertiajs/react"

const faqs = [
  {
    question: 'What is Gasify?',
    answer: 'Gasify is a multi-chain gas fee management platform that helps users manage their blockchain transaction fees across multiple networks, while providing access to exclusive airdrops and early-stage crypto projects.'
  },
  {
    question: 'How does Gasify work?',
    answer: 'Gasify connects to your Web3 wallet and provides tools to monitor, manage, and optimize your gas fees across supported blockchains. Our platform also notifies you about profitable airdrops and new project launches.'
  },
  {
    question: 'Is Gasify secure?',
    answer: 'Yes, Gasify is non-custodial, meaning you maintain full control of your private keys and funds. We use industry-standard security practices and never store your sensitive information.'
  },
  {
    question: 'Which blockchains does Gasify support?',
    answer: 'We currently support Ethereum, Solana, Polygon, BNB Chain, Avalanche, Optimism, and Arbitrum, with plans to add more networks based on user demand.'
  },
  {
    question: 'How do I get started with Gasify?',
    answer: 'Simply connect your Web3 wallet to our platform, select your preferred networks, and start managing your gas fees. No registration is required to get started with basic features.'
  },
  {
    question: 'What are the costs involved?',
    answer: 'Gasify offers a free tier with basic features. Our Pro and Whale plans provide additional features and benefits. You only pay network transaction fees for on-chain operations.'
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently Asked Questions</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Can't find the answer you're looking for? Reach out to our support team.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="overflow-hidden rounded-lg border">
                <button
                  className="flex w-full items-center justify-between p-6 text-left"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="text-lg font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    openIndex === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 pt-0 text-muted-foreground">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <h3 className="text-lg font-medium">Still have questions?</h3>
            <p className="mt-2 text-muted-foreground">
              Our support team is here to help you get started.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="#contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
