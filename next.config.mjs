/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ketcher packages ship modern ESM that needs transpilation under Next 14.
  transpilePackages: ["ketcher-react", "ketcher-core", "ketcher-standalone"],
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    // Indigo WASM from ketcher-standalone
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });
    // paper.js (via ketcher-core) probes Node canvas/jsdom; stub for browser build
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      jsdom: false,
      "jsdom/lib/jsdom/living/generated/utils": false,
      "source-map-support": false,
      "paper/dist/node/self.js": false,
      "paper/dist/node/extend.js": false,
      "paper/dist/node/canvas.js": false,
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      canvas: false,
      jsdom: false,
      net: false,
      tls: false,
      child_process: false,
    };
    return config;
  },
};

export default nextConfig;
