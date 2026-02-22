/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'birclqnuxghihsievxtb.supabase.co',
        pathname: '/storage/v1/object/public/Images/UserAvatars/**',
      },
    ],
  },
};

module.exports = nextConfig;