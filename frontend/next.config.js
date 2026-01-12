/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: '../registry/api/web/static',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: '',
  assetPrefix: '',
}

module.exports = nextConfig
