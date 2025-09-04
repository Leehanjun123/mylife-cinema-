import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  
  // 기존 설정 유지 (개발 중이므로)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      'picsum.photos',
      'sample-videos.com',
      'storage.lifecinema.site',
      'supabase.co',
      'hsvdyccqsrkdswkkvftf.supabase.co'
    ],
  },

  // 실험적 기능
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
    webVitalsAttribution: ['CLS', 'LCP'],
  },

  // 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // 정적 자산 캐싱
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // 리다이렉트
  async redirects() {
    return [
      {
        source: '/create',
        destination: '/create-movie',
        permanent: true,
      },
      {
        source: '/movies',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
}

export default nextConfig;