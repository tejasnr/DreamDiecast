import type { Metadata } from 'next';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import ProductDetailClient from './ProductDetailClient';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type Props = {
  params: Promise<{ slug: string }>;
};

async function getProduct(slug: string) {
  try {
    return await convex.query(api.products.getBySlug, { slug });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const title = `${product.name} ${product.scale} by ${product.brand}`;
  const description = product.description
    || `Buy ${product.name} ${product.scale} scale diecast model by ${product.brand} at DreamDiecast India. ${product.condition ? `Condition: ${product.condition}.` : ''} Price: ₹${product.price.toLocaleString()}.`;

  return {
    title,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: `${title} | DreamDiecast`,
      description,
      type: 'website',
      images: product.image ? [{ url: product.image, alt: product.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | DreamDiecast`,
      description,
      images: product.image ? [product.image] : undefined,
    },
  };
}

function ProductJsonLd({ product, slug }: { product: NonNullable<Awaited<ReturnType<typeof getProduct>>>; slug: string }) {
  const isPreOrder = product.listingType === 'pre-order' || product.category === 'Pre-Order' || product.isPreorder;
  const availability = isPreOrder
    ? 'https://schema.org/PreOrder'
    : product.stock !== undefined && product.stock <= 0
      ? 'https://schema.org/OutOfStock'
      : 'https://schema.org/InStock';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description:
      product.description ||
      `${product.name} ${product.scale} scale diecast model by ${product.brand}`,
    image: product.images?.length ? product.images : product.image ? [product.image] : undefined,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    sku: product.sku || product._id,
    offers: {
      '@type': 'Offer',
      url: `https://dreamdiecast.in/products/${slug}`,
      priceCurrency: 'INR',
      price: product.price,
      availability,
      seller: {
        '@type': 'Organization',
        name: 'DreamDiecast',
      },
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Scale', value: product.scale },
      ...(product.condition
        ? [{ '@type': 'PropertyValue', name: 'Condition', value: product.condition }]
        : []),
    ],
  };

  if (product.rating && product.reviews?.length) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews.length,
    };
    schema.review = product.reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.user },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating },
      reviewBody: r.comment,
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function BreadcrumbJsonLd({ product, slug }: { product: NonNullable<Awaited<ReturnType<typeof getProduct>>>; slug: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dreamdiecast.in' },
      { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://dreamdiecast.in/products' },
      { '@type': 'ListItem', position: 3, name: product.brand, item: `https://dreamdiecast.in/brands/${product.brand.toLowerCase().replace(/\s+/g, '')}` },
      { '@type': 'ListItem', position: 4, name: product.name },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  return (
    <>
      {product && (
        <>
          <ProductJsonLd product={product} slug={slug} />
          <BreadcrumbJsonLd product={product} slug={slug} />
        </>
      )}
      <ProductDetailClient slug={slug} initialProduct={product ?? undefined} />
    </>
  );
}
