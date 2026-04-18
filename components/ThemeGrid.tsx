'use client';

import { motion } from 'motion/react';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import { CSSProperties } from 'react';

import blueGtr from '@/app/assets/blue-gtr.webp';
import pagani from '@/app/assets/pagani.webp';
import fordGt40 from '@/app/assets/ford.webp';

interface Theme {
  name: string;
  slug: string;
  accentColor: string;
  tagline: string;
  image: StaticImageData;
  imageClassName?: string;
}

const THEMES: Theme[] = [
  {
    name: 'JDM Legends',
    slug: 'jdm-legends',
    accentColor: '#00BFFF',
    tagline: 'Skylines \u00b7 Supras \u00b7 NSXs',
    image: blueGtr,
    imageClassName: 'object-contain',
  },
  {
    name: 'Exotics & Hypercars',
    slug: 'exotics-hypercars',
    accentColor: '#8B0000',
    tagline: 'Lamborghini \u00b7 Ferrari \u00b7 Bugatti',
    image: pagani,
  },
  {
    name: 'Motorsport / Track Day',
    slug: 'motorsport-track-day',
    accentColor: '#FF2020',
    tagline: 'Le Mans \u00b7 F1 \u00b7 DTM',
    image: fordGt40,
    imageClassName: 'object-contain',
  },
];

export default function ThemeGrid() {
  return (
    <section className="py-24 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col gap-3 mb-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-white/30" />
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/50">
              Shop by Theme
            </span>
          </div>
          <p className="text-white/40 text-xs uppercase tracking-widest">
            Find your style of collectible
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {THEMES.map((theme, index) => (
            <Link key={theme.slug} href={`/themes/${theme.slug}`} className="block">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.6 }}
                viewport={{ once: true }}
                style={{ '--theme-accent': theme.accentColor } as CSSProperties}
                className="group relative overflow-hidden border border-white/10 bg-[#0a0a0a] transition-all duration-700 hover:border-[color:var(--theme-accent)]/40 aspect-[4/3] shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_40px_var(--theme-accent)]"
              >
                <Image
                  src={theme.image}
                  alt={theme.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700 ${theme.imageClassName ?? 'object-cover'}`}
                  placeholder="blur"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-end p-5 gap-2">
                  <span className="font-display uppercase tracking-tighter text-xl text-white">
                    {theme.name}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-white/60">
                    {theme.tagline}
                  </span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
