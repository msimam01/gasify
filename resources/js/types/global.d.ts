// Global type declarations for the application

declare global {
  interface Window {
    route: (name: string, params?: Record<string, any>, absolute?: boolean) => string;
  }
}

export {};
