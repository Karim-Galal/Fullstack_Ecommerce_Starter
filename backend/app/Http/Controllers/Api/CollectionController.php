<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCollectionRequest;
use App\Http\Requests\UpdateCollectionRequest;
use App\Http\Resources\CollectionResource;
use App\Models\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CollectionController extends Controller
{
    public function index()
    {
        $collections = Collection::where('is_active', true)
            ->with([
                'translations',
                'products.translations',
                'products.images',
            ])
            ->orderBy('sort_order')
            ->paginate(20);

        return CollectionResource::collection($collections);
    }

    public function show(string $identifier)
    {
        $id = (int) Str::afterLast($identifier, '-');
        $slug = Str::beforeLast($identifier, '-');

        $collection = Collection::with([
            'translations',
            'products' => fn ($query) => $query
                ->where('is_active', true)
                ->with([
                    'translations',
                    'images',
                ]),
        ])
            ->where([
                'id' => $id,
                'slug' => $slug,
                'is_active' => true,
            ])
            ->firstOrFail();

        return new CollectionResource($collection);
    }

    public function adminIndex()
    {
        $this->authorize('viewAny', Collection::class);

        return CollectionResource::collection(
            Collection::with([
                'translations',
                'products',
            ])
                ->withTrashed()
                ->orderBy('sort_order')
                ->paginate(30)
        );
    }

    public function adminShow(Collection $collection)
    {
        $this->authorize('view', $collection);

        return new CollectionResource(
            $collection->load([
                'translations',
                'products.translations',
                'products.images',
            ])
        );
    }

    public function store(StoreCollectionRequest $request)
    {
        $this->authorize('create', Collection::class);

        $data = $request->validated();
        $translations = $data['translations'];

        $slug = $data['slug'] ?? null;

        if ($slug === null) {
            $slug = $this->generateSlugFromEnglishTranslation(
                $translations
            );
        }

        unset($data['translations']);

        $collection = DB::transaction(function () use ($data, $translations, $slug) {
            $collection = Collection::create([
                ...$data,
                'slug' => $slug,
            ]);

            $collection->translations()->createMany($translations);

            return $collection;
        });

        return (new CollectionResource(
            $collection->load('translations')
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function update(
        UpdateCollectionRequest $request,
        Collection $collection
    ) {
        $this->authorize('update', $collection);

        $data = $request->validated();
        $translations = $data['translations'] ?? null;

        if (array_key_exists('slug', $data)) {
            $this->validateSlug($data['slug'], $collection);
        } elseif ($translations !== null && $this->hasEnglishTranslation($translations)) {
            $data['slug'] = $this->generateSlugFromEnglishTranslation(
                $translations
            );
        }

        unset($data['translations']);

        $collection = DB::transaction(function () use (
            $collection,
            $data,
            $translations
        ) {
            $collection->update($data);

            if ($translations !== null) {
                foreach ($translations as $translation) {
                    $collection->translations()->updateOrCreate(
                        [
                            'locale' => $translation['locale'],
                        ],
                        [
                            'name' => $translation['name'],
                            'description' => $translation['description'] ?? null,
                            'meta_title' => $translation['meta_title'] ?? null,
                            'meta_description' => $translation['meta_description'] ?? null,
                        ]
                    );
                }
            }

            return $collection;
        });

        return new CollectionResource(
            $collection->load('translations')
        );
    }

    public function destroy(Collection $collection)
    {
        $this->authorize('delete', $collection);

        $collection->delete();

        return response()->noContent();
    }

    private function generateSlugFromEnglishTranslation(
        array $translations
    ): string {
        foreach ($translations as $translation) {
            if ($translation['locale'] === 'en') {
                return Str::slug($translation['name']);
            }
        }

        throw ValidationException::withMessages([
            'translations' => [
                'An English translation is required when a slug is not provided.',
            ],
        ]);
    }

    private function hasEnglishTranslation(array $translations): bool
    {
        foreach ($translations as $translation) {
            if ($translation['locale'] === 'en') {
                return true;
            }
        }

        return false;
    }

    private function validateSlug(
        ?string $slug,
        ?Collection $collection = null
    ): void {
        if ($slug === null) {
            return;
        }

        if ($slug !== Str::slug($slug)) {
            throw ValidationException::withMessages([
                'slug' => ['Invalid slug format.'],
            ]);
        }

        $existing = Collection::where('slug', $slug);

        if ($collection) {
            $existing->where('id', '!=', $collection->id);
        }

        if ($existing->exists()) {
            throw ValidationException::withMessages([
                'slug' => ['Slug already exists.'],
            ]);
        }
    }
}

