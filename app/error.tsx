'use client';

import { useEffect } from 'react';
import { RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
      <div className="flex items-center space-x-3 mb-8">
        <span className="w-12 h-[2px] bg-red-500" />
        <span className="text-red-500 font-mono text-xs tracking-[0.4em] uppercase">
          System Failure
        </span>
      </div>
      
      <h1 className="text-6xl md:text-8xl font-display font-bold uppercase tracking-tighter mb-6">
        Engine <span className="text-white/20">Stalled</span>
      </h1>
      
      <p className="text-white/40 max-w-md mb-12 uppercase tracking-widest text-xs leading-relaxed">
        Something went wrong while loading this page. Our team has been notified of the mechanical failure.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="group flex items-center justify-center gap-3 bg-white text-black px-8 py-4 font-display font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all duration-300"
        >
          <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          Reboot System
        </button>
        
        <Link 
          href="/" 
          className="group flex items-center justify-center gap-3 border border-white/20 text-white px-8 py-4 font-display font-bold uppercase tracking-wider hover:bg-white/10 transition-all duration-300"
        >
          <Home size={18} />
          Back to Showroom
        </Link>
      </div>
      
      <div className="mt-12 p-4 bg-white/5 border border-white/10 rounded font-mono text-[10px] text-white/30 max-w-xl overflow-hidden text-ellipsis">
        {error.message || 'Unknown system error'}
      </div>
    </div>
  );
}
