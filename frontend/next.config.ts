/** @type {import('next').NextConfig} */
const nextConfig = {
  // This function sets up the proxy
  async rewrites() {
    // In development, we proxy to the local backend.
    // In production, this rewrite rule is not needed as the API is on the same domain or configured via NEXT_PUBLIC_API_URL.
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          // This will match all requests to /api/...
          source: '/api/:path*',
          // And forward them to your local backend
          destination: 'http://127.0.0.1:8000/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
