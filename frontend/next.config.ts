/** @type {import('next').NextConfig} */
const nextConfig = {
  // This function sets up the proxy
  async rewrites() {
    return [
      {
        // This will match all requests to /api/...
        source: '/api/:path*',
        // And forward them to your backend
        destination: 'https://slidegenius-production.up.railway.app/api/:path*',
      },
    ];
  },
};

export default nextConfig;
