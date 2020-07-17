import qs from 'qs';
import { Controller, Body, Headers, Post } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import {
  PaymentMethod,
  Payment,
  ID,
  Order,
  PaymentState,
  OrderService,
  RequestContext,
  LanguageCode,
  ChannelService
} from '@vendure/core';
import pagarme, { Postback } from 'pagarme';
import { mapTransactionStatusToPaymentStatus } from './utils';
import { PaymentStateMachine } from '@vendure/core/dist/service/helpers/payment-state-machine/payment-state-machine';
import { Refund } from '@vendure/core/dist/entity/refund/refund.entity';

//TODO: CHECK Application/x-www-form-urlencoded
@Controller('pagarme-postback')
export class PagarmePostbackController {
  /** API Key name in method handler */
  private apiKeyName = 'apiKey';
  private pagarmePaymentMethodHandlerCode = 'pagarme';
  private apiKey: string;
  private payment: Payment;
  private postback: Postback;
  private pgClient: typeof pagarme.client;
  private ctx: RequestContext;
  constructor(
    @InjectConnection() private connection: Connection,
    private channelService: ChannelService,
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
      this.postback = postback;
      this.apiKey = await this.getApiKey();
      await this.verifySignature(signature, postback);
      this.pgClient = await this.createPagarmeClient();
      this.ctx = await this.createRequestContext();
      this.payment = await this.getPaymentByTransactionId(postback.id);
      await this.handleRefundedTransaction();
      await this.handleNewTransactionStatus();
    } else {
      throw new Error("Request doesn't have a signature or a postback");
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
  /**
   * Verify signature of the request based in Api Key and Postback and signature in header
   */
  private async verifySignature(signature: string, postback: Postback) {
    if (
      !pagarme.client.postback.verifySignature(
        this.apiKey,
        /** Here we are using qs library based on this issue: https://github.com/pagarme/pagarme-js/issues/170#issuecomment-503729557  */
        qs.stringify(postback),
        signature
      )
    ) {
      throw new Error("The request don't have a valid signature");
    }
  }
  /** Create a pagarme client based on api key */
  private async createPagarmeClient(): Promise<typeof pagarme.client> {
    return await pagarme.client.connect({ api_key: this.apiKey });
  }
  /** Get payment based on transaction id passed by the postback */
  private async getPaymentByTransactionId(transactionId: ID): Promise<Payment> {
    const payment = await this.connection.getRepository(Payment).findOne({
      where: { transactionId },
      relations: ['order', 'order.payments', 'refunds']
    });
    if (!payment) {
      throw new Error(
        "There isn't a payment related with the transaction ID from the postback"
      );
    }

    return payment;
  }
  /** Handle Refunded Transaction
   *
   * Pagar.me doesn't have a postback for refunded situation. If the transaction postback
   * returns with `refunded` or `paid` we need to check if we have some pending refunds and
   * confront the result with refunds in Pagar.me and handle with the settle refunds */
  private async handleRefundedTransaction(): Promise<void> {
    if (
      this.postback.current_status === 'refunded' ||
      this.postback.current_status === 'paid'
    ) {
      /** Check if we have refunds in pending */
      const pendingRefunds = this.payment.refunds.filter(
        (r) => r.state === 'Pending'
      );

      if (!pendingRefunds || pendingRefunds.length === 0) {
        return;
      }

      /** Get all refunds of this payment */
      const pgRefunds = await this.pgClient.refunds.find(
        {},
        {
          transaction_id: String(this.payment.transactionId)
        }
      );

      /** Update all refunds based on the response from Pagar.me */
      for (const pgRefund of pgRefunds) {
        const refund = pendingRefunds.find(
          (r) => r.transactionId === pgRefund.id
        );

        if (pgRefund.status === 'refunded' && refund) {
          await this.handleChangeRefundStatusToSettle(refund);
        }
      }
    }
  }
  /**
   * Change the status of the refund to settled and all changes that needs to be done if that happens
   * */
  private async handleChangeRefundStatusToSettle(refund: Refund) {}
  /**
   * Map all possible changes of status
   */
  private async handleNewTransactionStatus(): Promise<void> {
    const status = mapTransactionStatusToPaymentStatus(
      this.postback.current_status
    );
    if (status !== this.payment.state) {
      switch (status) {
        case 'Created':
          return await this.handleChangePaymentToCreated();
        case 'Authorized':
          return await this.handleChangePaymentToAuthorized();
        case 'Settled':
          return await this.handleChangePaymentToSettled();
        case 'Declined':
          return await this.handleChangePaymentToDeclined();
        default:
          break;
      }
      return;
    }
  }
  private async handleChangePaymentToCreated(): Promise<void> {
    return;
  }
  private async handleChangePaymentToAuthorized(): Promise<void> {
    const order = this.payment.order;
    await this.paymentStateMachine.transition(
      this.ctx,
      order,
      this.payment,
      'Authorized'
    );
    if (this.orderTotalIsCovered(order, 'Authorized')) {
      await this.orderService.transitionToState(
        this.ctx,
        order.id,
        'PaymentAuthorized'
      );
      return;
    }
  }
  private async handleChangePaymentToSettled(): Promise<void> {
    const order = this.payment.order;
    await this.paymentStateMachine.transition(
      this.ctx,
      order,
      this.payment,
      'Settled'
    );
    if (this.orderTotalIsCovered(order, 'Settled')) {
      await this.orderService.transitionToState(
        this.ctx,
        order.id,
        'PaymentSettled'
      );
      return;
    }
  }
  private async handleChangePaymentToDeclined(): Promise<void> {
    const order = this.payment.order;
    await this.paymentStateMachine.transition(
      this.ctx,
      order,
      this.payment,
      'Declined'
    );
    // TODO: se for boleto cancela pedido e busca por todas transações com cartão para cancelar
  }
  private async createRequestContext(): Promise<RequestContext> {
    const channel = await this.channelService.getDefaultChannel();
    return new RequestContext({
      apiType: 'admin',
      isAuthorized: true,
      authorizedAsOwnerOnly: false,
      channel,
      languageCode: LanguageCode.en
    });
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
