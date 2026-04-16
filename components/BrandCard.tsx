'use client';

import { motion } from 'motion/react';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Brand } from '@/lib/brands';
import { CSSProperties } from 'react';

interface BrandCardProps {
  brand: Brand;
  count?: number;
  href?: string;
  variant?: 'landing' | 'compact';
  index?: number;
}

function formatCount(count?: number) {
  if (count === undefined) return '— Models';
  if (count === 1) return '1 Model';
  return `${count} Models`;
}

export default function BrandCard({
  brand,
  count,
  href,
  variant = 'landing',
  index = 0,
}: BrandCardProps) {
  const cardHref = href ?? `/brands/${brand.slug}`;
  const style = { '--brand-accent': brand.accentColor } as CSSProperties;
  const isCompact = variant === 'compact';

  return (
    <Link href={cardHref} className="block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.6 }}
        viewport={{ once: true }}
        style={style}
        className={`group relative overflow-hidden border border-white/10 bg-[#0a0a0a] transition-all duration-700 hover:border-[color:var(--brand-accent)]/40 ${isCompact ? 'aspect-[4/3]' : 'aspect-[3/4]'} shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_40px_var(--brand-accent)]`}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 carbon-pattern opacity-30" />

        {/* Brand Logo */}
        <div className={`absolute inset-0 flex items-center justify-center ${isCompact ? 'pb-14' : 'pb-20'}`}>
          <img
            src={brand.logo}
            alt={`${brand.name} logo`}
            width={isCompact ? 100 : 140}
            height={isCompact ? 60 : 80}
            className={`object-contain opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110 ${brand.invertLogo ? 'invert brightness-200' : ''}`}
          />
        </div>

        {!isCompact && (
          <div className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-[0.3em] px-3 py-2 bg-white/5 border border-white/10 text-[color:var(--brand-accent)]">
            {formatCount(count)}
          </div>
        )}

        <div className={`absolute inset-0 flex flex-col justify-end ${isCompact ? 'p-5' : 'p-7'} gap-2`}>
          <span className={`font-display uppercase tracking-tighter ${isCompact ? 'text-xl' : 'text-2xl md:text-3xl'} text-white`}>{brand.name}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-white/60">
            {brand.tagline}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
