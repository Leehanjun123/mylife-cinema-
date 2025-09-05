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
    const loadAd = () => {
      try {
        // Only load ads in production and if AdSense is available
        if (process.env.NODE_ENV === 'production' && 
            typeof window !== 'undefined' && 
            window.adsbygoogle &&
            adSlot && 
            adSlot !== 'placeholder') {
          
          // Add delay to ensure DOM is ready
          setTimeout(() => {
            try {
              (window.adsbygoogle = window.adsbygoogle || []).push({})
            } catch (pushError) {
              console.warn('AdSense push error:', pushError)
            }
          }, 100)
        }
      } catch (error) {
        console.warn('AdSense initialization error:', error)
      }
    }

    loadAd()
  }, [adSlot])

  // Don't render ads in development
  if (process.env.NODE_ENV !== 'production' || !adSlot || adSlot === 'placeholder') {
    return (
      <div 
        className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-sm ${className || ''}`}
        style={{ minHeight: '90px', ...style }}
      >
        AdSense (개발 모드)
      </div>
    )
  }

  return (
    <ins
      className={`adsbygoogle ${className || ''}`}
      style={{ display: 'block', ...style }}
      data-ad-client="ca-pub-1752582087901677"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
      data-adtest={process.env.NODE_ENV !== 'production' ? 'on' : 'off'}
    />
  )
}

// AdSense script loader component
export function AdSenseScript() {
  useEffect(() => {
    // Only load AdSense in production
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    if (typeof window !== 'undefined' && !document.querySelector('script[src*="adsbygoogle.js"]')) {
      try {
        const script = document.createElement('script')
        script.async = true
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1752582087901677`
        script.crossOrigin = 'anonymous'
        
        // Add error handling for script loading
        script.onerror = (error) => {
          console.warn('AdSense script failed to load:', error)
        }
        
        script.onload = () => {
          console.log('AdSense script loaded successfully')
          // Initialize adsbygoogle array after script loads
          window.adsbygoogle = window.adsbygoogle || []
        }
        
        document.head.appendChild(script)
      } catch (error) {
        console.warn('Error loading AdSense script:', error)
      }
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