import Script from 'next/script'

export function GoogleAnalytics() {
  if (!process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  )
}

// Custom event tracking functions
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters)
  }
}

export const trackMovieCreation = (genre: string, duration: number) => {
  trackEvent('movie_created', {
    genre,
    duration_seconds: duration,
    event_category: 'engagement',
  })
}

export const trackSignup = (method: string) => {
  trackEvent('sign_up', {
    method,
    event_category: 'auth',
  })
}

export const trackSubscription = (tier: string, price: number) => {
  trackEvent('purchase', {
    currency: 'KRW',
    value: price,
    items: [{
      item_id: tier,
      item_name: `${tier} subscription`,
      item_category: 'subscription',
      price: price,
      quantity: 1,
    }]
  })
}

// Extend window type for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}