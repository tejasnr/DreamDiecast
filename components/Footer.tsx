import { Instagram, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface pt-24 pb-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-24">
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold tracking-tighter uppercase italic">
              Dream<span className="text-accent">Diecast</span>
            </h2>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              The ultimate destination for premium diecast car collectors. We bring you the most exclusive models from around the world.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/dreamdiecastofficial/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-accent hover:text-white transition-all">
                <Instagram size={18} />
              </a>
              <a href="https://chat.whatsapp.com/BvgtaCooKYpJpsfDo978Fy?mode=gi_t" target="_blank" rel="noopener noreferrer" className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-accent hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold uppercase tracking-widest mb-8 text-sm">Quick Links</h4>
            <ul className="space-y-4 text-sm text-white/40 uppercase tracking-widest">
              <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
              <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Returns & Refunds</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold uppercase tracking-widest mb-8 text-sm">Collections</h4>
            <ul className="space-y-4 text-sm text-white/40 uppercase tracking-widest">
              <li><Link href="/brands" className="hover:text-accent transition-colors">Brands</Link></li>
              <li><Link href="/new-arrivals" className="hover:text-accent transition-colors">New Arrivals</Link></li>
              <li><Link href="/pre-orders" className="hover:text-accent transition-colors">Pre-Orders</Link></li>
              <li><Link href="/bundles" className="hover:text-accent transition-colors">Bundles</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold uppercase tracking-widest mb-8 text-sm">Contact</h4>
            <ul className="space-y-4 text-sm text-white/40">
              <li className="flex items-center space-x-3">
                <Mail size={16} className="text-accent" />
                <span>dreamdiecast@gmail.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={16} className="text-accent" />
                <span>+91 9902444938</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin size={16} className="text-accent" />
                <span>Bangalore, Karnataka, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">
            © 2026 DreamDiecast. All Rights Reserved.
          </p>
          <div className="flex space-x-6">
            <div className="h-6 w-10 bg-white/5 rounded-sm" />
            <div className="h-6 w-10 bg-white/5 rounded-sm" />
            <div className="h-6 w-10 bg-white/5 rounded-sm" />
          </div>
        </div>
      </div>
    </footer>
  );
}
