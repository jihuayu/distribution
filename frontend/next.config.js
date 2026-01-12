/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: '../registry/api/web/static',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

export default nextConfig
