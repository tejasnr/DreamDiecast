'use client';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';

export default function CategoryGrid() {
  const settings = useSettings();

  const categories = [
    {
      name: 'The Vault',
      image: settings?.categoryHypercars || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=600&auto=format&fit=crop',
      count: 'Pre-Orders',
      href: '/pre-orders'
    },
    {
      name: 'Ready to Ship',
      image: settings?.categoryJdm || 'https://images.unsplash.com/photo-1532330393533-443990a51d10?q=80&w=600&auto=format&fit=crop',
      count: 'In Stock',
      href: '/current-stock'
    },
    {
      name: 'Collector Sets',
      image: settings?.categoryEuropean || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop',
      count: 'Bundles',
      href: '/bundles'
    },
  ];

  return (
    <section className="py-24 carbon-pattern border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <Link key={cat.name} href={cat.href}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group relative aspect-[3/4] overflow-hidden rounded-sm cursor-pointer border border-white/5"
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110 opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                  <span className="text-accent font-mono text-[10px] uppercase tracking-[0.4em] mb-2 opacity-100 md:opacity-0 translate-y-0 md:translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                    {cat.count}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tighter group-hover:text-accent transition-colors">
                    {cat.name}
                  </h3>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
