import React from 'react';
import { Skeleton } from './Skeleton';
import { cn } from '../../lib/utils';

export const KPICardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="40%" height="0.875rem" />
        <Skeleton variant="circular" width="2rem" height="2rem" />
      </div>
      <Skeleton variant="text" width="60%" height="1.75rem" />
      <Skeleton variant="text" width="30%" height="0.75rem" />
    </div>
  );
};

export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-3', className)}>
      <Skeleton variant="rectangular" height="5rem" className="w-full rounded-lg" />
      <div className="space-y-1.5">
        <Skeleton variant="text" width="85%" height="1rem" />
        <Skeleton variant="text" width="45%" height="0.75rem" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton variant="text" width="50%" height="1.25rem" />
        <Skeleton variant="rectangular" width="2rem" height="1.75rem" className="rounded-lg" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 6,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton
            variant="text"
            width={i === 0 ? '70%' : i === columns - 1 ? '40%' : '55%'}
            height="1rem"
          />
        </td>
      ))}
    </tr>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 5,
  className,
}) => {
  return (
    <div className={cn('w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white', className)}>
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200/60">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton variant="text" width="60%" height="0.875rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const POSCartItemSkeleton: React.FC = () => {
  return (
    <div className="p-3 rounded-lg border border-slate-100 bg-white/60 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="55%" height="1rem" />
        <Skeleton variant="text" width="25%" height="1rem" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton variant="rectangular" width="5rem" height="1.75rem" className="rounded-md" />
        <Skeleton variant="text" width="20%" height="0.75rem" />
      </div>
    </div>
  );
};
