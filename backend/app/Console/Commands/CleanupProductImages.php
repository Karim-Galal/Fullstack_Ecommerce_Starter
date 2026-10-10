<?php

namespace App\Console\Commands;

use App\Models\ProductImageCleanup;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Throwable;

class CleanupProductImages extends Command
{
    protected $signature = 'product-images:cleanup';

    protected $description = 'Permanently delete expired product image files.';

    public function handle(): int
    {
        ProductImageCleanup::query()
            ->where('delete_after', '<=', now())
            ->orderBy('id')
            ->chunkById(100, function ($cleanups) {
              /** @var ProductImageCleanup $cleanup */
                foreach ($cleanups as $cleanup) {
                    try {
                        $disk = Storage::disk($cleanup->disk);

                        foreach ($cleanup->paths as $path) {
                            if ($path !== '') {
                                $disk->delete($path);
                            }
                        }

                        $cleanup->delete();
                    } catch (Throwable $exception) {
                        $cleanup->increment('attempts');

                        $cleanup->update([
                            'last_error' => mb_substr(
                                $exception->getMessage(),
                                0,
                                5000,
                            ),
                        ]);

                        report($exception);
                    }
                }
            });

        return self::SUCCESS;
    }
}
