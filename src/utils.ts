import type { PaymentState } from '@vendure/core';
import { RefundState } from '@vendure/core/dist/service/helpers/refund-state-machine/refund-state';
import type { TransacaoObject } from 'pagarme';

export function mapTransactionStatusToPaymentStatus(
  status: TransacaoObject['status']
): Exclude<PaymentState, 'Error'> {
  switch (status) {
    case 'processing':
      return 'Created';
    case 'authorized':
      return 'Authorized';
    case 'paid':
      return 'Settled';
    case 'refunded':
      return 'Settled';
    case 'waiting_payment':
      return 'Created';
    case 'pending_refund':
      return 'Settled';
    case 'refused':
      return 'Declined';
    case 'chargedback':
      return 'Settled';
    case 'analyzing':
      return 'Created';
    case 'pending_review':
      return 'Created';
    default:
      return 'Created';
  }
}

export function mapTransactionStatusToRefundStatus(
  status: TransacaoObject['status']
): RefundState {
  switch (status) {
    case 'paid':
      return 'Settled';
    case 'refunded':
      return 'Settled';
    case 'pending_refund':
      return 'Pending';
    case 'refused':
      return 'Failed';
    default:
      return 'Pending';
  }
}
