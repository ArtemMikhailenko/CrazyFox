/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: { resolve: { fallback: any; alias: any; }; }, { isServer }: any) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        buffer: false,
      };
    }
    
    // Исправление для Magic SDK
    config.resolve.alias = {
      ...config.resolve.alias,
      'magic-sdk/dist/es/core': 'magic-sdk/dist/cjs/core.js',
      
    };
    
    return config;
  },

};

module.exports = nextConfig;