<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'slug' => 'men',
                'sort_order' => 1,
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'Men',
                        'description' => 'Products for men.',
                        'meta_title' => 'Men Products',
                        'meta_description' => 'Browse products for men.',
                    ],
                    [
                        'locale' => 'ar',
                        'name' => 'رجال',
                        'description' => 'منتجات للرجال.',
                        'meta_title' => 'منتجات الرجال',
                        'meta_description' => 'تصفح منتجات الرجال.',
                    ],
                ],
            ],
            [
                'slug' => 'women',
                'sort_order' => 2,
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'Women',
                        'description' => 'Products for women.',
                        'meta_title' => 'Women Products',
                        'meta_description' => 'Browse products for women.',
                    ],
                    [
                        'locale' => 'ar',
                        'name' => 'نساء',
                        'description' => 'منتجات للنساء.',
                        'meta_title' => 'منتجات النساء',
                        'meta_description' => 'تصفح منتجات النساء.',
                    ],
                ],
            ],
            [
                'slug' => 'shoes',
                'sort_order' => 3,
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'Shoes',
                        'description' => 'Shoes and footwear.',
                        'meta_title' => 'Shoes',
                        'meta_description' => 'Browse shoes and footwear.',
                    ],
                    [
                        'locale' => 'ar',
                        'name' => 'أحذية',
                        'description' => 'الأحذية ومستلزمات القدم.',
                        'meta_title' => 'أحذية',
                        'meta_description' => 'تصفح الأحذية ومستلزمات القدم.',
                    ],
                ],
            ],
            [
                'slug' => 'electronics',
                'sort_order' => 4,
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'Electronics',
                        'description' => 'Electronic products and accessories.',
                        'meta_title' => 'Electronics',
                        'meta_description' => 'Browse electronics and accessories.',
                    ],
                    [
                        'locale' => 'ar',
                        'name' => 'إلكترونيات',
                        'description' => 'المنتجات الإلكترونية وملحقاتها.',
                        'meta_title' => 'إلكترونيات',
                        'meta_description' => 'تصفح المنتجات الإلكترونية وملحقاتها.',
                    ],
                ],
            ],
        ];

        foreach ($categories as $categoryData) {
            $translations = $categoryData['translations'];

            unset($categoryData['translations']);

            $category = Category::create($categoryData);

            $category->translations()->createMany($translations);
        }

        $men = Category::where('slug', 'men')->firstOrFail();
        $women = Category::where('slug', 'women')->firstOrFail();

        $menShoes = Category::create([
            'parent_id' => $men->id,
            'slug' => 'men-shoes',
            'sort_order' => 1,
        ]);

        $menShoes->translations()->createMany([
            [
                'locale' => 'en',
                'name' => 'Men Shoes',
                'description' => 'Shoes for men.',
                'meta_title' => 'Men Shoes',
                'meta_description' => 'Browse shoes for men.',
            ],
            [
                'locale' => 'ar',
                'name' => 'أحذية رجالي',
                'description' => 'أحذية للرجال.',
                'meta_title' => 'أحذية رجالي',
                'meta_description' => 'تصفح الأحذية الرجالي.',
            ],
        ]);

        $womenShoes = Category::create([
            'parent_id' => $women->id,
            'slug' => 'women-shoes',
            'sort_order' => 1,
        ]);

        $womenShoes->translations()->createMany([
            [
                'locale' => 'en',
                'name' => 'Women Shoes',
                'description' => 'Shoes for women.',
                'meta_title' => 'Women Shoes',
                'meta_description' => 'Browse shoes for women.',
            ],
            [
                'locale' => 'ar',
                'name' => 'أحذية حريمي',
                'description' => 'أحذية للنساء.',
                'meta_title' => 'أحذية حريمي',
                'meta_description' => 'تصفح الأحذية الحريمي.',
            ],
        ]);
    }
}
