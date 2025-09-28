declare module 'ziggy-js' {
  interface Config {
    url: string;
    port: number;
    defaults: Record<string, any>;
    routes: Record<string, any>;
  }

  interface RouteFunction {
    (name?: string, params?: any, absolute?: boolean, config?: Config): string;
    configure(config: Config): void;
  }

  export const route: RouteFunction;
}

declare module './ziggy' {
  export const Ziggy: {
    url: string;
    port: number;
    defaults: Record<string, any>;
    routes: Record<string, any>;
  };
}

declare global {
  interface Window {
    Ziggy: {
      url: string;
      port: number;
      defaults: Record<string, any>;
      routes: Record<string, any>;
    };
  }
}