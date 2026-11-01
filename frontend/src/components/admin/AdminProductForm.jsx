'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Switch } from '@/components/ui/forms/Switch';
import { ConfirmDialog } from '@/components/ui/overlays/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/feedback/ToastProvider';
import {
  AdminPageHeader,
  AdminPermissionDenied,
} from '@/components/admin/shared/AdminPageHeader';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  formatProductPrice,
  getCategoryName,
  getTranslation,
  resolveMediaUrl,
} from '@/lib/product';
import {
  adminCategoryService,
  adminProductService,
} from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const STEPS = ['basics', 'pricing', 'translations', 'images'];

const emptyForm = {
  sku: '',
  category_id: '',
  price: '',
  stock: '0',
  is_active: true,
  name_en: '',
  name_ar: '',
  description_en: '',
  description_ar: '',
};

function flattenCategories(categories, depth = 0) {
  return (categories || []).flatMap((category) => [
    { ...category, depth },
    ...flattenCategories(category.children, depth + 1),
  ]);
}

export function AdminProductForm({ productId = null }) {
  const isEdit = Boolean(productId);
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('products.view');
  const canCreate = hasPermission('products.create');
  const canEdit = hasPermission('products.update');
  const canDelete = hasPermission('products.delete');
  const canUploadImages = canEdit;

  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [deletingImage, setDeletingImage] = useState(false);
  const [altDrafts, setAltDrafts] = useState({});
  const fileInputRef = useRef(null);

  const allowed = isEdit ? canEdit : canCreate;

  useEffect(() => {
    let cancelled = false;

    adminCategoryService
      .list({}, {})
      .then((response) => {
        if (cancelled) return;
        setCategories(response?.data || []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit) return undefined;

    let cancelled = false;

    adminProductService
      .get(productId)
      .then((response) => {
        if (cancelled) return;

        const data = response?.data || response;
        const en = getTranslation(data.translations, 'en');
        const ar = getTranslation(data.translations, 'ar');

        setProduct(data);
        setForm({
          sku: data.sku || '',
          category_id: data.category_id ? String(data.category_id) : '',
          price: String(data.price ?? ''),
          stock: String(data.stock ?? 0),
          is_active: Boolean(data.is_active),
          name_en: en?.name || '',
          name_ar: ar?.name || '',
          description_en: en?.description || '',
          description_ar: ar?.description || '',
        });
        setLoadError(null);
      })
      .catch((requestError) => {
        if (!cancelled) setLoadError(requestError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, productId]);

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('productNoCategory') },
      ...flattenCategories(categories).map((category) => ({
        value: String(category.id),
        label: `${'— '.repeat(category.depth)}${getCategoryName(
          category,
          locale
        )}`,
      })),
    ],
    [categories, locale, t]
  );

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validateStep = (currentStep) => {
    const errors = {};

    if (currentStep === 0 && !form.name_en.trim()) {
      errors.name_en = t('productRequiredField');
    }

    if (currentStep === 1) {
      if (form.price === '' || Number(form.price) < 0) {
        errors.price = t('productRequiredField');
      }
      if (form.stock === '' || Number(form.stock) < 0) {
        errors.stock = t('productRequiredField');
      }
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const buildPayload = () => {
    const translations = [
      {
        locale: 'en',
        name: form.name_en.trim(),
        description: form.description_en.trim() || null,
      },
    ];

    if (form.name_ar.trim()) {
      translations.push({
        locale: 'ar',
        name: form.name_ar.trim(),
        description: form.description_ar.trim() || null,
      });
    }

    return {
      sku: form.sku.trim() || null,
      category_id: form.category_id ? Number(form.category_id) : null,
      price: Number(form.price),
      stock: Number(form.stock),
      is_active: form.is_active,
      translations,
    };
  };

  const handleServerErrors = (requestError) => {
    setFormError(requestError);

    if (requestError?.errors) {
      const mapped = {};

      Object.entries(requestError.errors).forEach(([key, messages]) => {
        if (key.includes('translations') && key.includes('name')) {
          mapped[key.includes('.ar.') ? 'name_ar' : 'name_en'] = messages[0];
        } else if (key === 'price') {
          mapped.price = messages[0];
        } else if (key === 'stock') {
          mapped.stock = messages[0];
        } else if (key === 'sku') {
          mapped.sku = messages[0];
        }
      });

      setFieldErrors(mapped);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) {
      setStep(1);
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const payload = buildPayload();

      if (isEdit) {
        await adminProductService.update(productId, payload);
        toast({ variant: 'success', description: t('productUpdated') });
        router.refresh();
        const refreshed = await adminProductService.get(productId);
        setProduct(refreshed?.data || refreshed);
      } else {
        const response = await adminProductService.create(payload);
        const created = response?.data || response;
        toast({ variant: 'success', description: t('productCreated') });
        router.push(`/${locale}/admin/products/${created.id}/edit`);
      }
    } catch (requestError) {
      handleServerErrors(requestError);
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(
          requestError,
          tCommon,
          t('productValidationError')
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const reloadProduct = async () => {
    const refreshed = await adminProductService.get(productId);
    setProduct(refreshed?.data || refreshed);
    setAltDrafts({});
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !isEdit) return;

    setUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('images[]', file));
      await adminProductService.uploadImages(productId, formData);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await reloadProduct();
      toast({ variant: 'success', description: t('productImageUpload') });
    } catch (requestError) {
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(
          requestError,
          tCommon,
          t('loadErrorText')
        ),
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await adminProductService.updateImage(productId, imageId, {
        is_primary: true,
      });
      await reloadProduct();
    } catch (requestError) {
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(requestError, tCommon, t('loadErrorText')),
      });
    }
  };

  const handleSaveAlt = async (imageId) => {
    try {
      await adminProductService.updateImage(productId, imageId, {
        alt: altDrafts[imageId] ?? '',
      });
      await reloadProduct();
      toast({ variant: 'success', description: t('savedSuccessfully') });
    } catch (requestError) {
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(requestError, tCommon, t('loadErrorText')),
      });
    }
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;

    setDeletingImage(true);

    try {
      await adminProductService.deleteImage(productId, imageToDelete.id);
      setImageToDelete(null);
      await reloadProduct();
    } catch (requestError) {
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(requestError, tCommon, t('loadErrorText')),
      });
    } finally {
      setDeletingImage(false);
    }
  };

  if (!allowed) {
    return (
      <AdminPermissionDenied
        title={t('noAccessTitle')}
        description={t('noAccessText')}
      />
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4" aria-hidden="true">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-6 w-80" />
        <Skeleton className="h-64 w-full" rounded="rounded-xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert
          variant="destructive"
          title={t('loadErrorTitle')}
          description={getApiErrorMessage(loadError, tCommon, t('loadErrorText'))}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
          >
            {tCommon('retry')}
          </Button>
        </Alert>
      </div>
    );
  }

  const images = product?.images || [];

  const stepLabels = [
    t('productStepBasics'),
    t('productStepPricing'),
    t('productStepTranslations'),
    t('productStepImages'),
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        title={isEdit ? t('productEdit') : t('productCreate')}
        description={
          isEdit ? t('productEditDescription') : t('productCreateDescription')
        }
        actions={
          <Link
            href={`/${locale}/admin/products`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {tCommon('back')}
          </Link>
        }
      />

      <ol className="mb-6 flex flex-wrap gap-2" aria-label={t('productCreate')}>
        {stepLabels.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => {
                if (index <= step || validateStep(step)) setStep(index);
              }}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                index === step
                  ? 'bg-primary text-primary-on'
                  : index < step
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-sunken text-text-secondary'
              }`}
              aria-current={index === step ? 'step' : undefined}
            >
              <span aria-hidden="true">{index + 1}</span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      {formError && Object.keys(fieldErrors).length === 0 && (
        <div className="mb-4">
          <Alert
            variant="destructive"
            title={t('productValidationError')}
            description={getApiErrorMessage(formError, tCommon)}
          />
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-5">
        {step === 0 && (
          <div className="space-y-4">
            <Input
              label={t('productFieldNameEn')}
              value={form.name_en}
              onChange={(event) => updateField('name_en', event.target.value)}
              error={fieldErrors.name_en}
              hint={t('productFieldSlugHint')}
              required
            />
            <Input
              label={t('productFieldNameAr')}
              value={form.name_ar}
              onChange={(event) => updateField('name_ar', event.target.value)}
              error={fieldErrors.name_ar}
              dir="rtl"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('productFieldSku')}
                value={form.sku}
                onChange={(event) => updateField('sku', event.target.value)}
                error={fieldErrors.sku}
              />
              <Select
                label={t('productFieldCategory')}
                value={form.category_id}
                options={categoryOptions}
                onChange={(event) =>
                  updateField('category_id', event.target.value)
                }
              />
            </div>
            <Switch
              checked={form.is_active}
              onChange={(event) =>
                updateField('is_active', event.target.checked)
              }
              label={t('productFieldActive')}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('productFieldPrice')}
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => updateField('price', event.target.value)}
                error={fieldErrors.price}
                required
              />
              <Input
                label={t('productFieldStock')}
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => updateField('stock', event.target.value)}
                error={fieldErrors.stock}
                required
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Textarea
              label={t('productFieldDescriptionEn')}
              value={form.description_en}
              onChange={(event) =>
                updateField('description_en', event.target.value)
              }
            />
            <Textarea
              label={t('productFieldDescriptionAr')}
              value={form.description_ar}
              onChange={(event) =>
                updateField('description_ar', event.target.value)
              }
              dir="rtl"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {!isEdit ? (
              <Alert
                variant="info"
                title={t('productStepImages')}
                description={t('productImagePending')}
              />
            ) : (
              <>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(event) =>
                        setSelectedFiles(Array.from(event.target.files || []))
                      }
                      className="block w-full max-w-md text-sm text-text-secondary file:me-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
                      aria-label={t('productImageUpload')}
                      disabled={!canUploadImages || uploading}
                    />
                    <Button
                      size="sm"
                      onClick={handleUpload}
                      loading={uploading}
                      disabled={selectedFiles.length === 0 || !canUploadImages}
                    >
                      {t('productImageUpload')}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-text-tertiary">
                    {t('productImageUploadHint')}
                  </p>
                </div>

                {images.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-tertiary">
                    {t('productImageEmpty')}
                  </p>
                ) : (
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {images.map((image) => (
                      <li
                        key={image.id}
                        className="rounded-xl border border-border p-3"
                      >
                        <div className="relative overflow-hidden rounded-lg bg-surface-sunken">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              resolveMediaUrl(
                                image.variants?.card || image.url || image.path
                              ) || ''
                            }
                            alt={image.alt || ''}
                            className="aspect-square w-full object-cover"
                          />
                          <div className="absolute start-2 top-2 flex gap-1">
                            {image.is_primary && (
                              <Badge variant="primary" size="xs">
                                {t('productImagePrimary')}
                              </Badge>
                            )}
                            <Badge
                              variant={
                                image.processing_status === 'ready'
                                  ? 'success'
                                  : image.processing_status === 'failed'
                                    ? 'destructive'
                                    : 'warning'
                              }
                              size="xs"
                            >
                              {image.processing_status === 'ready'
                                ? t('productImageReady')
                                : image.processing_status === 'failed'
                                  ? t('productImageFailed')
                                  : t('productImageProcessing')}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <Input
                            label={t('productImageAlt')}
                            value={altDrafts[image.id] ?? image.alt ?? ''}
                            onChange={(event) =>
                              setAltDrafts((current) => ({
                                ...current,
                                [image.id]: event.target.value,
                              }))
                            }
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleSaveAlt(image.id)}
                            >
                              {t('productImageSaveAlt')}
                            </Button>
                            {!image.is_primary && (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleSetPrimary(image.id)}
                              >
                                {t('productImageSetPrimary')}
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                size="xs"
                                variant="ghost"
                                className="text-error"
                                onClick={() => setImageToDelete(image)}
                              >
                                {t('productImageDelete')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          disabled={step === 0 || saving}
        >
          {t('productStepBack')}
        </Button>

        <div className="flex items-center gap-2">
          {step < STEPS.length - 1 && (
            <Button onClick={goNext} disabled={saving}>
              {t('productStepNext')}
            </Button>
          )}
          <Button onClick={handleSubmit} loading={saving}>
            {t('productSubmit')}
          </Button>
        </div>
      </div>

      {isEdit && form.price !== '' && (
        <p className="mt-3 text-sm text-text-tertiary">
          {formatProductPrice(form.price, locale)}
        </p>
      )}

      <ConfirmDialog
        isOpen={Boolean(imageToDelete)}
        onClose={() => setImageToDelete(null)}
        onConfirm={handleDeleteImage}
        title={t('confirmTitle')}
        description={t('confirmDeleteText')}
        confirmText={tCommon('delete')}
        cancelText={tCommon('cancel')}
        variant="destructive"
        isLoading={deletingImage}
      />
    </div>
  );
}

export default AdminProductForm;
