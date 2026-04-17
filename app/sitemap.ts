import type { MetadataRoute } from 'next';
import { BRANDS } from '@/lib/brands';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { productSlug } from '@/lib/slugify';

const BASE_URL = 'https://dreamdiecast.in';
const THEME_SLUGS = ['jdm-legends', 'exotics-hypercars', 'motorsport-track-day'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/products`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/brands`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/new-arrivals`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/pre-orders`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/bundles`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/shipping-policy`, changeFrequency: 'monthly', priority: 0.2 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'monthly', priority: 0.2 },
    { url: `${BASE_URL}/returns`, changeFrequency: 'monthly', priority: 0.2 },
  ];

  const brandPages: MetadataRoute.Sitemap = BRANDS.map((brand) => ({
    url: `${BASE_URL}/brands/${brand.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const themePages: MetadataRoute.Sitemap = THEME_SLUGS.map((slug) => ({
    url: `${BASE_URL}/themes/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Fetch all products for individual product page URLs
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const products = await convex.query(api.products.list, {});
    productPages = products
      .filter((p) => p.status !== 'unlisted')
      .map((p) => ({
        url: `${BASE_URL}/products/${productSlug(p)}`,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
  } catch {
    // Sitemap still works without product URLs if Convex is unavailable
  }

  return [...staticPages, ...brandPages, ...themePages, ...productPages];
}
