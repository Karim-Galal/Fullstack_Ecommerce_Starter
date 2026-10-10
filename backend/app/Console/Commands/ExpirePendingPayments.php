<?php

namespace App\Console\Commands;

use App\Jobs\PaymentExpirationJob;
use App\Models\Payment;
use Illuminate\Console\Command;

class ExpirePendingPayments extends Command
{
    protected $signature = 'payments:expire-pending';

    protected $description = 'Find pending payments that have expired and expire them';

    public function handle(): int
    {
        $expiredPayments = Payment::with('order.items.product')
            ->where('status', 'pending')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->get();

        if ($expiredPayments->isEmpty()) {
            $this->info('No expired pending payments found.');

            return Command::SUCCESS;
        }

        $this->info("Found {$expiredPayments->count()} expired pending payments.");

        $bar = $this->output->createProgressBar($expiredPayments->count());
        $bar->start();

        $processed = 0;
        foreach ($expiredPayments as $payment) {
            try {
                PaymentExpirationJob::dispatchSync($payment->id);
                $processed++;
            } catch (\Throwable $e) {
                $this->error("Failed to expire payment {$payment->id}: {$e->getMessage()}");
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Processed {$processed} expired payments.");

        return Command::SUCCESS;
    }
}
