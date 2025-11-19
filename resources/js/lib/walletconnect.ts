// Get project ID from environment, default to placeholder for development
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string || 'demo_project_id';

if (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID === undefined) {
  console.warn('VITE_WALLETCONNECT_PROJECT_ID not set. Using demo mode.');
}

export const metadata = {
  name: 'Gasify',
  description: 'Scam-resistant crypto for Nigerians',
  url: window.location.origin,
  icons: ['https://gasify.app/icon.png']
};
