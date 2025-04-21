/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['127.0.0.1'], // Add your PocketBase server hostname here
  },
}

module.exports = nextConfig