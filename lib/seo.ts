export const SITE_URL = 'https://dreamdiecast.in';
export const SITE_NAME = 'DreamDiecast';
export const DEFAULT_OG_IMAGE = '/og-image.png';

export const BRAND_SEO: Record<string, { title: string; description: string; keywords: string[] }> = {
  hotwheels: {
    title: 'Hot Wheels Diecast Cars',
    description:
      'Shop Hot Wheels diecast models in India. Premium 1:64 scale collectibles, limited editions, and exclusive releases at DreamDiecast.',
    keywords: ['Hot Wheels India', 'Hot Wheels diecast', 'Hot Wheels collectibles', 'buy Hot Wheels online'],
  },
  bburago: {
    title: 'Bburago Diecast Models',
    description:
      'Italian-crafted Bburago diecast models. Premium scale replicas of Ferrari, Lamborghini, and more. Shop at DreamDiecast India.',
    keywords: ['Bburago India', 'Bburago diecast', 'Bburago Ferrari', 'Bburago Lamborghini'],
  },
  minigt: {
    title: 'Mini GT Diecast Cars',
    description:
      'True Scale Miniatures Mini GT collection. High-detail 1:64 scale diecast models of supercars and JDM legends at DreamDiecast.',
    keywords: ['Mini GT India', 'Mini GT diecast', 'TSM Mini GT', '1:64 Mini GT'],
  },
  poprace: {
    title: 'Pop Race Limited Edition Diecast',
    description:
      'Exclusive Pop Race limited edition diecast models. Hong Kong-based premium collectibles available at DreamDiecast India.',
    keywords: ['Pop Race diecast', 'Pop Race India', 'Pop Race limited edition'],
  },
  tarmacworks: {
    title: 'Tarmac Works Diecast Cars',
    description:
      'Tarmac Works motorsport-inspired diecast. High-detail racing livery models and track legends at DreamDiecast India.',
    keywords: ['Tarmac Works India', 'Tarmac Works diecast', 'Tarmac Works racing'],
  },
  matchbox: {
    title: 'Matchbox Diecast Cars',
    description:
      'Classic Matchbox diecast collectibles. The original pocket-sized scale models since 1953. Shop at DreamDiecast India.',
    keywords: ['Matchbox India', 'Matchbox diecast', 'Matchbox collectibles', 'vintage Matchbox'],
  },
};

export const THEME_SEO: Record<string, { title: string; description: string; keywords: string[] }> = {
  'jdm-legends': {
    title: 'JDM Legends Diecast Collection',
    description:
      'Japanese Domestic Market legends in miniature. Nissan Skyline GT-R, Toyota Supra, Honda NSX diecast models at DreamDiecast.',
    keywords: ['JDM diecast', 'Skyline GT-R diecast', 'Toyota Supra diecast', 'Honda NSX model'],
  },
  'exotics-hypercars': {
    title: 'Exotic & Hypercar Diecast Models',
    description:
      "Lamborghini, Ferrari, Bugatti and more. Premium diecast replicas of the world's most exotic supercars at DreamDiecast.",
    keywords: ['supercar diecast', 'Lamborghini diecast', 'Ferrari model car', 'hypercar collectibles'],
  },
  'motorsport-track-day': {
    title: 'Motorsport & Track Day Diecast',
    description:
      'Le Mans, F1, DTM racing diecast models. Authentic motorsport liveries and track-ready replicas at DreamDiecast India.',
    keywords: ['racing diecast', 'F1 model cars', 'Le Mans diecast', 'motorsport collectibles'],
  },
};
