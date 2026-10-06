<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ModerateReviewRequest;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Requests\UpdateReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $productId = $request->integer('product_id');

        $reviews = Review::query()
            ->where('status', 'approved')
            ->when($productId, function ($query) use ($productId) {
                $query->where('product_id', $productId);
            })
            ->with('user')
            ->latest()
            ->paginate(20);

        return ReviewResource::collection($reviews);
    }

    public function store(StoreReviewRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        $hasPurchased = $user->orders()
            ->where('status', 'confirmed')
            ->whereHas('items', function ($query) use ($data) {
                $query->where('product_id', $data['product_id']);
            })
            ->exists();

        if (! $hasPurchased) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'You can only review products you have purchased.',
                ],
            ]);
        }

        $existingReview = Review::query()
            ->where('product_id', $data['product_id'])
            ->where('user_id', $user->id)
            ->exists();

        if ($existingReview) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'You have already reviewed this product.',
                ],
            ]);
        }

        $review = Review::create([
            'product_id' => $data['product_id'],
            'user_id' => $user->id,
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
            'status' => 'pending',
        ]);

        return (new ReviewResource(
            $review->load('user', 'product')
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function myReviews(Request $request)
    {
        $reviews = Review::query()
            ->where('user_id', $request->user()->id)
            ->with('product')
            ->latest()
            ->paginate(20);

        return ReviewResource::collection($reviews);
    }

    public function show(Review $review)
    {
        $this->authorize('view', $review);

        return new ReviewResource(
            $review->load('user', 'product')
        );
    }

    public function update(
        UpdateReviewRequest $request,
        Review $review
    ) {
        $this->authorize('update', $review);

        $data = $request->validated();

        $review->update([
            ...$data,
            'status' => 'pending',
        ]);

        return new ReviewResource(
            $review->fresh()->load('user', 'product')
        );
    }

    public function destroy(Review $review)
    {
        $this->authorize('delete', $review);

        $review->delete();

        return response()->noContent();
    }

    public function adminIndex()
    {
        $this->authorize('viewAny', Review::class);

        return ReviewResource::collection(
            Review::withTrashed()
                ->with('user', 'product')
                ->latest()
                ->paginate(30)
        );
    }

    public function moderate(
        ModerateReviewRequest $request,
        Review $review
    ) {
        $this->authorize('moderate', $review);

        $review->update([
            'status' => $request->validated()['status'],
        ]);

        return new ReviewResource(
            $review->fresh()->load('user', 'product')
        );
    }
}
