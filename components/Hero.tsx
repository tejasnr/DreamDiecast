'use client';

import { motion, useAnimation, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';
import { useSettings } from '@/hooks/useSettings';

interface SmokeParticle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  rotation: number;
}

export default function Hero() {
  const controls = useAnimation();
  const router = useRouter();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [smokeParticles, setSmokeParticles] = useState<SmokeParticle[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const settings = useSettings();

  const handleGarageClick = () => {
    if (user) {
      router.push('/garage');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handlePreOrdersClick = () => {
    if (user) {
      router.push('/garage?filter=pre-order');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const spawnSmoke = useCallback((x: number, y: number) => {
    const id = Date.now() + Math.random();
    const newParticle: SmokeParticle = {
      id,
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      targetX: (Math.random() - 0.5) * 100,
      targetY: -100 - Math.random() * 50,
      size: Math.random() * 40 + 20,
      rotation: Math.random() * 360,
    };
    setSmokeParticles(prev => [...prev.slice(-20), newParticle]);

    setTimeout(() => {
      setSmokeParticles(prev => prev.filter(p => p.id !== id));
    }, 1000);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRolling) {
      interval = setInterval(() => {
        const wheelElement = document.getElementById('admin-wheel');
        if (wheelElement) {
          const rect = wheelElement.getBoundingClientRect();
          spawnSmoke(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isRolling, spawnSmoke]);

  const handleAdminClick = async () => {
    if (!user || user.role !== 'admin') {
      // Non-admin or not logged in: just do the animation but don't open admin
      if (!user) {
        setIsAuthModalOpen(true);
        return;
      }
      return;
    }

    setIsRolling(true);

    const wheelElement = document.getElementById('admin-wheel');
    let moveX = 400;

    if (wheelElement) {
      const rect = wheelElement.getBoundingClientRect();
      const wheelWidth = rect.width;
      const targetRight = window.innerWidth - 40;
      moveX = targetRight - rect.left - wheelWidth;
    }

    await controls.start({
      rotate: 1080,
      x: moveX,
      transition: { duration: 1.2, ease: "easeInOut" }
    });

    setIsRolling(false);
    await controls.start({
      y: [0, -30, 0],
      transition: { duration: 0.4, times: [0, 0.5, 1] }
    });

    router.push('/admin');
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-32 pb-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={settings?.heroBackground || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?q=80&w=1920&auto=format&fit=crop"}
          alt="Hero Background"
          fill
          className="object-cover opacity-40"
          priority
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="flex items-center space-x-3 mb-4">
            <span className="w-12 h-[2px] bg-accent" />
            <span className="text-accent font-mono text-sm tracking-[0.3em] uppercase">
              Precision Engineered 1:64
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-8xl font-display font-bold leading-[0.95] md:leading-[0.9] uppercase mb-6 md:mb-8">
            The Ultimate <br />
            <span className="text-gradient italic">Diecast Vault.</span>
          </h1>
          <p className="text-white/60 text-base md:text-lg mb-8 md:mb-10 max-w-md leading-relaxed border-l-2 border-accent/30 pl-6">
            Curated selection of high-end collectibles. From dry carbon Paganis to limited edition JDM legends. Mint condition, guaranteed.
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

            {/* Realistic Tire Button */}
            <div className="flex justify-center w-full sm:w-auto pt-4 sm:pt-0">
              <motion.button
                id="admin-wheel"
                animate={controls}
                onClick={handleAdminClick}
                className="relative w-20 h-20 sm:w-24 sm:h-24 group cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
              {/* Outer Tire (Rubber) */}
              <div className="absolute inset-0 rounded-full bg-[#121212] border-[8px] border-[#0a0a0a] shadow-[inset_0_0_20px_rgba(0,0,0,1),0_8px_20px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden">
                {/* Tire Treads (Ridges) - More Visible */}
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    backgroundImage: 'repeating-conic-gradient(#000 0deg 5deg, #1a1a1a 5deg 10deg)',
                    maskImage: 'radial-gradient(circle, transparent 65%, black 66%)',
                    WebkitMaskImage: 'radial-gradient(circle, transparent 65%, black 66%)'
                  }}
                />

                {/* Sidewall Detail */}
                <div className="absolute inset-[12px] rounded-full border border-white/10 flex items-center justify-center">
                  <span className="text-[6px] text-white/20 font-mono uppercase tracking-[0.2em] rotate-[-45deg]">P-ZERO</span>
                </div>

                {/* Rim (Metallic) */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ffffff] via-[#a1a1a1] to-[#ffffff] p-[3px] shadow-[0_0_15px_rgba(255,255,255,0.3)] z-10">
                  <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center relative overflow-hidden">
                    {/* Spokes (High Detail) */}
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-full bg-gradient-to-b from-[#ffffff] via-[#888] to-[#ffffff] shadow-sm"
                        style={{ transform: `rotate(${i * 60}deg)` }}
                      >
                        <div className="w-full h-1/2 bg-black/40" />
                      </div>
                    ))}
                    {/* Inner Rim Shadow */}
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]" />
                    {/* Center Cap */}
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#eee] to-[#666] z-20 border border-black/40 shadow-lg flex items-center justify-center">
                      <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>

      {/* Smoke Particles Rendering */}
      <div className="fixed inset-0 pointer-events-none z-[5]">
        <AnimatePresence>
          {smokeParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.5, x: p.x, y: p.y, rotate: p.rotation }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0.5, 2.5],
                y: p.y + p.targetY,
                x: p.x + p.targetX,
                rotate: p.rotation + 90
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute w-8 h-8 rounded-full bg-white/20 blur-xl"
              style={{ left: 0, top: 0 }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Speedometer-inspired decorative element */}
      <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-96 h-96 border-[20px] border-white/5 rounded-full hidden lg:block">
        <div className="absolute inset-0 border-[2px] border-dashed border-accent/20 rounded-full animate-[spin_20s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 font-display text-9xl font-black">
          01
        </div>
      </div>

      {/* Decorative vertical line */}
      <div className="absolute right-12 bottom-0 top-0 w-px bg-white/10 hidden lg:block">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="w-full bg-accent"
        />
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </section>
  );
}
