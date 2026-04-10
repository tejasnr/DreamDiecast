export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-12 h-[1px] bg-accent"></span>
          <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">Who We Are</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none mb-12">
          About <span className="text-white/20">Us</span>
        </h1>

        <div className="space-y-8 text-white/60 leading-relaxed">
          <p>
            DreamDiecast is India&apos;s premier destination for premium diecast car collectibles. Founded by passionate collectors, we curate the finest scale models from the world&apos;s top manufacturers, bringing you an unmatched selection of miniature automotive art.
          </p>
          <p>
            Our collection spans iconic JDM legends, exotic hypercars, motorsport machines, and everyday classics — each meticulously crafted to capture the essence of the original vehicle. We work directly with brands to ensure authenticity and quality in every model we offer.
          </p>

          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">Our Mission</h2>
          <p>
            To build a community of collectors who share our passion for automotive excellence. We believe every model tells a story — of engineering brilliance, racing heritage, and design innovation. Our mission is to make these stories accessible to collectors across India and beyond.
          </p>

          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">Why Choose Us</h2>
          <ul className="list-disc list-inside space-y-3">
            <li>Handpicked selection from top brands worldwide</li>
            <li>Authenticity guaranteed on every model</li>
            <li>Secure packaging and reliable shipping across India</li>
            <li>Dedicated collector community and support</li>
            <li>Pre-order access to upcoming releases</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
