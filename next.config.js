/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Temporarily disable eslint during builds
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig 