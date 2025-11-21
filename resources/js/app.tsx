import '../css/app.css';
import { Ziggy } from './ziggy';
import { route } from 'ziggy-js';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Wallet and Web3 providers
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from './lib/walletconnect';

// Import walletconnect to initialize AppKit (this triggers the global initialization)
import './lib/walletconnect';

// Initialize query client with network error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const appName = import.meta.env.VITE_APP_NAME || 'Gasify';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Initialize theme before rendering the app
        initializeTheme();

        if (typeof window !== 'undefined') {
            window.Ziggy = Ziggy;
            window.route = route;
        }

        return root.render(
            <WagmiProvider config={wagmiConfig}>
                <QueryClientProvider client={queryClient}>
                    <App {...props} />
                    <ToastContainer
                        position="bottom-right"
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
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
