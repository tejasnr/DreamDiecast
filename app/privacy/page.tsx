import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'DreamDiecast privacy policy — how we collect, use, and protect your personal information when you shop for diecast collectibles.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-12 h-[1px] bg-accent"></span>
          <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">Legal</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none mb-12">
          Privacy <span className="text-white/20">Policy</span>
        </h1>

        <div className="space-y-8 text-white/60 leading-relaxed">
          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white">Information We Collect</h2>
          <ul className="list-disc list-inside space-y-3">
            <li>Account information: name, email address, and profile details</li>
            <li>Shipping information: address, phone number</li>
            <li>Order history and preferences</li>
            <li>Usage data: pages visited, features used</li>
          </ul>

          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-3">
            <li>To process and fulfil your orders</li>
            <li>To communicate order updates and shipping notifications</li>
            <li>To improve our products and services</li>
            <li>To send promotional content (with your consent)</li>
          </ul>

          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">Data Protection</h2>
          <p>
            We implement industry-standard security measures to protect your personal information. Your data is encrypted in transit and at rest. We never sell your personal information to third parties.
          </p>

          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">Cookies</h2>
          <p>
            We use essential cookies to maintain your session and preferences. Analytics cookies help us understand how visitors use our site. You can manage cookie preferences through your browser settings.
          </p>

          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">Contact</h2>
          <p>
            For privacy-related inquiries, please contact us at dreamdiecast@gmail.com.
          </p>
        </div>
      </div>
    </main>
  );
}
