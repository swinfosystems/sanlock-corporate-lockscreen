/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/corporate-lockscreen-admin' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/corporate-lockscreen-admin' : '',
}

module.exports = nextConfig
