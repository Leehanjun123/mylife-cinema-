/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://lifecinema.site',
  generateRobotsFile: true,
  sitemapSize: 7000,
  outDir: './public',
  exclude: ['/api/*', '/admin/*', '/dashboard', '/auth/*'],
  
  additionalPaths: async (config) => [
    {
      loc: '/pricing',
      changefreq: 'weekly',
      priority: 0.9,
      lastmod: new Date().toISOString(),
    },
    {
      loc: '/community',
      changefreq: 'daily',
      priority: 0.8,
      lastmod: new Date().toISOString(),
    },
    {
      loc: '/terms',
      changefreq: 'monthly',
      priority: 0.5,
      lastmod: new Date().toISOString(),
    },
    {
      loc: '/privacy',
      changefreq: 'monthly',
      priority: 0.5,
      lastmod: new Date().toISOString(),
    }
  ],
  
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard', '/auth/']
      }
    ]
  },
  
  transform: async (config, path) => {
    // 기본 설정
    const defaultConfig = {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }

    // 홈페이지 우선순위 높이기
    if (path === '/') {
      return {
        ...defaultConfig,
        priority: 1.0,
        changefreq: 'daily'
      }
    }

    // 중요 페이지들 우선순위 설정
    const importantPages = ['/pricing', '/community', '/create-movie']
    if (importantPages.some(page => path.includes(page))) {
      return {
        ...defaultConfig,
        priority: 0.8,
        changefreq: 'weekly'
      }
    }

    return defaultConfig
  }
}