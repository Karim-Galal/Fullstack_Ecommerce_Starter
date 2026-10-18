'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Icon } from '@/components/icons';
import { useThemeStore } from '@/stores/themeStore';
import {
  Button,
  ButtonGroup,
  IconButton,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  RadioGroup,
  SearchInput,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  StatusBadge,
  PriceBadge,
  DiscountBadge,
  Avatar,
  Price,
  EmptyState,
  Alert,
  ToastProvider,
  useToast,
  Progress,
  Breadcrumbs,
  Pagination,
  Tabs,
  Dialog,
  Drawer,
  DropdownMenu,
  ConfirmDialog,
  Skeleton,
  ProductCardSkeleton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton,
} from '@/components/ui';

const copy = {
  en: {
    title: 'Design System',
    subtitle: 'Internal reference for the storefront visual language.',
    note: 'Development-only playground — not reachable in production.',
    theme: 'Theme',
    language: 'Language',
    light: 'Light',
    dark: 'Dark',
    sampleEyebrow: 'The Collection',
    sampleTitle: 'Timeless pieces, crafted to last',
    sampleBody:
      'A calm, editorial layout with generous space lets each piece breathe. Silver tones rest on warm neutral surfaces with a single restrained accent.',
    on: 'On',
    off: 'Off',
    openDialog: 'Open dialog',
    openDrawer: 'Open drawer',
    confirm: 'Confirm action',
    actions: 'Actions',
    next: 'Next',
  },
  ar: {
    title: 'نظام التصميم',
    subtitle: 'مرجع داخلي للغة البصرية للمتجر.',
    note: 'مساحة تطوير فقط — غير متاحة في الإنتاج.',
    theme: 'المظهر',
    language: 'اللغة',
    light: 'فاتح',
    dark: 'داكن',
    sampleEyebrow: 'المجموعة',
    sampleTitle: 'قطع خالدة مصنوعة لتدوم',
    sampleBody:
      'تصميم هادئ وتحريري مع مساحات واسعة يمنح كل قطعة مساحتها. درجات الفضة على أسطح محايدة دافئة مع لمسة مميزة واحدة.',
    on: 'مفعّل',
    off: 'معطّل',
    openDialog: 'فتح نافذة',
    openDrawer: 'فتح الدرج',
    confirm: 'تأكيد الإجراء',
    actions: 'إجراءات',
    next: 'التالي',
  },
};

const colorTokens = [
  ['primary', 'var(--primary)'],
  ['primary-hover', 'var(--primary-hover)'],
  ['primary-light', 'var(--primary-light)'],
  ['accent', 'var(--accent)'],
  ['accent-light', 'var(--accent-light)'],
  ['surface', 'var(--surface)'],
  ['surface-elevated', 'var(--surface-elevated)'],
  ['surface-sunken', 'var(--surface-sunken)'],
  ['surface-hover', 'var(--surface-hover)'],
  ['border', 'var(--border)'],
  ['border-strong', 'var(--border-strong)'],
  ['text-primary', 'var(--text-primary)'],
  ['text-secondary', 'var(--text-secondary)'],
  ['text-tertiary', 'var(--text-tertiary)'],
  ['success', 'var(--success)'],
  ['warning', 'var(--warning)'],
  ['error', 'var(--error)'],
  ['info', 'var(--info)'],
];

const radiusTokens = [
  ['sm', 'rounded-sm'],
  ['md', 'rounded-md'],
  ['lg', 'rounded-lg'],
  ['xl', 'rounded-xl'],
  ['2xl', 'rounded-2xl'],
  ['full', 'rounded-full'],
];

const shadowTokens = [
  ['xs', 'shadow-xs'],
  ['sm', 'shadow-sm'],
  ['md', 'shadow-md'],
  ['lg', 'shadow-lg'],
  ['xl', 'shadow-xl'],
  ['2xl', 'shadow-2xl'],
];

const typeScale = [
  ['text-4xl', 'text-4xl'],
  ['text-3xl', 'text-3xl'],
  ['text-2xl', 'text-2xl'],
  ['text-xl', 'text-xl'],
  ['text-lg', 'text-lg'],
  ['text-base', 'text-base'],
  ['text-sm', 'text-sm'],
  ['text-xs', 'text-xs'],
];

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="mb-4 border-b border-border pb-2 text-xs font-semibold uppercase tracking-widest text-text-tertiary">
        {title}
      </h2>
      <div className="space-y-8">{children}</div>
    </section>
  );
}

function Example({ label, children, className = '' }) {
  return (
    <div className={className}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Swatch({ label, color }) {
  return (
    <div className="min-w-24">
      <div
        className="h-14 w-full rounded-lg border border-border"
        style={{ backgroundColor: color }}
      />
      <p className="mt-2 text-xs font-medium text-text-secondary">{label}</p>
    </div>
  );
}

function OverlayDemos({ t }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const menuItems = [
    { type: 'label', label: 'Account' },
    { label: 'Profile', icon: 'user' },
    { label: 'Settings', icon: 'settings' },
    { type: 'divider' },
    { label: 'Sign out', icon: 'logout', danger: true },
  ];

  return (
    <>
      <Example label="Dialog / Drawer / Menu / Confirm">
        <Button onClick={() => setDialogOpen(true)}>{t.openDialog}</Button>
        <Button variant="outline" onClick={() => setDrawerOpen(true)}>
          {t.openDrawer}
        </Button>
        <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
          {t.confirm}
        </Button>
        <DropdownMenu
          label={t.actions}
          items={menuItems}
          trigger={
            <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary">
              {t.actions}
              <Icon name="chevronDown" size="sm" aria-hidden="true" />
            </span>
          }
        />
      </Example>

      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Edit product"
        description="Update the details for this piece."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDialogOpen(false)}>Save</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Name" defaultValue="Sterling Silver Ring" />
          <Textarea label="Description" rows={3} defaultValue="Hand-finished 925 silver." />
        </div>
      </Dialog>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        description="Refine the collection."
        footer={
          <Button className="w-full" onClick={() => setDrawerOpen(false)}>
            Apply
          </Button>
        }
      >
        <div className="space-y-6">
          <Switch label="In stock only" checked onChange={() => {}} />
          <RadioGroup
            label="Material"
            value="silver"
            onChange={() => {}}
            options={[
              { value: 'silver', label: 'Silver' },
              { value: 'gold', label: 'Gold' },
            ]}
          />
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        title="Delete this item?"
        message="This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
}

function Showcase() {
  const locale = useLocale();
  const t = copy[locale] ?? copy.en;
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const [checked, setChecked] = useState(true);
  const [option, setOption] = useState('silver');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(3);

  const switchLocale = () => {
    const next = locale === 'en' ? 'ar' : 'en';
    const segments = pathname.split('/').filter(Boolean);
    segments[0] = next;
    router.push(`/${segments.join('/')}`);
  };

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="shell flex flex-wrap items-center justify-between gap-4 py-4">
          <div>
            <p className="eyebrow">{t.title}</p>
            <p className="text-sm text-text-secondary">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon="sun" onClick={toggleTheme}>
              {theme === 'dark' ? t.light : t.dark}
            </Button>
            <Button variant="outline" size="sm" leftIcon="globe" onClick={switchLocale}>
              {locale === 'en' ? 'العربية' : 'English'}
            </Button>
          </div>
        </div>
      </header>

      <main className="shell space-y-16 py-10">
        <p className="rounded-lg border border-border bg-surface-sunken px-4 py-3 text-sm text-text-secondary">
          {t.note}
        </p>

        <Section id="tokens" title="Color tokens">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {colorTokens.map(([label, color]) => (
              <Swatch key={label} label={label} color={color} />
            ))}
          </div>
        </Section>

        <Section id="shape" title="Radius & elevation">
          <Example label="Radius">
            {radiusTokens.map(([label, className]) => (
              <div key={label} className="text-center">
                <div className={`h-14 w-20 border border-border bg-surface-elevated ${className}`} />
                <p className="mt-2 text-xs text-text-secondary">{label}</p>
              </div>
            ))}
          </Example>
          <Example label="Shadow">
            {shadowTokens.map(([label, className]) => (
              <div key={label} className="text-center">
                <div className={`flex h-16 w-24 items-center justify-center rounded-xl bg-surface-elevated text-xs text-text-secondary ${className}`}>
                  {label}
                </div>
              </div>
            ))}
          </Example>
        </Section>

        <Section id="type" title="Typography">
          <div className="space-y-2">
            <p className="eyebrow">{t.sampleEyebrow}</p>
            <h1 className="text-5xl">{t.sampleTitle}</h1>
            <p className="max-w-2xl text-lg text-text-secondary">{t.sampleBody}</p>
          </div>
          <div className="space-y-1">
            {typeScale.map(([label, className]) => (
              <p key={label} className={`${className} text-text-primary`}>
                <span className="me-3 text-sm text-text-tertiary">{label}</span>
                The quick silver fox
              </p>
            ))}
          </div>
        </Section>

        <Section id="buttons" title="Buttons">
          <Example label="Variants">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </Example>
          <Example label="Sizes">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra large</Button>
          </Example>
          <Example label="States & icons">
            <Button leftIcon="add">Add to cart</Button>
            <Button variant="outline" rightIcon="arrowRight">
              {t.next}
            </Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </Example>
          <Example label="Button group">
            <ButtonGroup>
              <Button variant="outline">Day</Button>
              <Button variant="outline">Week</Button>
              <Button variant="outline">Month</Button>
            </ButtonGroup>
          </Example>
        </Section>

        <Section id="icon-buttons" title="Icon buttons">
          <Example label="Variants">
            <IconButton name="wishlist" label="Wishlist" variant="ghost" />
            <IconButton name="cart" label="Cart" variant="solid" />
            <IconButton name="share" label="Share" variant="outline" />
            <IconButton name="edit" label="Edit" variant="subtle" />
            <IconButton name="delete" label="Delete" variant="danger" />
            <IconButton name="loading" label="Loading" loading />
          </Example>
          <Example label="Sizes">
            <IconButton name="search" label="Search" size="xs" variant="outline" />
            <IconButton name="search" label="Search" size="sm" variant="outline" />
            <IconButton name="search" label="Search" size="md" variant="outline" />
            <IconButton name="search" label="Search" size="lg" variant="outline" />
          </Example>
        </Section>

        <Section id="forms" title="Form controls">
          <div className="grid gap-6 md:grid-cols-2">
            <Input label="Full name" placeholder="Jane Doe" />
            <Input label="Email" type="email" leftIcon="email" placeholder="you@example.com" hint="We never share your email." />
            <Input label="Password" type="password" error="Password is too short" defaultValue="123" />
            <Input label="Disabled" disabled placeholder="Not editable" />
            <Select
              label="Category"
              placeholder="Select a category"
              options={[
                { value: 'rings', label: 'Rings' },
                { value: 'necklaces', label: 'Necklaces' },
                { value: 'bracelets', label: 'Bracelets' },
              ]}
            />
            <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" />
            <Textarea label="Description" placeholder="Write something…" />
          </div>
          <Example label="Selection controls">
            <Switch label={`Notifications ${checked ? `(${t.on})` : `(${t.off})`}`} checked={checked} onChange={(event) => setChecked(event.target.checked)} />
            <Checkbox label="Accept terms" defaultChecked />
          </Example>
          <RadioGroup
            label="Material"
            value={option}
            onChange={setOption}
            orientation="horizontal"
            options={[
              { value: 'silver', label: 'Silver', description: '925 sterling' },
              { value: 'gold', label: 'Gold', description: '18k plated' },
              { value: 'rose', label: 'Rose gold', disabled: true },
            ]}
          />
        </Section>

        <Section id="data" title="Badges, avatars & price">
          <Example label="Badge variants">
            <Badge>Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="outline">Outline</Badge>
          </Example>
          <Example label="Status & price">
            <StatusBadge status="pending" />
            <StatusBadge status="shipped" />
            <StatusBadge status="delivered" />
            <StatusBadge status="cancelled" />
            <PriceBadge price={1299} />
            <DiscountBadge discount={20} />
          </Example>
          <Example label="Avatar">
            <Avatar name="Layla Hassan" size="xs" />
            <Avatar name="Layla Hassan" size="sm" status="online" />
            <Avatar name="Layla Hassan" size="md" status="away" />
            <Avatar name="Layla Hassan" size="lg" status="busy" />
            <Avatar name="Layla Hassan" size="xl" />
          </Example>
          <Example label="Price">
            <Price value={12500} originalValue={15000} showDiscount currency="EGP" locale={locale === 'ar' ? 'ar-EG' : 'en-EG'} size="lg" />
          </Example>
        </Section>

        <Section id="feedback" title="Feedback">
          <Example label="Alert">
            <div className="w-full space-y-3 md:max-w-xl">
              <Alert variant="info" title="Heads up" description="Your order is being prepared." />
              <Alert variant="success" title="Saved" description="Your changes have been saved." />
              <Alert variant="warning" title="Low stock" description="Only 2 items left." />
              <Alert variant="destructive" title="Payment failed" description="Please try another card." dismissible />
            </div>
          </Example>
          <Example label="Progress">
            <div className="w-full max-w-md space-y-4">
              <Progress value={40} label="Profile completeness" showValue />
              <Progress value={80} variant="success" />
              <Progress indeterminate label="Uploading" />
            </div>
          </Example>
          <Example label="Toasts">
            <Button variant="outline" onClick={() => toast({ title: 'Saved', description: 'Your changes are live.', variant: 'success' })}>
              Success toast
            </Button>
            <Button variant="outline" onClick={() => toast({ title: 'Something went wrong', variant: 'destructive' })}>
              Error toast
            </Button>
            <Button variant="outline" onClick={() => toast('A neutral message')}>
              Default toast
            </Button>
          </Example>
        </Section>

        <Section id="navigation" title="Navigation">
          <Example label="Breadcrumbs">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '#' },
                { label: 'Collections', href: '#' },
                { label: 'Rings' },
              ]}
            />
          </Example>
          <Example label="Tabs">
            <div className="w-full max-w-xl">
              <Tabs
                defaultValue="details"
                items={[
                  { id: 'details', label: 'Details', content: <p className="text-sm text-text-secondary">Composition and craftsmanship.</p> },
                  { id: 'reviews', label: 'Reviews', badge: 12, content: <p className="text-sm text-text-secondary">Customer reviews.</p> },
                  { id: 'shipping', label: 'Shipping', disabled: true, content: null },
                ]}
              />
            </div>
          </Example>
          <Example label="Tabs (pills)">
            <Tabs
              variant="pills"
              defaultValue="all"
              items={[
                { id: 'all', label: 'All', content: null },
                { id: 'new', label: 'New', content: null },
                { id: 'sale', label: 'Sale', content: null },
              ]}
            />
          </Example>
          <Example label="Pagination">
            <Pagination currentPage={page} totalPages={10} onPageChange={setPage} />
          </Example>
        </Section>

        <Section id="overlays" title="Overlays">
          <OverlayDemos t={t} />
        </Section>

        <Section id="empty" title="Empty state">
          <Card variant="ghost" padding="none">
            <EmptyState
              icon="wishlist"
              title="No favourites yet"
              description="Save the pieces you love and find them here later."
              action={<Button leftIcon="products">Browse collection</Button>}
            />
          </Card>
        </Section>

        <Section id="skeletons" title="Loading states">
          <Example label="Skeleton shapes">
            <div className="w-full max-w-md space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" className="h-10 w-10" />
                <Skeleton variant="rectangular" className="h-10 flex-1" />
              </div>
            </div>
          </Example>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">Card & list</p>
              <div className="space-y-6">
                <div className="max-w-56">
                  <ProductCardSkeleton />
                </div>
                <ListSkeleton items={3} />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">Table</p>
                <TableSkeleton rows={3} columns={3} />
              </div>
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">Form</p>
                <FormSkeleton fields={2} />
              </div>
            </div>
          </div>
        </Section>

        <Section id="cards" title="Cards">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Default card</CardTitle>
                <CardDescription>Bordered surface with no shadow.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">Body content sits on the base surface token.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
                <Button size="sm" variant="ghost">Cancel</Button>
              </CardFooter>
            </Card>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated card</CardTitle>
                <CardDescription>Raised with a soft shadow.</CardDescription>
              </CardHeader>
              <CardContent>
                <Price value={8999} originalValue={9999} showDiscount />
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardHeader>
                <CardTitle>Outlined card</CardTitle>
                <CardDescription>Stronger 2px border.</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="primary">Featured</Badge>
              </CardContent>
            </Card>
          </div>
        </Section>
      </main>
    </div>
  );
}

export function DesignSystemShowcase() {
  return (
    <ToastProvider position="top-right">
      <Showcase />
    </ToastProvider>
  );
}
