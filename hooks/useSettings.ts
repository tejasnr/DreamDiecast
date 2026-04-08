'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export interface WebsiteSettings {
  heroBackground: string;
  vaultImage: string;
  footerBackground: string;
  categoryJdm: string;
  categoryEuropean: string;
  categoryHypercars: string;
  brandHotwheels: string;
  brandBburago: string;
  brandMinigt: string;
  brandPoprace: string;
  brandPostercars: string;
  brandMatchbox: string;
}

export function useSettings(): WebsiteSettings | null {
  const data = useQuery(api.settings.getWebsite);
  if (!data) return null;
  return {
    heroBackground: data.heroBackground ?? '',
    vaultImage: data.vaultImage ?? '',
    footerBackground: data.footerBackground ?? '',
    categoryJdm: data.categoryJdm ?? '',
    categoryEuropean: data.categoryEuropean ?? '',
    categoryHypercars: data.categoryHypercars ?? '',
    brandHotwheels: data.brandHotwheels ?? '',
    brandBburago: data.brandBburago ?? '',
    brandMinigt: data.brandMinigt ?? '',
    brandPoprace: data.brandPoprace ?? '',
    brandPostercars: data.brandPostercars ?? '',
    brandMatchbox: data.brandMatchbox ?? '',
  };
}
