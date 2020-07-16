import { Controller, Body, Headers, Post } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import {
  PaymentMethod,
  Payment,
  ID,
  Order,
  PaymentState,
  OrderService
} from '@vendure/core';
import pagarme, { Postback } from 'pagarme';
import { mapTransactionStatusToPaymentStatus } from './utils';
import { PaymentStateMachine } from '@vendure/core/dist/service/helpers/payment-state-machine/payment-state-machine';

@Controller('pagarme-postback')
export class PagarmePostbackController {
  private apiKeyName = 'apiKey';
  private pagarmePaymentMethodHandlerCode = 'pagarme';
  constructor(
    @InjectConnection() private connection: Connection,
    private paymentStateMachine: PaymentStateMachine,
    private orderService: OrderService
  ) {}

  /**
   * The default function from the POST Postback.
   *
   * Extracts the body of the request containing the postback response and the signature from Pagar.me
   */
  @Post()
  async create(
    @Body() postback: Postback | undefined,
    @Headers('X-Hub-Signature') signature: string | undefined
  ) {
    if (signature && postback) {
      if (postback.old_status === postback.current_status) {
        return;
      }
      await this.verifySignature(signature, postback);
      const payment = await this.getPaymentByTransactionId(postback.id);
      await this.handleNewTransactionStatus(postback, payment);
    } else {
      throw new Error("Request doesn't have a signature or a postback");
    }
  }
  private async handleNewTransactionStatus(
    postback: Postback,
    payment: Payment
  ): Promise<void> {
    const status = mapTransactionStatusToPaymentStatus(postback.current_status);
    if (status !== payment.state) {
      switch (status) {
        case 'Created':
          return await this.handleChangeToCreated();
        case 'Authorized':
          return await this.handleChangeToAuthorized(payment);
        case 'Settled':
          return await this.handleChangeToSettled(payment);
        case 'Declined':
          return await this.handleChangeToDeclined(payment);
        default:
          break;
      }
      return;
    }
  }
  private async handleChangeToCreated(): Promise<void> {
    return;
  }
  private async handleChangeToAuthorized(payment: Payment): Promise<void> {
    const order = payment.order;
    await this.paymentStateMachine.transition({}, order, payment, 'Authorized');
    if (this.orderTotalIsCovered(order, 'Authorized')) {
      await this.orderService.transitionToState(
        {},
        order.id,
        'PaymentAuthorized'
      );
      return;
    }
  }
  private async handleChangeToSettled(payment: Payment): Promise<void> {
    const order = payment.order;
    await this.paymentStateMachine.transition({}, order, payment, 'Settled');
    if (this.orderTotalIsCovered(order, 'Settled')) {
      await this.orderService.transitionToState(
        {},
        order.id,
        'PaymentAuthorized'
      );
      return;
    }
  }
  private async handleChangeToDeclined(payment: Payment): Promise<void> {
    const order = payment.order;
    await this.paymentStateMachine.transition({}, order, payment, 'Declined');
    // TODO: se for boleto cancela pedido e busca por todas transações com cartão para cancelar
  }
  private async verifySignature(signature: string, postback: Postback) {
    const apiKey = await this.getApiKey();
    if (
      !pagarme.client.postback.verifySignature(
        apiKey,
        JSON.stringify(postback),
        signature
      )
    ) {
      throw new Error("The request don't have a valid signature");
    }
  }
  /**
   * Get a Api Key for Pagar.me from the PaymentMethod in Vendure
   */
  private async getApiKey(): Promise<string> {
    const paymentMethod = await this.connection
      .getRepository(PaymentMethod)
      .findOne({
        where: {
          code: this.pagarmePaymentMethodHandlerCode
        }
      });
    if (!paymentMethod) {
      throw new Error('Pagarme is not configured as payment provider');
    }
    const apiKey = paymentMethod.configArgs.find(
      (c) => c.name === this.apiKeyName
    );

    if (!apiKey || !apiKey.value) {
      throw new Error("There isn't a API key configured for Pagar.me");
    }

    return apiKey.value;
  }
  private async getPaymentByTransactionId(transactionId: ID): Promise<Payment> {
    const payment = await this.connection.getRepository(Payment).findOne({
      where: { transactionId },
      relations: ['order', 'order.payments']
    });
    if (!payment) {
      throw new Error(
        "There isn't a payment related with the transaction ID from the postback"
      );
    }

    return payment;
  }
  /**
   * Returns true if the Order total is covered by Payments in the specified state.
   */
  private orderTotalIsCovered(order: Order, state: PaymentState): boolean {
    return (
      order.payments
        .filter((p) => p.state === state)
        .reduce((sum, p) => sum + p.amount, 0) === order.total
    );
  }
}
