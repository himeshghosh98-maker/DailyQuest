/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/quests',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
