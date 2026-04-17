import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description:
    'DreamDiecast shipping policy — free delivery on orders above \u20B92,000. Standard 5-7 day and express 2-3 day delivery across India. Secure packaging guaranteed.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/shipping-policy' },
};

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-12 h-[1px] bg-accent"></span>
          <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">Deliveries</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none mb-12">
          Shipping <span className="text-white/20">Policy</span>
        </h1>

        <div className="space-y-8 text-white/60 leading-relaxed">
          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white">Domestic Shipping (India)</h2>
          <ul className="list-disc list-inside space-y-3">
            <li>Standard delivery: 5-7 business days</li>
            <li>Express delivery: 2-3 business days (where available)</li>
            <li>Free shipping on orders above {'\u20B9'}2,000</li>
            <li>Flat rate of {'\u20B9'}99 for orders under {'\u20B9'}2,000</li>
          </ul>

          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">International Shipping</h2>
          <p>
            International shipping is available to select countries. Delivery times and charges vary based on destination. Please contact us at dreamdiecast@gmail.com for international shipping inquiries.
          </p>

          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">Packaging</h2>
          <p>
            All models are carefully packaged with premium protective materials to ensure they arrive in perfect condition. Each shipment is insured against damage during transit.
          </p>

          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">Tracking</h2>
          <p>
            Once your order is shipped, you will receive a tracking number via email. You can track your shipment status through the courier partner&apos;s website or through your account on our platform.
          </p>
        </div>
      </div>
    </main>
  );
}
