'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { GripVertical, ChevronDown, ChevronUp, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';

interface FulfillmentItem {
  name: string;
  image: string;
  quantity: number;
}

export interface FulfillmentCardData {
  _id: string;
  type: 'order' | 'pre-order';
  userEmail: string;
  items: FulfillmentItem[];
  shippingDetails: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  totalAmount: number;
  _creationTime: number;
  orderStatus: string;
}

const columnColors: Record<string, string> = {
  verified: 'border-l-blue-500',
  processing: 'border-l-amber-500',
  shipped: 'border-l-purple-500',
  completed: 'border-l-green-500',
};

export default function FulfillmentCard({
  card,
  columnStatus,
}: {
  card: FulfillmentCardData;
  columnStatus: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card._id, data: { card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const borderColor = columnColors[columnStatus] || 'border-l-white/20';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white/5 border border-white/10 border-l-4 ${borderColor} rounded-sm p-4 cursor-grab active:cursor-grabbing ${isDragging ? 'ring-2 ring-accent/50' : ''}`}
      {...attributes}
    >
      <div className="flex items-start gap-3">
        <div {...listeners} className="mt-1 text-white/20 hover:text-white/60 transition-colors">
          <GripVertical size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-white/60 tracking-widest">
              #{card._id.slice(-6)}
            </span>
            {card.type === 'pre-order' && (
              <span className="text-[8px] font-bold uppercase tracking-widest bg-accent/20 text-accent px-1.5 py-0.5 rounded-sm">
                PO
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/40 truncate">{card.userEmail}</p>
          <div className="mt-2 flex items-center gap-2">
            {card.items[0] && (
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-6 bg-black rounded-sm overflow-hidden flex-shrink-0">
                  {card.items[0].image && (
                    <Image
                      src={card.items[0].image}
                      alt={card.items[0].name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <span className="text-[10px] text-white/60 truncate">
                  {card.items[0].name}
                  {card.items.length > 1 && ` +${card.items.length - 1}`}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs font-bold text-accent mt-2">
            ₹{card.totalAmount.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 w-full flex items-center justify-center gap-1 text-[8px] text-white/30 hover:text-white/60 uppercase tracking-widest transition-colors"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide Details' : 'Show Details'}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
          {/* All items */}
          <div className="space-y-2">
            {card.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="relative w-8 h-6 bg-black rounded-sm overflow-hidden flex-shrink-0">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <span className="text-[10px] text-white/60 truncate flex-1">{item.name}</span>
                <span className="text-[8px] text-accent font-bold">x{item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Shipping */}
          {card.shippingDetails && (
            <div className="bg-white/5 p-3 rounded-sm space-y-1">
              <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold flex items-center gap-1">
                <MapPin size={10} /> Shipping
              </p>
              <p className="text-[10px] text-white/80 font-bold">{card.shippingDetails.name}</p>
              <p className="text-[10px] text-white/60 flex items-center gap-1">
                <Phone size={10} /> {card.shippingDetails.phone}
              </p>
              <p className="text-[10px] text-white/40 leading-relaxed">
                {card.shippingDetails.address}, {card.shippingDetails.city},{' '}
                {card.shippingDetails.state} - {card.shippingDetails.pincode}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
