export const SITE_URL = 'https://dreamdiecast.in';
export const SITE_NAME = 'DreamDiecast';
export const DEFAULT_OG_IMAGE = '/og-image.png';

export const BRAND_SEO: Record<string, { title: string; description: string; keywords: string[]; intro: string; relatedThemes: string[] }> = {
  hotwheels: {
    title: 'Hot Wheels Diecast Cars',
    description:
      'Shop Hot Wheels diecast models in India. Premium 1:64 scale collectibles, limited editions, and exclusive releases at DreamDiecast.',
    keywords: ['Hot Wheels India', 'Hot Wheels diecast', 'Hot Wheels collectibles', 'buy Hot Wheels online'],
    intro: 'Hot Wheels, created by Mattel in 1968, is the world\'s best-selling diecast brand with over 6 billion cars produced. Known for their bold designs, custom paint jobs, and iconic orange track, Hot Wheels spans everything from realistic replicas to wild fantasy castings. At DreamDiecast, we stock the latest mainline releases, premium series like Car Culture and Boulevard, and exclusive limited editions. Whether you\'re a long-time collector or just starting out, Hot Wheels offers something for every enthusiast.',
    relatedThemes: ['jdm-legends', 'exotics-hypercars', 'motorsport-track-day'],
  },
  bburago: {
    title: 'Bburago Diecast Models',
    description:
      'Italian-crafted Bburago diecast models. Premium scale replicas of Ferrari, Lamborghini, and more. Shop at DreamDiecast India.',
    keywords: ['Bburago India', 'Bburago diecast', 'Bburago Ferrari', 'Bburago Lamborghini'],
    intro: 'Founded in Burago di Molgora, Italy in 1974, Bburago is renowned for crafting highly detailed scale replicas of the world\'s most iconic supercars. As an official Ferrari licensee, Bburago produces stunning 1:18, 1:24, and 1:43 scale models of Ferrari, Lamborghini, Porsche, and more. Their Signature Series and Race & Play lines offer museum-quality detail at accessible prices. DreamDiecast carries the full Bburago range for collectors who appreciate Italian craftsmanship and automotive excellence.',
    relatedThemes: ['exotics-hypercars', 'motorsport-track-day'],
  },
  minigt: {
    title: 'Mini GT Diecast Cars',
    description:
      'True Scale Miniatures Mini GT collection. High-detail 1:64 scale diecast models of supercars and JDM legends at DreamDiecast.',
    keywords: ['Mini GT India', 'Mini GT diecast', 'TSM Mini GT', '1:64 Mini GT'],
    intro: 'Mini GT, by True Scale Miniatures (TSM), has redefined what\'s possible in 1:64 scale diecast. Launched in 2018, Mini GT delivers exceptional detail — opening parts, realistic interiors, and authentic paint — at a scale and price point that has taken the collecting world by storm. Their lineup covers everything from JDM legends like the Nissan GT-R and Honda NSX to modern exotics like the Bugatti Chiron. DreamDiecast offers the latest Mini GT releases and chase variants for discerning collectors.',
    relatedThemes: ['jdm-legends', 'exotics-hypercars'],
  },
  poprace: {
    title: 'Pop Race Limited Edition Diecast',
    description:
      'Exclusive Pop Race limited edition diecast models. Hong Kong-based premium collectibles available at DreamDiecast India.',
    keywords: ['Pop Race diecast', 'Pop Race India', 'Pop Race limited edition'],
    intro: 'Pop Race is a Hong Kong-based brand that has carved out a niche for bold, limited-edition 1:64 scale diecast models. Known for their striking liveries, collaboration releases, and collector-focused approach, Pop Race models are highly sought after in the global diecast community. Each release is produced in limited quantities, making them true collectibles. DreamDiecast brings these exclusive models to Indian collectors with authentic sourcing and secure shipping.',
    relatedThemes: ['jdm-legends', 'exotics-hypercars'],
  },
  tarmacworks: {
    title: 'Tarmac Works Diecast Cars',
    description:
      'Tarmac Works motorsport-inspired diecast. High-detail racing livery models and track legends at DreamDiecast India.',
    keywords: ['Tarmac Works India', 'Tarmac Works diecast', 'Tarmac Works racing'],
    intro: 'Tarmac Works specializes in motorsport-inspired 1:64 scale diecast models that capture the spirit of racing. Founded in Hong Kong, they\'re celebrated for their authentic racing liveries, collaboration pieces with real racing teams, and exceptional attention to detail. From WRC rally cars to Le Mans prototypes and GT3 race cars, Tarmac Works brings the thrill of the track to your display shelf. DreamDiecast stocks their latest releases, including exclusive track-day and collaboration editions.',
    relatedThemes: ['motorsport-track-day', 'jdm-legends'],
  },
  matchbox: {
    title: 'Matchbox Diecast Cars',
    description:
      'Classic Matchbox diecast collectibles. The original pocket-sized scale models since 1953. Shop at DreamDiecast India.',
    keywords: ['Matchbox India', 'Matchbox diecast', 'Matchbox collectibles', 'vintage Matchbox'],
    intro: 'Matchbox, the brand that started it all in 1953, holds a special place in diecast history. Created by Lesney Products in London, Matchbox pioneered the pocket-sized diecast car and has been a collector favourite for over 70 years. Today\'s Matchbox combines nostalgic charm with modern sustainability initiatives, producing eco-friendly models alongside classic replicas. At DreamDiecast, we carry the latest Matchbox releases including their Moving Parts and Collectors series for both new and veteran collectors.',
    relatedThemes: ['jdm-legends'],
  },
};

export const THEME_SEO: Record<string, { title: string; description: string; keywords: string[]; relatedBrands: string[] }> = {
  'jdm-legends': {
    title: 'JDM Legends Diecast Collection',
    description:
      'Japanese Domestic Market legends in miniature. Nissan Skyline GT-R, Toyota Supra, Honda NSX diecast models at DreamDiecast.',
    keywords: ['JDM diecast', 'Skyline GT-R diecast', 'Toyota Supra diecast', 'Honda NSX model'],
    relatedBrands: ['hotwheels', 'minigt', 'tarmacworks', 'poprace'],
  },
  'exotics-hypercars': {
    title: 'Exotic & Hypercar Diecast Models',
    description:
      "Lamborghini, Ferrari, Bugatti and more. Premium diecast replicas of the world's most exotic supercars at DreamDiecast.",
    keywords: ['supercar diecast', 'Lamborghini diecast', 'Ferrari model car', 'hypercar collectibles'],
    relatedBrands: ['bburago', 'minigt', 'poprace', 'hotwheels'],
  },
  'motorsport-track-day': {
    title: 'Motorsport & Track Day Diecast',
    description:
      'Le Mans, F1, DTM racing diecast models. Authentic motorsport liveries and track-ready replicas at DreamDiecast India.',
    keywords: ['racing diecast', 'F1 model cars', 'Le Mans diecast', 'motorsport collectibles'],
    relatedBrands: ['tarmacworks', 'bburago', 'hotwheels', 'minigt'],
  },
};
