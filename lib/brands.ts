export interface Brand {
  name: string;
  slug: string;
  accentColor: string;
  logo: string;
  description: string;
  tagline: string;
  invertLogo?: boolean;
}

export const BRANDS: Brand[] = [
  {
    name: 'Hot Wheels',
    slug: 'hotwheels',
    accentColor: '#ED1C24',
    logo: '/assets/hotwheels.png',
    description: "The world's most iconic diecast brand.",
    tagline: 'Since 1968',
  },
  {
    name: 'Bburago',
    slug: 'bburago',
    accentColor: '#0057B8',
    logo: '/assets/burago.png',
    description: 'Italian craftsmanship in miniature.',
    tagline: 'Precision Models',
  },
  {
    name: 'Mini GT',
    slug: 'minigt',
    accentColor: '#00C853',
    logo: '/assets/mini-gt.png',
    description: "TSM's premium 1:64 scale line.",
    tagline: 'True Scale Miniatures',
  },
  {
    name: 'Pop Race',
    slug: 'poprace',
    accentColor: '#FF6D00',
    logo: '/assets/poprace.png',
    description: 'Limited edition Hong Kong exclusives.',
    tagline: 'Limited Runs',
  },
  {
    name: 'Tarmac Works',
    slug: 'tarmacworks',
    accentColor: '#C0C0C0',
    logo: '/assets/tarmac-works.png',
    description: 'High-detail motorsport-inspired diecast.',
    tagline: 'Track Legends',
    invertLogo: true,
  },
  {
    name: 'Matchbox',
    slug: 'matchbox',
    accentColor: '#FFD600',
    logo: '/assets/matchbox.png',
    description: 'The original pocket-sized collectible.',
    tagline: 'Since 1953',
  },
];

export function getBrandBySlug(slug: string): Brand | undefined {
  return BRANDS.find((brand) => brand.slug === slug);
}

export function getBrandNameFromSlug(slug: string): string {
  return getBrandBySlug(slug)?.name ?? slug;
}

export const BRAND_IMAGE_KEYS: Record<string, string> = {
  hotwheels: 'brandHotwheels',
  bburago: 'brandBburago',
  minigt: 'brandMinigt',
  poprace: 'brandPoprace',
  tarmacworks: 'brandTarmacworks',
  matchbox: 'brandMatchbox',
};
