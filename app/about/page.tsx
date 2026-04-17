import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'About DreamDiecast',
  description:
    "Learn about DreamDiecast — India's premier destination for premium 1/64 scale diecast collectibles. Founded by passionate collectors in Bangalore, shipping across India.",
  alternates: { canonical: '/about' },
};

const FAQ_ITEMS = [
  {
    question: 'What brands does DreamDiecast carry?',
    answer:
      'DreamDiecast stocks premium diecast models from Hot Wheels, Mini GT (True Scale Miniatures), Tarmac Works, Bburago, Pop Race, and Matchbox. We carry 1:64, 1:43, and 1:24 scale models from each brand, including limited editions and exclusive releases.',
  },
  {
    question: 'How does DreamDiecast ship diecast models?',
    answer:
      'We ship across India using secure, collector-grade packaging. Every model is individually bubble-wrapped and placed in a rigid shipping box to prevent damage during transit. Orders are typically dispatched within 1-2 business days.',
  },
  {
    question: 'Are DreamDiecast products authentic?',
    answer:
      'Yes, 100%. Every product sold on DreamDiecast is sourced directly from authorized distributors and manufacturers. We guarantee authenticity on all models — no replicas, no counterfeits.',
  },
  {
    question: 'What is DreamDiecast\'s return policy?',
    answer:
      'We accept returns within 7 days of delivery if the product is damaged during shipping or incorrect. Items must be in their original, unopened packaging. Contact us at dreamdiecast@gmail.com with your order details and photos of any damage.',
  },
  {
    question: 'How do pre-orders work at DreamDiecast?',
    answer:
      'Pre-orders allow you to reserve upcoming diecast releases before they arrive in stock. You pay a booking advance at the time of pre-order, and the remaining balance is collected when the product arrives and is ready to ship. Pre-order items are sourced directly from manufacturers.',
  },
  {
    question: 'Does DreamDiecast ship internationally?',
    answer:
      'Currently, DreamDiecast ships within India only. We are working on expanding to international markets. Follow us on Instagram @dreamdiecastofficial for updates on international shipping availability.',
  },
];

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'About Us', url: `${SITE_URL}/about` },
        ]}
      />
      <FAQJsonLd items={FAQ_ITEMS} />
      <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-12 h-[1px] bg-accent"></span>
            <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">Who We Are</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none mb-12">
            About <span className="text-white/20">DreamDiecast</span>
          </h1>

          <article className="space-y-8 text-white/60 leading-relaxed">
            <p>
              DreamDiecast is India&apos;s premier online store for premium diecast car collectibles. Based in Bangalore, Karnataka, we curate the finest 1:64, 1:43, and 1:24 scale models from the world&apos;s top manufacturers — bringing collectors across India access to miniature automotive art they can&apos;t find anywhere else.
            </p>

            <p>
              Founded by passionate car enthusiasts and diecast collectors, DreamDiecast was born from a simple realization: finding authentic, premium diecast models in India shouldn&apos;t be this hard. We set out to build the destination we always wished existed — a carefully curated store with genuine products, fair pricing, and collector-grade packaging.
            </p>

            <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">What Brands Do We Carry?</h2>
            <p>
              We stock models from six of the world&apos;s most respected diecast manufacturers:
            </p>
            <ul className="list-disc list-inside space-y-3">
              <li><strong className="text-white">Hot Wheels</strong> — Mattel&apos;s iconic brand, including premium RLC, Car Culture, Team Transport, and mainline releases</li>
              <li><strong className="text-white">Mini GT</strong> — True Scale Miniatures&apos; 1:64 line, known for exceptional detail on supercars and JDM models</li>
              <li><strong className="text-white">Tarmac Works</strong> — Hong Kong-based brand specializing in motorsport-inspired diecast with authentic racing liveries</li>
              <li><strong className="text-white">Bburago</strong> — Italian manufacturer renowned for detailed Ferrari, Lamborghini, and Porsche scale replicas</li>
              <li><strong className="text-white">Pop Race</strong> — Limited edition collectibles featuring unique colorways and exclusive collaborations</li>
              <li><strong className="text-white">Matchbox</strong> — The original pocket-sized diecast brand since 1953, with classic and modern vehicles</li>
            </ul>

            <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">Our Mission</h2>
            <p>
              To build a community of collectors who share our passion for automotive excellence. We believe every model tells a story — of engineering brilliance, racing heritage, and design innovation. Our mission is to make these stories accessible to collectors across India with authentic products and a premium buying experience.
            </p>

            <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">Why Choose DreamDiecast?</h2>
            <ul className="list-disc list-inside space-y-3">
              <li><strong className="text-white">100% Authentic Products</strong> — Every model sourced from authorized distributors. No replicas, no counterfeits.</li>
              <li><strong className="text-white">Collector-Grade Packaging</strong> — Individual bubble wrap, rigid boxes, and protective inserts for safe delivery.</li>
              <li><strong className="text-white">All India Shipping</strong> — We deliver to every corner of India, from metros to tier-3 cities.</li>
              <li><strong className="text-white">Pre-Order Access</strong> — Reserve upcoming releases and limited editions before they sell out.</li>
              <li><strong className="text-white">Active Collector Community</strong> — Join our WhatsApp group and Instagram for drops, deals, and collector discussions.</li>
            </ul>

            <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {FAQ_ITEMS.map((faq) => (
                <div key={faq.question}>
                  <h3 className="text-lg font-display font-bold text-white mb-2">{faq.question}</h3>
                  <p>{faq.answer}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white pt-8">Get in Touch</h2>
            <p>
              Have questions about a product or need help with an order? Reach us at{' '}
              <a href="mailto:dreamdiecast@gmail.com" className="text-accent hover:underline">dreamdiecast@gmail.com</a>
              {' '}or call{' '}
              <a href="tel:+919148724708" className="text-accent hover:underline">+91-91487-24708</a>.
              Follow us on{' '}
              <a href="https://www.instagram.com/dreamdiecastofficial/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Instagram @dreamdiecastofficial</a>
              {' '}for the latest drops and community updates.
            </p>
          </article>
        </div>
      </main>
    </>
  );
}
