<?php

namespace Database\Seeders;

use App\Models\Collection;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CollectionSeeder extends Seeder
{
    public function run(): void
    {
        $collections = [
            [
                'slug' => 'summer-essentials',
                'sort_order' => 1,
                'is_active' => true,
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'Summer Essentials',
                        'description' => 'Everything you need for the perfect summer.',
                        'meta_title' => 'Summer Essentials',
                        'meta_description' => 'Shop summer essentials including clothing, accessories, and more.',
                    ],
                    [
                        'locale' => 'ar',
                        'name' => 'أساسيات الصيف',
                        'description' => 'كل ما تحتاجه لصيف مثالي.',
                        'meta_title' => 'أساسيات الصيف',
                        'meta_description' => 'تسوق أساسيات الصيف بما في ذلك الملابس والإكسسوارات والمزيد.',
                    ],
                ],
            ],
            [
                'slug' => 'winter-collection',
                'sort_order' => 2,
                'is_active' => true,
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'Winter Collection',
                        'description' => 'Stay warm and stylish with our winter collection.',
                        'meta_title' => 'Winter Collection',
                        'meta_description' => 'Winter clothing and accessories for cold weather.',
                    ],
                    [
                        'locale' => 'ar',
                        'name' => 'مجموعة الشتاء',
                        'description' => 'ابقَ دافئًا وأنيقًا مع مجموعة الشتاء الخاصة بنا.',
                        'meta_title' => 'مجموعة الشتاء',
                        'meta_description' => 'ملابس وإكسسوارات شتوية للطقس البارد.',
                    ],
                ],
            ],
            [
                'slug' => 'electronics-gadgets',
                'sort_order' => 3,
                'is_active' => true,
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'Electronics & Gadgets',
                        'description' => 'Latest electronics and cool gadgets.',
                        'meta_title' => 'Electronics & Gadgets',
                        'meta_description' => 'Discover the latest electronics and innovative gadgets.',
                    ],
                    [
                        'locale' => 'ar',
                        'name' => 'الإلكترونيات والأجهزة',
                        'description' => 'أحدث الإلكترونيات والأجهزة الرائعة.',
                        'meta_title' => 'الإلكترونيات والأجهزة',
                        'meta_description' => 'اكتشف أحدث الإلكترونيات والأجهزة المبتكرة.',
                    ],
                ],
            ],
            [
                'slug' => 'footwear-sale',
                'sort_order' => 4,
                'is_active' => false,
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'Footwear Sale',
                        'description' => 'Great deals on shoes and footwear.',
                        'meta_title' => 'Footwear Sale',
                        'meta_description' => 'Discounted shoes, sneakers, and footwear.',
                    ],
                    [
                        'locale' => 'ar',
                        'name' => 'تخفيضات الأحذية',
                        'description' => 'عروض رائعة على الأحذية.',
                        'meta_title' => 'تخفيضات الأحذية',
                        'meta_description' => 'أحذية رياضية وأحذية مخفضة.',
                    ],
                ],
            ],
        ];

        foreach ($collections as $collectionData) {
            $translations = $collectionData['translations'];
            unset($collectionData['translations']);

            $collection = Collection::updateOrCreate(
                ['slug' => $collectionData['slug']],
                $collectionData
            );

            foreach ($translations as $translation) {
                $collection->translations()->updateOrCreate(
                    ['locale' => $translation['locale']],
                    $translation
                );
            }
        }

        // Associate products with collections
        $summerCollection = Collection::where('slug', 'summer-essentials')->first();
        $winterCollection = Collection::where('slug', 'winter-collection')->first();
        $electronicsCollection = Collection::where('slug', 'electronics-gadgets')->first();

        if ($summerCollection) {
            $summerProducts = Product::whereIn('slug', [
                'classic-cotton-t-shirt',
                'floral-summer-dress',
                'canvas-sneakers',
            ])->get();
            $summerCollection->products()->syncWithoutDetaching($summerProducts->pluck('id'));
        }

        if ($winterCollection) {
            $winterProducts = Product::whereIn('slug', [
                'wool-blend-sweater',
                'leather-casual-loafers',
            ])->get();
            $winterCollection->products()->syncWithoutDetaching($winterProducts->pluck('id'));
        }

        if ($electronicsCollection) {
            $electronicsProducts = Product::whereIn('slug', [
                'wireless-headphones-x1',
                'usb-c-charging-cable-2m',
                'running-sneakers-pro',
            ])->get();
            $electronicsCollection->products()->syncWithoutDetaching($electronicsProducts->pluck('id'));
        }
    }
}