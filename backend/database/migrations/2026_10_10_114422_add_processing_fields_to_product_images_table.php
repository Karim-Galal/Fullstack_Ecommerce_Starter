
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_images', function (Blueprint $table) {
            $table->string('disk')->default('public')->after('path');
            $table->string('processing_status')->default('ready')->after('disk');
            $table->json('variants')->nullable()->after('processing_status');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('product_images', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn([
                'disk',
                'processing_status',
                'variants',
            ]);
        });
    }
};
