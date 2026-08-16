/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin requests for dev server in local network
  async headers() {
    return [
      {
        source: "/_next/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
