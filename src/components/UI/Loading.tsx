import clsx from 'clsx';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loading({ size = 'md', className }: LoadingProps) {
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx('animate-spin rounded-full border-4 border-gray-300 border-t-blue-600', {
          'w-4 h-4': size === 'sm',
          'w-8 h-8': size === 'md',
          'w-12 h-12': size === 'lg',
        })}
      />
    </div>
  );
}
