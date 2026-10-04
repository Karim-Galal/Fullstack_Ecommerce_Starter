<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductTranslation;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'men' => Category::where('slug', 'men')->firstOrFail(),
            'women' => Category::where('slug', 'women')->firstOrFail(),
            'shoes' => Category::where('slug', 'shoes')->firstOrFail(),
            'electronics' => Category::where('slug', 'electronics')->firstOrFail(),
            'men-shoes' => Category::where('slug', 'men-shoes')->firstOrFail(),
            'women-shoes' => Category::where('slug', 'women-shoes')->firstOrFail(),
        ];

        $products = [
            // A. Normal active product
            [
                'sku' => 'PROD-001',
                'slug' => 'classic-cotton-t-shirt',
                'category_slug' => 'men',
                'price' => 99.99,
                'stock' => 50,
                'is_active' => true,
                'translations' => [
                    'en' => [
                        'name' => 'Classic Cotton T-Shirt',
                        'description' => 'Comfortable cotton t-shirt for everyday use.',
                        'meta_title' => 'Classic Cotton T-Shirt',
                        'meta_description' => 'Comfortable cotton t-shirt for everyday use.',
                    ],
                    'ar' => [
                        'name' => 'تيشيرت قطني كلاسيكي',
                        'description' => 'تيشيرت قطني مريح للاستخدام اليومي.',
                        'meta_title' => 'تيشيرت قطني كلاسيكي',
                        'meta_description' => 'تيشيرت قطني مريح للاستخدام اليومي.',
                    ],
                ],
            ],
            // B. Active low-stock product
            [
                'sku' => 'PROD-002',
                'slug' => 'floral-summer-dress',
                'category_slug' => 'women',
                'price' => 149.50,
                'stock' => 3,
                'is_active' => true,
                'translations' => [
                    'en' => [
                        'name' => 'Floral Summer Dress',
                        'description' => 'Light and airy floral dress perfect for summer.',
                        'meta_title' => 'Floral Summer Dress',
                        'meta_description' => 'Light and airy floral dress perfect for summer.',
                    ],
                    'ar' => [
                        'name' => 'فستان صيفي بنقشة زهور',
                        'description' => 'فستان خفيف ومهوّج بنقشة زهور مثالي للصيف.',
                        'meta_title' => 'فستان صيفي بنقشة زهور',
                        'meta_description' => 'فستان خفيف ومهوّج بنقشة زهور مثالي للصيف.',
                    ],
                ],
            ],
            // C. Active out-of-stock product
            [
                'sku' => 'PROD-003',
                'slug' => 'running-sneakers-pro',
                'category_slug' => 'shoes',
                'price' => 199.00,
                'stock' => 0,
                'is_active' => true,
                'translations' => [
                    'en' => [
                        'name' => 'Running Sneakers Pro',
                        'description' => 'Professional running sneakers with advanced cushioning.',
                        'meta_title' => 'Running Sneakers Pro',
                        'meta_description' => 'Professional running sneakers with advanced cushioning.',
                    ],
                    'ar' => [
                        'name' => 'حذاء جري احترافي برو',
                        'description' => 'حذاء جري احترافي مع توسيد متقدم.',
                        'meta_title' => 'حذاء جري احترافي برو',
                        'meta_description' => 'حذاء جري احترافي مع توسيد متقدم.',
                    ],
                ],
            ],
            // D. Inactive product
            [
                'sku' => 'PROD-004',
                'slug' => 'wireless-headphones-x1',
                'category_slug' => 'electronics',
                'price' => 299.99,
                'stock' => 10,
                'is_active' => false,
                'translations' => [
                    'en' => [
                        'name' => 'Wireless Headphones X1',
                        'description' => 'Premium wireless headphones with noise cancellation.',
                        'meta_title' => 'Wireless Headphones X1',
                        'meta_description' => 'Premium wireless headphones with noise cancellation.',
                    ],
                    'ar' => [
                        'name' => 'سماعات لاسلكية X1',
                        'description' => 'سماعات لاسلكية مميزة مع إلغاء الضوضاء.',
                        'meta_title' => 'سماعات لاسلكية X1',
                        'meta_description' => 'سماعات لاسلكية مميزة مع إلغاء الضوضاء.',
                    ],
                ],
            ],
            // E. Additional products for testing cart behavior
            [
                'sku' => 'PROD-005',
                'slug' => 'leather-casual-loafers',
                'category_slug' => 'men-shoes',
                'price' => 89.99,
                'stock' => 25,
                'is_active' => true,
                'translations' => [
                    'en' => [
                        'name' => 'Leather Casual Loafers',
                        'description' => 'Genuine leather loafers for casual and formal wear.',
                        'meta_title' => 'Leather Casual Loafers',
                        'meta_description' => 'Genuine leather loafers for casual and formal wear.',
                    ],
                    'ar' => [
                        'name' => 'موكاسين جلدي كاجوال',
                        'description' => 'موكاسين من الجلد الطبيعي للمناسبات الرسمية والكاجوال.',
                        'meta_title' => 'موكاسين جلدي كاجوال',
                        'meta_description' => 'موكاسين من الجلد الطبيعي للمناسبات الرسمية والكاجوال.',
                    ],
                ],
            ],
            [
                'sku' => 'PROD-006',
                'slug' => 'canvas-sneakers',
                'category_slug' => 'women-shoes',
                'price' => 75.00,
                'stock' => 15,
                'is_active' => true,
                'translations' => [
                    'en' => [
                        'name' => 'Canvas Sneakers',
                        'description' => 'Lightweight canvas sneakers for daily wear.',
                        'meta_title' => 'Canvas Sneakers',
                        'meta_description' => 'Lightweight canvas sneakers for daily wear.',
                    ],
                    'ar' => [
                        'name' => 'حذاء قماشي رياضي',
                        'description' => 'حذاء رياضي خفيف من القماش للاستخدام اليومي.',
                        'meta_title' => 'حذاء قماشي رياضي',
                        'meta_description' => 'حذاء رياضي خفيف من القماش للاستخدام اليومي.',
                    ],
                ],
            ],
            [
                'sku' => 'PROD-007',
                'slug' => 'usb-c-charging-cable-2m',
                'category_slug' => 'electronics',
                'price' => 49.99,
                'stock' => 100,
                'is_active' => true,
                'translations' => [
                    'en' => [
                        'name' => 'USB-C Charging Cable 2m',
                        'description' => 'Fast charging USB-C cable, 2 meters length.',
                        'meta_title' => 'USB-C Charging Cable 2m',
                        'meta_description' => 'Fast charging USB-C cable, 2 meters length.',
                    ],
                    'ar' => [
                        'name' => 'كابل شحن USB-C بطول 2 متر',
                        'description' => 'كابل شحن سريع USB-C بطول 2 متر.',
                        'meta_title' => 'كابل شحن USB-C بطول 2 متر',
                        'meta_description' => 'كابل شحن سريع USB-C بطول 2 متر.',
                    ],
                ],
            ],
            [
                'sku' => 'PROD-008',
                'slug' => 'wool-blend-sweater',
                'category_slug' => 'men',
                'price' => 120.00,
                'stock' => 8,
                'is_active' => true,
                'translations' => [
                    'en' => [
                        'name' => 'Wool Blend Sweater',
                        'description' => 'Warm wool blend sweater for cold weather.',
                        'meta_title' => 'Wool Blend Sweater',
                        'meta_description' => 'Warm wool blend sweater for cold weather.',
                    ],
                    'ar' => [
                        'name' => 'سترة صوف ممزوج',
                        'description' => 'سترة دافئة من الصوف الممزوج للطقس البارد.',
                        'meta_title' => 'سترة صوف ممزوج',
                        'meta_description' => 'سترة دافئة من الصوف الممزوج للطقس البارد.',
                    ],
                ],
            ],
        ];

        foreach ($products as $productData) {
            $translations = $productData['translations'];
            $categorySlug = $productData['category_slug'];

            unset($productData['translations']);
            unset($productData['category_slug']);

            // Check if product already exists by SKU
            $product = Product::where('sku', $productData['sku'])->first();

            if (! $product) {
                $product = Product::create(array_merge($productData, [
                    'category_id' => $categories[$categorySlug]->id,
                ]));
            } else {
                $product->update(array_merge($productData, [
                    'category_id' => $categories[$categorySlug]->id,
                ]));
            }

            // Create or update translations
            foreach ($translations as $locale => $translation) {
                ProductTranslation::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'locale' => $locale,
                    ],
                    $translation
                );
            }
        }

        // Soft delete test product - use withTrashed() to find soft-deleted records
        $softDeleteProduct = Product::withTrashed()->where('sku', 'SOFT-DELETE-001')->first();

        if (! $softDeleteProduct) {
            // Create the product, its translations, then soft delete it
            $softDeleteProduct = Product::create([
                'sku' => 'SOFT-DELETE-001',
                'slug' => 'soft-delete-test-product',
                'category_id' => $categories['men']->id,
                'price' => 50.00,
                'stock' => 20,
                'is_active' => true,
            ]);

            // Create translations for soft delete test product
            foreach (['en', 'ar'] as $locale) {
                ProductTranslation::updateOrCreate(
                    [
                        'product_id' => $softDeleteProduct->id,
                        'locale' => $locale,
                    ],
                    [
                        'name' => $locale === 'en'
                            ? 'Soft Delete Test Product'
                            : 'منتج اختبار الحذف الناعم',
                        'description' => $locale === 'en'
                            ? 'This product is used to test soft delete functionality.'
                            : 'هذا المنتج يستخدم لاختبار وظيفة الحذف الناعم.',
                        'meta_title' => $locale === 'en'
                            ? 'Soft Delete Test Product'
                            : 'منتج اختبار الحذف الناعم',
                        'meta_description' => $locale === 'en'
                            ? 'This product is used to test soft delete functionality.'
                            : 'هذا المنتج يستخدم لاختبار وظيفة الحذف الناعم.',
                    ]
                );
            }

            // Soft delete it
            $softDeleteProduct->delete();
        } else {
            // Product exists - ensure it's soft deleted
            if (! $softDeleteProduct->trashed()) {
                $softDeleteProduct->delete();
            }
        }
    }
}
