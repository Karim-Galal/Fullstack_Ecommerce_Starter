<?php

namespace App\Console\Commands;

use App\Jobs\IssueOrderInvoice;
use App\Models\InvoiceIssuance;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class DispatchPendingInvoiceIssuances extends Command
{
    protected $signature = 'invoices:dispatch-pending {--limit=100 : Maximum number of issuances to dispatch}';

    protected $description = 'Dispatch durable invoice issuance work that is due for processing';

    public function handle(): int
    {
        $limit = max(1, (int) $this->option('limit'));

        $issuances = InvoiceIssuance::query()
            ->due()
            ->orderBy('id')
            ->limit($limit)
            ->get();

        if ($issuances->isEmpty()) {
            $this->info('No pending invoice issuances found.');

            return Command::SUCCESS;
        }

        $failures = 0;

        foreach ($issuances as $issuance) {
            try {
                IssueOrderInvoice::dispatch($issuance->id);
            } catch (Throwable $exception) {
                $failures++;

                Log::error('Failed to dispatch invoice issuance', [
                    'issuance_id' => $issuance->id,
                    'order_id' => $issuance->order_id,
                    'error' => $exception->getMessage(),
                ]);

                $this->error("Failed to dispatch invoice issuance {$issuance->id}: {$exception->getMessage()}");
            }
        }

        $dispatched = $issuances->count() - $failures;

        $this->info("Dispatched {$dispatched} invoice issuance(s).");

        return $failures === 0 ? Command::SUCCESS : Command::FAILURE;
    }
}
