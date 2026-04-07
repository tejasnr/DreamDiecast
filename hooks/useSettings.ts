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
  };
}
