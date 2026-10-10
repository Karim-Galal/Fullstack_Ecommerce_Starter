
<?php

return [
    'disk' => env('PRODUCT_IMAGES_DISK', 'public'),
    'max_upload_kb' => 10240,
    'max_batch_size' => 5,
    'retention_days' => 7,
    'variants' => [
        'thumbnail' => 300,
        'card' => 600,
        'detail' => 1200,
    ],
    'webp_quality' => 82,
];
