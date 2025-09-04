'use client'

import { useEffect } from 'react'

interface AdSenseProps {
  adSlot: string
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'
  style?: React.CSSProperties
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export function AdSense({ adSlot, adFormat = 'auto', style, className }: AdSenseProps) {
  useEffect(() => {
    try {
      // Push ad to adsbygoogle array
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({})
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [])

  return (
    <ins
      className={`adsbygoogle ${className || ''}`}
      style={{ display: 'block', ...style }}
      data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || "ca-pub-1234567890123456"}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
    />
  )
}

// AdSense script loader component
export function AdSenseScript() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.querySelector('[data-ad-client]')) {
      const script = document.createElement('script')
      script.async = true
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || 'ca-pub-1234567890123456'}`
      script.crossOrigin = 'anonymous'
      document.head.appendChild(script)

      // Initialize adsbygoogle array
      window.adsbygoogle = window.adsbygoogle || []
    }
  }, [])

  return null
}

// Specialized ad components for different contexts
export function BannerAd({ className }: { className?: string }) {
  return (
    <div className={`w-full flex justify-center my-8 ${className || ''}`}>
      <AdSense
        adSlot="1234567890"
        adFormat="auto"
        style={{ width: '100%', maxWidth: '728px', height: '90px' }}
        className="border border-gray-200 rounded-lg bg-gray-50"
      />
    </div>
  )
}

export function SidebarAd({ className }: { className?: string }) {
  return (
    <div className={`sticky top-4 ${className || ''}`}>
      <div className="text-xs text-gray-500 mb-2 text-center">광고</div>
      <AdSense
        adSlot="0987654321"
        adFormat="vertical"
        style={{ width: '300px', height: '600px' }}
        className="border border-gray-200 rounded-lg bg-gray-50"
      />
    </div>
  )
}

export function InlineAd({ className }: { className?: string }) {
  return (
    <div className={`w-full my-6 ${className || ''}`}>
      <div className="text-xs text-gray-500 mb-2 text-center">스폰서 콘텐츠</div>
      <AdSense
        adSlot="1357924680"
        adFormat="fluid"
        style={{ width: '100%', minHeight: '250px' }}
        className="border border-gray-200 rounded-lg bg-gray-50"
      />
    </div>
  )
}

// Native ad component for movie recommendations
export function NativeMovieAd({ className }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">추천 콘텐츠</h3>
        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">AD</span>
      </div>
      <AdSense
        adSlot="2468135790"
        adFormat="fluid"
        style={{ width: '100%', minHeight: '200px' }}
      />
    </div>
  )
}

export default AdSense