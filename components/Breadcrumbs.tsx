import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-6 pt-28 pb-4">
      <ol className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={10} className="text-white/20" />}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="hover:text-white/70 transition-colors">
                {item.name}
              </Link>
            ) : (
              <span className="text-white/60">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
