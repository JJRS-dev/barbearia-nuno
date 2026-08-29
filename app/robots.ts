import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://nunex-cortes.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/barbeiro'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
