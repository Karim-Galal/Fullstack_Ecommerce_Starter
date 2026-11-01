import Link from 'next/link';

const variantStyles = {
  primary: 'bg-primary text-primary-on hover:bg-primary-hover',
  outline: 'border border-border bg-transparent text-text-primary hover:bg-surface-hover',
  ghost: 'bg-transparent text-text-primary hover:bg-surface-hover',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
};

export function AdminLinkButton({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        variantStyles[variant] || variantStyles.primary
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {children}
    </Link>
  );
}
