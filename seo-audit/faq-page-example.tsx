// app/faq/page.tsx
// Copy this file to your Next.js app directory and customize

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | DreamDiecast',
  description: 'Common questions about DreamDiecast diecast collectibles, shipping, authenticity, and returns in India.',
}

const faqs = [
  {
    question: "How long does shipping take in India?",
    answer: "DreamDiecast offers two shipping options within India. Standard delivery takes 5-7 business days, while express delivery (where available) takes 2-3 business days. We offer free shipping on orders above ₹2,000, with a flat rate of ₹99 for smaller orders. All orders are shipped with premium protective materials and include shipment insurance."
  },
  {
    question: "Are DreamDiecast models authentic?",
    answer: "Yes, all DreamDiecast models are 100% authentic and sourced directly from authorized manufacturers. We maintain direct relationships with Hot Wheels, Mini GT, Bburago, Tarmac Works, Pop Race, and Matchbox. Each model undergoes our verification process before shipping to ensure authenticity and quality. We do not sell counterfeit or replica models."
  },
  {
    question: "What is DreamDiecast's return policy?",
    answer: "All sales at DreamDiecast are final. We do not offer returns, exchanges, or refunds on any purchases, including pre-orders. However, if you receive a damaged or defective item, please contact us at dreamdiecast@gmail.com within 48 hours of delivery with photos of the damage. We will arrange a replacement or refund for verified damage claims."
  },
  {
    question: "Which diecast brands does DreamDiecast sell?",
    answer: "DreamDiecast carries six premium diecast brands: Hot Wheels (founded 1968, variety leader), Bburago (precision European models), Mini GT (JDM specialists with exceptional detail), Pop Race (limited edition releases), Tarmac Works (racing liveries and motorsport models), and Matchbox (classic vehicles). Each brand offers different scales, detail levels, and specializations to suit various collector preferences and budgets."
  },
  {
    question: "What do diecast scale numbers mean (1:18, 1:24, 1:43, 1:64)?",
    answer: "The scale ratio indicates the model's size relative to the actual vehicle. For example, 1:18 scale means the model is 1/18th the size of the real car. A typical car that's 18 feet (216 inches) long becomes a 12-inch model at 1:18 scale. Larger scale numbers mean smaller models: 1:64 (like most Hot Wheels) are about 3 inches long, while 1:18 models are 10-12 inches with much more detail. Scale choice depends on display space, budget, and desired detail level."
  },
  {
    question: "How can I verify the authenticity of my diecast model?",
    answer: "Authentic diecast models have several verification markers: official manufacturer logos on the base or packaging, precise paint quality without drips or unevenness, proper weight (diecast metal feels substantial), detailed copyright information on the base, and manufacturer-specific serial numbers. DreamDiecast includes authenticity certificates with premium models. Check for tamiya marks, licensing logos from car manufacturers (Toyota, BMW, etc.), and compare packaging with official brand images online."
  },
  {
    question: "Do you ship diecast models internationally?",
    answer: "Currently, DreamDiecast ships exclusively within India. We serve all states and union territories with our standard (5-7 days) and express (2-3 days) shipping options. For international inquiries, please contact us at dreamdiecast@gmail.com, and we'll notify you if we expand international shipping in the future."
  },
  {
    question: "How do you package diecast models for shipping?",
    answer: "DreamDiecast uses premium protective packaging to ensure your collectibles arrive safely. Each model is wrapped in bubble wrap, secured in a custom-fitted box with foam padding, and the outer shipping box is reinforced with fragile stickers. All shipments include insurance coverage. High-value models (above ₹5,000) receive additional double-boxing protection. We've achieved a 99.8% safe delivery rate with this packaging method."
  },
  {
    question: "What payment methods do you accept?",
    answer: "DreamDiecast accepts all major payment methods including credit cards (Visa, Mastercard, American Express), debit cards, UPI (Google Pay, PhonePe, Paytm), net banking, and digital wallets. All transactions are processed through secure, encrypted payment gateways. We do not store your card details on our servers."
  },
  {
    question: "Can I track my diecast model order?",
    answer: "Yes, once your order ships, you'll receive a tracking number via email and SMS. You can track your shipment in real-time through the courier's website. Most orders ship within 24-48 hours of purchase confirmation. For order status questions before shipping, contact us at dreamdiecast@gmail.com or WhatsApp +91 91487 24708."
  },
  {
    question: "Does DreamDiecast offer gift wrapping?",
    answer: "Yes, we offer complimentary premium gift wrapping for orders over ₹1,000. Select the gift wrapping option at checkout and add a personalized message. Your diecast model will arrive in elegant wrapping with your custom note, perfect for birthdays, holidays, or special occasions for fellow collectors."
  },
  {
    question: "Can I pre-order upcoming diecast releases?",
    answer: "Absolutely! DreamDiecast offers pre-orders for upcoming releases from all our partner brands. Visit our Pre-Orders page to see models launching in the next 3-6 months. Pre-ordering guarantees your reservation before models sell out. Payment is collected at the time of pre-order, and we'll notify you when your model ships (typically within 1-2 weeks of manufacturer release)."
  },
  {
    question: "What if my diecast model arrives damaged during shipping?",
    answer: "If your model arrives damaged, contact us immediately at dreamdiecast@gmail.com within 48 hours of delivery. Include your order number and photos showing the damage to both the model and packaging. Our team will review your claim within 24 hours and arrange either a replacement (if available) or full refund. All our shipments are insured for this purpose."
  },
  {
    question: "Does DreamDiecast have a physical store in Bangalore?",
    answer: "DreamDiecast currently operates online only with shipping across India from our Bangalore warehouse. This allows us to offer competitive pricing and a wider selection than traditional retail stores. However, Bangalore customers can contact us at +91 91487 24708 to arrange local pickup for same-day delivery (subject to availability)."
  },
  {
    question: "How often do you add new diecast models to your collection?",
    answer: "DreamDiecast adds new models weekly. Our New Arrivals page is updated every Monday with the latest additions. We also announce rare finds and limited editions on our Instagram (@dreamdiecastofficial) and WhatsApp channel. Subscribe to our newsletter to receive weekly updates on new releases, restocks, and exclusive pre-order opportunities."
  }
]

// FAQ Schema markup for Google AI Overviews
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
}

export default function FAQPage() {
  return (
    <>
      {/* Schema markup for AI systems */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <span className="w-12 h-[2px] bg-accent"></span>
            <span className="text-accent font-mono text-xs tracking-[0.4em] uppercase">
              FAQ
            </span>
            <span className="w-12 h-[2px] bg-accent"></span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-6">
            Frequently Asked <span className="text-accent">Questions</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Everything you need to know about DreamDiecast collectibles, shipping, authenticity, and more.
          </p>
          <p className="text-white/40 text-sm mt-4">
            Last updated: April 17, 2026
          </p>
        </div>

        {/* FAQs */}
        <div className="space-y-8">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="glass p-8 rounded-lg border border-white/5 hover:border-accent/30 transition-all"
            >
              <h2 className="text-2xl font-display font-bold mb-4 text-white">
                {faq.question}
              </h2>
              <p className="text-white/70 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center glass p-12 rounded-lg border border-white/5">
          <h2 className="text-3xl font-display font-bold mb-4">
            Still Have Questions?
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            Our team is here to help. Reach out via email or WhatsApp for personalized assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:dreamdiecast@gmail.com"
              className="bg-white text-black px-8 py-3 font-display font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-all rounded-sm"
            >
              Email Us
            </a>
            <a
              href="https://wa.me/919148724708"
              target="_blank"
              rel="noopener noreferrer"
              className="glass border border-white/10 px-8 py-3 font-display font-bold uppercase tracking-wider hover:bg-accent hover:text-white hover:border-accent transition-all rounded-sm"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
