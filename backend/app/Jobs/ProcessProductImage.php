<?php

namespace App\Jobs;

use App\Models\ProductImage;
use App\Models\ProductImageCleanup;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;
use Throwable;

class ProcessProductImage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public int $imageId,
        public ?int $replacesImageId = null,
    ) {}

    public function handle(): void
    {
        $image = ProductImage::find($this->imageId);

        if (! $image || $image->processing_status !== 'pending') {
            return;
        }

        $disk = Storage::disk($image->disk);
        $original = $disk->get($image->path);
        $variants = [];

        foreach (config('product-images.variants') as $name => $width) {
            $variantPath = sprintf(
                'products/%s/images/%s/%s.webp',
                $image->product_id,
                $image->id,
                $name,
            );

            $encoded = Image::read($original)
                ->orient()
                ->scaleDown(width: $width)
                ->toWebp(quality: config('product-images.webp_quality'));

            $disk->put($variantPath, $encoded->toString());

            $variants[$name] = $variantPath;
        }

        DB::transaction(function () use ($image, $variants) {
            $image = ProductImage::query()
                ->whereKey($image->id)
                ->lockForUpdate()
                ->first();

            if (! $image || $image->processing_status !== 'pending') {
                return;
            }

            $image->update([
                'variants' => $variants,
                'processing_status' => 'ready',
            ]);

            if (! $this->replacesImageId) {
                if (! ProductImage::query()
                    ->where('product_id', $image->product_id)
                    ->where('processing_status', 'ready')
                    ->where('is_primary', true)
                    ->whereKeyNot($image->id)
                    ->exists()) {
                    $image->update(['is_primary' => true]);
                }

                return;
            }

            $oldImage = ProductImage::query()
                ->where('product_id', $image->product_id)
                ->whereKey($this->replacesImageId)
                ->lockForUpdate()
                ->first();

            if (! $oldImage) {
                return;
            }

            $wasPrimary = $oldImage->is_primary;

            $paths = array_values(array_filter([
                $oldImage->path,
                ...array_values($oldImage->variants ?? []),
            ]));

            $oldImage->delete();

            ProductImageCleanup::create([
                'disk' => $oldImage->disk,
                'paths' => $paths,
                'delete_after' => now()->addDays(
                    config('product-images.retention_days')
                ),
            ]);

            if ($wasPrimary) {
                $image->update(['is_primary' => true]);
            }
        });
    }

    public function failed(?Throwable $exception): void
    {
        ProductImage::query()
            ->whereKey($this->imageId)
            ->where('processing_status', 'pending')
            ->update(['processing_status' => 'failed']);
    }
}
