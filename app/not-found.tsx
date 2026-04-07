import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
      <div className="flex items-center space-x-3 mb-8">
        <span className="w-12 h-[2px] bg-accent" />
        <span className="text-accent font-mono text-xs tracking-[0.4em] uppercase">
          Error 404
        </span>
      </div>
      
      <h1 className="text-6xl md:text-8xl font-display font-bold uppercase tracking-tighter mb-6">
        Lost in the <span className="text-white/20">Vault</span>
      </h1>
      
      <p className="text-white/40 max-w-md mb-12 uppercase tracking-widest text-xs leading-relaxed">
        The model you are looking for has been moved to a private collection or doesn&apos;t exist in our current inventory.
      </p>
      
      <Link 
        href="/" 
        className="group flex items-center gap-3 bg-white text-black px-8 py-4 font-display font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-all duration-300"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Showroom
      </Link>
    </div>
  );
}
