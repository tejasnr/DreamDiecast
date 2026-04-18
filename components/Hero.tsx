'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';

export default function Hero() {
  const router = useRouter();
  const settings = useSettings();

  const handleGarageClick = () => {
    router.push('/products');
  };

  const handlePreOrdersClick = () => {
    router.push('/pre-orders');
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-32 pb-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/gt3rs.webp"
          alt="Porsche 911 GT3 RS"
          fill
          sizes="100vw"
          className="object-contain opacity-90 object-right-bottom scale-[0.85] translate-x-[5%] -translate-y-[3%]"
          priority
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-xl md:max-w-2xl"
        >
          <div className="flex items-center space-x-3 mb-4">
            <span className="w-12 h-[2px] bg-accent" />
            <span className="text-accent font-mono text-sm tracking-[0.3em] uppercase">
              Precision Engineered 1:64
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-8xl font-display font-bold leading-[0.95] md:leading-[0.9] uppercase mb-6 md:mb-8">
            Your Dream <br />
            Garage <br />
            <span className="text-gradient italic inline-block pr-4">Scaled Down.</span>
          </h1>
          <p className="text-white/60 text-base md:text-lg mb-8 md:mb-10 max-w-md leading-relaxed border-l-2 border-accent/30 pl-6">
            Premium 1:64 scale diecast models for serious collectors. Browse our latest drops and pre-orders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start sm:items-center pb-10">
            <button
              onClick={handleGarageClick}
              className="w-full sm:w-auto bg-white text-black px-8 py-4 font-display font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-all duration-300 glow-orange"
            >
              Enter the Garage
            </button>
            <button
              onClick={handlePreOrdersClick}
              className="w-full sm:w-auto border border-white/20 hover:border-white px-8 py-4 font-display font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-sm"
            >
              View Pre-Orders
            </button>
          </div>
      </motion.div>
    </div>

    </section>
  );
}
