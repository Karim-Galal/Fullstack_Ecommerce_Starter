import { EmptyState } from '@/components/ui/data-display/EmptyState';

export function AdminPageHeader({ title, description, actions, eyebrow }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function AdminPermissionDenied({ title, description }) {
  return (
    <div className="mx-auto max-w-3xl">
      <EmptyState icon="lock" title={title} description={description} />
    </div>
  );
}
