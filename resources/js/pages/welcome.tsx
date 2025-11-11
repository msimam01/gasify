import { Head } from '@inertiajs/react';
import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { ValuePropSection } from '@/components/landing/value-prop-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { TokenDaoSection } from '@/components/landing/token-dao-section';
import { RoadmapSection } from '@/components/landing/roadmap-section';
import { Footer } from '@/components/landing/footer';

export default function Welcome() {
    return (
        <div className="min-h-screen bg-slate-900 text-white dark">
            <Head title="Gasify - Scam-Proof Crypto for Nigeria">
                <meta name="description" content="Gasify: Your Money, Your Rules, No Scams. Scam-proof crypto for northern Nigeria – Airdrops, P2P, Gas in NGN. Join 1.2M users earning with $GTRUST." />
                <meta name="keywords" content="Gasify, crypto Nigeria, scam-proof, airdrops, P2P trading, gas fees, $GTRUST token, DAO" />
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <Navbar />

            <main>
                <HeroSection />
                <ValuePropSection />
                <FeaturesSection />
                <SocialProofSection />
                <TokenDaoSection />
                <RoadmapSection />
            </main>

            <Footer />
        </div>
    );
}
