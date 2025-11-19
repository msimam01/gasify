import '../css/app.css';
import { Ziggy } from './ziggy';
import { route } from 'ziggy-js';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// WalletConnect imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { AppKitProvider } from '@reown/appkit/react';
import { mainnet, polygon, solana } from '@reown/appkit/networks';
import { wagmiAdapter } from './lib/appkit-init';
import { projectId, metadata } from './lib/walletconnect';

const appName = import.meta.env.VITE_APP_NAME || 'Gasify';

// WalletConnect setup
const queryClient = new QueryClient();

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Make Ziggy and route available globally
        if (typeof window !== 'undefined') {
            window.Ziggy = Ziggy;
            window.route = route;
        }

        // AppKit with AppKitProvider
        root.render(
            <AppKitProvider 
                projectId={projectId}
                networks={[mainnet, polygon, solana]}
                metadata={metadata}
                features={{
                    analytics: false,
                    email: false,
                    socials: [],
                    emailShowWallets: false
                }}
                themeMode="light"
                themeVariables={{
                    '--w3m-z-index': '999'
                }}
            >
                <WagmiProvider config={wagmiAdapter.wagmiConfig}>
                    <QueryClientProvider client={queryClient}>
                        <App {...props} />
                        <ToastContainer
                            position="top-right"
                            autoClose={5000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            theme="dark"
                        />
                    </QueryClientProvider>
                </WagmiProvider>
            </AppKitProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
