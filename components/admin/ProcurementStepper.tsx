'use client';

import { Package, Plane, Shield, CheckCircle } from 'lucide-react';

export type ProcurementStage =
  | 'brand_ordered'
  | 'international_transit'
  | 'customs_processing'
  | 'inventory_ready';

const STAGES: {
  key: ProcurementStage;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { key: 'brand_ordered', label: 'Ordered', icon: Package },
  { key: 'international_transit', label: 'Transit', icon: Plane },
  { key: 'customs_processing', label: 'Customs', icon: Shield },
  { key: 'inventory_ready', label: 'In-Hand', icon: CheckCircle },
];

function getStageStyle(index: number, currentIndex: number, stageKey: ProcurementStage) {
  if (index < currentIndex) {
    // Completed
    return {
      circle: 'bg-green-500/20 border-green-500 text-green-500',
      label: 'text-green-500/60',
      line: 'bg-green-500',
    };
  }
  if (index === currentIndex) {
    // Active
    if (stageKey === 'inventory_ready') {
      return {
        circle: 'bg-green-500/20 border-green-500 text-green-500 animate-pulse',
        label: 'text-green-400 font-bold',
        line: 'bg-green-500',
      };
    }
    // Transit or customs — amber
    if (stageKey === 'international_transit' || stageKey === 'customs_processing') {
      return {
        circle: 'bg-amber-500/20 border-amber-500 text-amber-500 animate-pulse',
        label: 'text-amber-400 font-bold',
        line: 'bg-amber-500',
      };
    }
    // brand_ordered — neutral active
    return {
      circle: 'bg-white/10 border-white/60 text-white animate-pulse',
      label: 'text-white font-bold',
      line: 'bg-white/30',
    };
  }
  // Upcoming
  return {
    circle: 'bg-zinc-800 border-zinc-600 text-zinc-500',
    label: 'text-zinc-500',
    line: 'bg-zinc-700',
  };
}

interface ProcurementStepperProps {
  currentStage: ProcurementStage | undefined;
  onStageClick: (stage: ProcurementStage) => void;
  disabled?: boolean;
}

export default function ProcurementStepper({
  currentStage,
  onStageClick,
  disabled,
}: ProcurementStepperProps) {
  const currentIndex = currentStage
    ? STAGES.findIndex((s) => s.key === currentStage)
    : -1;

  return (
    <div className="flex items-center gap-0 w-full">
      {STAGES.map((stage, i) => {
        const style = getStageStyle(i, currentIndex, stage.key);
        const Icon = stage.icon;
        const isLast = i === STAGES.length - 1;

        return (
          <div key={stage.key} className="flex items-center flex-1 min-w-0">
            {/* Stage node */}
            <button
              onClick={() => !disabled && onStageClick(stage.key)}
              disabled={disabled}
              className={`flex flex-col items-center gap-1.5 group shrink-0 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
              title={stage.label}
            >
              <div
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${style.circle} ${
                  !disabled ? 'group-hover:scale-110' : ''
                }`}
              >
                <Icon size={16} />
              </div>
              <span
                className={`text-[9px] uppercase tracking-widest whitespace-nowrap ${style.label}`}
              >
                {stage.label}
              </span>
            </button>

            {/* Connecting line */}
            {!isLast && (
              <div className="flex-1 mx-1.5 mt-[-18px]">
                <div
                  className={`h-[2px] w-full rounded-full transition-all ${
                    i < currentIndex ? style.line : 'bg-zinc-700'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
