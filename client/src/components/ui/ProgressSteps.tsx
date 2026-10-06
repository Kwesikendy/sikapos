import React from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

export interface ProgressStepItem {
  id: string;
  label: string;
  path?: string;
}

export interface ProgressStepsProps {
  currentStepIndex: number;
  steps?: ProgressStepItem[];
  className?: string;
}

export const ONBOARDING_STEPS: ProgressStepItem[] = [
  { id: 'register', label: '1. Register', path: '/merchant-signup' },
  { id: 'setup', label: '2. Setup Store', path: '/store-setup' },
  { id: 'readiness', label: '3. Terminal', path: '/launch-readiness' },
  { id: 'pos', label: '4. Sell', path: '/pos' },
];

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  currentStepIndex,
  steps = ONBOARDING_STEPS,
  className,
}) => {
  return (
    <nav aria-label="Onboarding Progress" className={cn('flex items-center gap-1 sm:gap-2', className)}>
      <ol className="flex items-center gap-1 sm:gap-2 w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <li key={step.id} className="flex items-center gap-1 sm:gap-2">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                  isCurrent && 'bg-[#0D5C3A] text-white shadow-xs',
                  isCompleted && 'bg-emerald-50 text-[#0D5C3A] border border-emerald-200/60',
                  !isCurrent && !isCompleted && 'text-slate-400 bg-slate-50/60 border border-transparent'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-[#0D5C3A] stroke-[2.5]" aria-hidden="true" />
                ) : (
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                      isCurrent ? 'bg-white/20 text-white' : 'text-slate-400'
                    )}
                  >
                    {index + 1}
                  </span>
                )}
                <span className={cn('hidden md:inline text-[11px] uppercase tracking-wider', isCurrent && 'font-bold')}>
                  {step.label.replace(/^\d+\.\s*/, '')}
                </span>
              </div>

              {index < steps.length - 1 && (
                <span className="text-slate-300 text-xs select-none" aria-hidden="true">
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
