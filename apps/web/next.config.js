/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@fio/shared'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

module.exports = nextConfig;
