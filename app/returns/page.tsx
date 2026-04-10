export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-12 h-[1px] bg-accent"></span>
          <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">Our Policy</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none mb-12">
          Returns & <span className="text-white/20">Refunds</span>
        </h1>

        <div className="space-y-6 text-white/60 leading-relaxed">
          <p>
            All sales at DreamDiecast are <span className="text-white font-bold">final</span>. We do not offer returns, exchanges, or refunds on any purchases, including pre-orders.
          </p>
          <p>
            If you receive a damaged or defective item, please contact us at dreamdiecast@gmail.com within 48 hours of delivery with photos of the damage. We will review your case and arrange a replacement if applicable.
          </p>
        </div>
      </div>
    </main>
  );
}
