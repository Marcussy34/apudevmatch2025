/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    loader: 'custom',
    loaderFile: './lib/imageLoader.js',
  },
  async rewrites() {
    const target = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Ignore WASM modules that cause issues
    config.module.rules.push({
      test: /\.wasm$/,
      use: "ignore-loader",
    });

    // Add ignore-loader for problematic imports
    config.module.rules.push({
      test: /walrus_wasm_bg\.wasm$/,
      use: "ignore-loader",
    });

    // Configure externals for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
