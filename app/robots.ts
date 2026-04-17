import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/checkout', '/garage', '/pay', '/order-success'],
      },
    ],
    sitemap: 'https://dreamdiecast.in/sitemap.xml',
  };
}
