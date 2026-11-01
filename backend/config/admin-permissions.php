<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Assignable admin permissions
    |--------------------------------------------------------------------------
    |
    | Master admins bypass permission checks. Staff users receive an explicit
    | subset of these permissions. Keep this list aligned with the checks in
    | app/Policies. Unknown values are rejected by validation instead of being
    | silently stored, so a typo can never become an accidental wildcard.
    |
    */
    'permissions' => [
        'products.view',
        'products.create',
        'products.update',
        'products.delete',
        'categories.view',
        'categories.create',
        'categories.update',
        'categories.delete',
        'collections.view',
        'collections.create',
        'collections.update',
        'collections.delete',
        'offers.view',
        'offers.create',
        'offers.update',
        'offers.delete',
        'coupons.view',
        'coupons.create',
        'coupons.update',
        'coupons.delete',
        'reviews.view',
        'reviews.update',
        'reviews.delete',
        'shipping_methods.view',
        'shipping_methods.create',
        'shipping_methods.update',
        'shipping_methods.delete',
        'orders.view',
        'orders.update',
        'payments.view',
        'payments.refund',
        'invoices.view',
        'invoices.update',
        'users.view',
        'addresses.view',
        'addresses.update',
        'wishlists.view',
    ],
];
