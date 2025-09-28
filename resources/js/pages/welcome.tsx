import { Head } from '@inertiajs/react';
import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { SupportedChains } from '@/components/landing/supported-chains';
import { HowItWorks } from '@/components/landing/how-it-works';
import { PricingSection } from '@/components/landing/pricing-section';
import { FAQSection } from '@/components/landing/faq-section';
import { Footer } from '@/components/landing/footer';

export default function Welcome() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Head title="Gasify - Multi-Chain Gas Fee Management">
                <meta name="description" content="Gasify provides seamless gas fee management across multiple blockchains with access to exclusive airdrops and early-stage crypto projects." />
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            
            <Navbar />
            
            <main className="pt-16">
                <HeroSection />
                <FeaturesSection />
                <SupportedChains />
                <HowItWorks />
                <PricingSection />
                <FAQSection />
                
                {/* CTA Section */}
                <section className="bg-primary/5 py-20">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Ready to simplify your crypto journey?
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                            Join thousands of users managing their gas fees and discovering new opportunities with Gasify.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <a
                                href="/register"
                                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                                Get Started for Free
                            </a>
                            <a
                                href="#how-it-works"
                                className="text-sm font-medium text-primary hover:text-primary/80"
                            >
                                Learn more <span aria-hidden="true">→</span>
                            </a>
                        </div>
                    </div>
                </section>
            </main>
            
            <Footer />
        </div>
    );
}