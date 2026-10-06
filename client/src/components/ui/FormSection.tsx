import React from 'react';
import { cn } from '../../lib/utils';
import { SectionHeader } from './SectionHeader';

export interface FormSectionProps {
  title?: string;
  description?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  withDivider?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  badge,
  children,
  className,
  withDivider = false,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <SectionHeader
          title={title}
          description={description}
          badge={badge}
          withDivider={withDivider}
        />
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
};
