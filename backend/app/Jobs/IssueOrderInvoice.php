<?php

namespace App\Jobs;

use App\Models\InvoiceIssuance;
use App\Models\Order;
use App\Services\InvoiceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class IssueOrderInvoice implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 5;

    public array $backoff = [60, 300, 900, 1800];

    public int $uniqueFor = 3600;

    public function __construct(public int $issuanceId) {}

    public function uniqueId(): string
    {
        return (string) $this->issuanceId;
    }

    public function handle(InvoiceService $invoices): void
    {
        $issuance = InvoiceIssuance::find($this->issuanceId);

        if (! $issuance) {
            Log::warning('IssueOrderInvoice: Issuance not found', [
                'issuance_id' => $this->issuanceId,
            ]);

            return;
        }

        if ($issuance->status === InvoiceIssuance::STATUS_ISSUED) {
            return;
        }

        try {
            $order = Order::withTrashed()->find($issuance->order_id);

            if (! $order) {
                throw new RuntimeException('Invoice issuance order not found.');
            }

            $invoice = $invoices->issueForOrder($order);

            $issuance->markIssued($invoice->issued_at);
        } catch (Throwable $exception) {
            Log::error('IssueOrderInvoice: Failed to issue invoice', [
                'issuance_id' => $issuance->id,
                'order_id' => $issuance->order_id,
                'attempts' => $issuance->attempts + 1,
                'error' => $exception->getMessage(),
            ]);

            $issuance->recordFailure($exception);

            throw $exception;
        }
    }
}
