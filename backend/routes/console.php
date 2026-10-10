<?php

use App\Console\Commands\ExpirePendingPayments;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;


Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(ExpirePendingPayments::class)->everyMinute()->description('Expire pending payments and restore stock');
Schedule::command('product-images:cleanup')->hourly();
