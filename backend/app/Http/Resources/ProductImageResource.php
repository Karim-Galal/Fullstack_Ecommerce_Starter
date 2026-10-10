<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Filesystem\FilesystemAdapter;

class ProductImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($this->disk ?? 'public');

        $variantUrls = [];

        foreach ($this->variants ?? [] as $name => $path) {
            $variantUrls[$name] = $disk->url($path);
        }

        return [
            'id' => $this->id,
            'path' => $this->path,
            'url' => $disk->url($this->path),
            'variants' => $variantUrls,
            'alt' => $this->alt,
            'sort_order' => $this->sort_order,
            'is_primary' => $this->is_primary,
            'processing_status' => $this->processing_status,
        ];
    }
}
