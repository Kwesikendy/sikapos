import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StepItem {
  id: number;
  label: string;
  sublabel?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <div
              key={step.id}
              onClick={() => isCompleted && onStepClick && onStepClick(step.id)}
              className={cn(
                'flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all',
                isCompleted
                  ? 'bg-emerald-50/70 border-emerald-200 cursor-pointer'
                  : isActive
                  ? 'bg-white border-[#00A859] ring-2 ring-[#00A859] shadow-xs'
                  : 'bg-slate-50/60 border-slate-200 opacity-60'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors',
                  isCompleted
                    ? 'bg-[#00A859] text-white shadow-xs'
                    : isActive
                    ? 'bg-emerald-100 text-[#00A859] border border-[#00A859]'
                    : 'bg-slate-200 text-slate-600'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : `0${step.id}`}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isCompleted ? 'Done' : isActive ? 'Active' : 'Step'}
                </span>
                <p
                  className={cn(
                    'text-xs sm:text-sm font-bold truncate',
                    isActive ? 'text-[#00A859]' : 'text-slate-900'
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
