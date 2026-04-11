'use client';

import { Check } from 'lucide-react';

const STEPS = [
  { key: 'deposit', label: 'Deposit Paid' },
  { key: 'stock', label: 'Stock Arrived' },
  { key: 'balance', label: 'Balance Paid' },
  { key: 'shipped', label: 'Shipped' },
];

function getStepIndex(status: string): number {
  switch (status) {
    case 'deposit_submitted':
      return 0;
    case 'deposit_verified':
    case 'waiting_for_stock':
      return 1;
    case 'stock_arrived':
      return 2;
    case 'balance_submitted':
      return 2;
    case 'balance_verified':
      return 3;
    case 'shipped':
    case 'delivered':
    case 'fully_paid_shipped':
      return 4;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
}

function isStepActive(status: string, stepKey: string): boolean {
  // Special: balance_submitted means balance step is "in progress" (pulsing)
  if (status === 'balance_submitted' && stepKey === 'balance') return true;
  if (status === 'deposit_submitted' && stepKey === 'deposit') return true;
  return false;
}

interface PreOrderTimelineProps {
  status: string;
  className?: string;
}

export default function PreOrderTimeline({ status, className = '' }: PreOrderTimelineProps) {
  const currentStep = getStepIndex(status);

  if (status === 'cancelled') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Cancelled</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {STEPS.map((step, index) => {
        const completed = index < currentStep;
        const active = isStepActive(status, step.key);
        const upcoming = !completed && !active;

        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] transition-all ${
                  completed
                    ? 'bg-green-500 text-white'
                    : active
                      ? 'bg-accent text-white animate-pulse'
                      : 'bg-white/10 text-white/30'
                }`}
              >
                {completed ? <Check size={10} /> : null}
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-widest ${
                  completed
                    ? 'text-green-400'
                    : active
                      ? 'text-accent'
                      : 'text-white/30'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`w-4 h-[1px] mx-0.5 ${
                  completed ? 'bg-green-500' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
