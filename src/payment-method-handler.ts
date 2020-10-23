import {
  PaymentMethodHandler,
  LanguageCode,
  IllegalOperationError,
  Logger
} from '@vendure/core';
import pagarme, {
  CreateTransactionCreditCartInput,
  CreateTransactionBoletoInput,
  CreateTransactionInputBase,
  ItemInput
} from 'pagarme';
import type { Optional } from './types/utils';
import {
  getPaymentStateByPGTransactionStatus,
  getRefundStateByPGRefundStatus
} from './utils';

export type PagarmeExtraItemInfo = Partial<
  Pick<ItemInput, 'venue' | 'tangible' | 'category'>
> & { id: string };

export type PagarmePaymentMethodMetadata = Omit<
  Optional<CreateTransactionInputBase, 'amount'>,
  | 'postback_url'
  | 'async'
  | 'capture'
  | 'soft_descriptor'
  | 'split_rules'
  | 'items'
  | 'metadata'
  | 'reference_key'
  | 'local_time'
> &
  (
    | CreateTransactionCreditCartInput
    | Omit<
        CreateTransactionBoletoInput,
        | 'boleto_expiration_date'
        | 'boleto_instructions'
        | 'boleto_fine'
        | 'boleto_interest'
      >
  ) & {
    extraInfo?: {
      metadata?: any;
      items?: PagarmeExtraItemInfo[];
    };
  };

export const pagarmePaymentMethodHandler = new PaymentMethodHandler({
  code: 'pagarme',
  args: {
    apiKey: {
      type: 'string',
      label: [
        { languageCode: LanguageCode.en, value: 'API Key v4' },
        { languageCode: LanguageCode.pt_BR, value: 'Chave da API v4' }
      ]
    },
    soft_descriptor: {
      type: 'string',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Soft Descriptor'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value: 'Descrição da fatura'
        }
      ],
      description: [
        {
          languageCode: LanguageCode.en,
          value:
            'Description that will appear on the invoice after your company name. Maximum of 13 characters, being alphanumeric and spaces.'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value:
            'Descrição que aparecerá na fatura depois do nome de sua empresa. Máximo de 13 caracteres, sendo alfanuméricos e espaços.'
        }
      ]
    },
    boleto_instructions: {
      type: 'string',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Boleto - Instructions'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value: 'Boleto - Instruções'
        }
      ],
      description: [
        {
          languageCode: LanguageCode.en,
          value: 'Bill of exchange instructions field. 255 characters maximum'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value: 'Campo instruções do boleto. Máximo de 255 caracteres'
        }
      ]
    },
    boleto_expiration_date: {
      type: 'string',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Boleto - Expiration Date'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value: 'Boleto - Prazo de Expiração'
        }
      ],
      description: [
        {
          languageCode: LanguageCode.en,
          value:
            'Deadline for payment of boleto. Must be passed in yyyy-MM-dd format'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value:
            'Prazo limite para pagamento do boleto. Deve ser passado no formato yyyy-MM-dd'
        }
      ]
    },
    boletoFineDays: {
      type: 'string',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Boleto - Fine days'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value: 'Boleto - Dias até aplicação da multa'
        }
      ],
      description: [
        {
          languageCode: LanguageCode.en,
          value: 'Days after the ticket expires when the fine must be charged.'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value:
            'Dias após a expiração do boleto quando a multa deve ser cobrada.'
        }
      ]
    },
    boletoFineAmount: {
      type: 'string',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Boleto - Fine Amount'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value: 'Boleto - Valor da multa'
        }
      ],
      description: [
        {
          languageCode: LanguageCode.en,
          value:
            'Value in cents of the fine. Maximum value of 2% of the document value.'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value:
            'Valor em centavos da multa. Valor máximo de 2% do valor do documento.'
        }
      ]
    },
    boletoInterestDays: {
      type: 'string',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Boleto - Interest Days'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value: 'Boleto - Dias até aplicação do juros'
        }
      ],
      description: [
        {
          languageCode: LanguageCode.en,
          value:
            'Days after the expiration of the boleto when interest must be charged.'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value:
            'Dias após a expiração do boleto quando o juros deve ser cobrado.'
        }
      ]
    },
    boletoInterestAmount: {
      type: 'string',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Boleto - Interest Amount'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value: 'Boleto - Valor do Juros'
        }
      ],
      description: [
        {
          languageCode: LanguageCode.en,
          value:
            'Percentage of the interest rate that will be charged per day. Maximum value of 1% per month.'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value:
            'Valor em porcentagem da taxa de juros que será cobrado por dia. Valor máximo de 1% ao mês.'
        }
      ]
    },
    async: {
      type: 'boolean',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Async'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value: 'Assíncrono'
        }
      ],
      description: [
        {
          languageCode: LanguageCode.en,
          value:
            'Use false if you want to maintain synchronous processing for a transaction. That is, the transaction response is received on the spot.'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value:
            'Utilize false caso queira manter o processamento síncrono de uma transação. Ou seja, a resposta da transação é recebida na hora.'
        }
      ]
    },
    capture: {
      type: 'boolean',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Capture'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value: 'Capturar'
        }
      ],
      description: [
        {
          languageCode: LanguageCode.en,
          value:
            'After a transaction is authorized, you can choose whether to capture or postpone the capture of the amount. If you choose to postpone the capture, assign the value false.'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value:
            'Após a autorização de uma transação, você pode escolher se irá capturar ou adiar a captura do valor. Caso opte por postergar a captura, atribua o valor false.'
        }
      ]
    }
  },
  description: [{ languageCode: LanguageCode.en, value: 'Pagar.me' }],
  async createPayment(
    order,
    {
      apiKey,
      boletoFineDays,
      boletoFineAmount,
      boletoInterestDays,
      boletoInterestAmount,
      ...args
    },
    meta
  ) {
    const { extraInfo, ...metadata } = meta as PagarmePaymentMethodMetadata;
    const amount = metadata.amount ? metadata.amount : order.total;
    const pgClient = await pagarme.client.connect({ api_key: apiKey });

    try {
      const transaction = await pgClient.transactions.create({
        amount,
        ...metadata,
        items: order.lines.map((line) => ({
          tangible: true,
          ...(extraInfo?.items &&
            extraInfo?.items.find((i) => i.id === line.id)),
          id: String(line.id),
          title: line.productVariant.name,
          unit_price: line.unitPrice,
          quantity: line.quantity
        })),
        boleto_fine: {
          days: boletoFineDays,
          amount: boletoFineAmount
        },
        boleto_interest: {
          days: boletoInterestDays,
          amount: boletoInterestAmount
        },
        metadata: JSON.stringify({
          id: order.id,
          ...extraInfo?.metadata
        }),
        ...args
      });
      return {
        amount: amount,
        state: getPaymentStateByPGTransactionStatus(transaction.status),
        transactionId: String(transaction.id),
        errorMessage: transaction.acquirer_response_code
      };
    } catch (e) {
      return {
        amount: amount,
        state: 'Error' as const,
        errorMessage: e.message
      };
    }
  },
  async settlePayment(_, payment, { apiKey }) {
    const pgClient = await pagarme.client.connect({ api_key: apiKey });

    try {
      const transaction = await pgClient.transactions.capture({
        id: payment.transactionId,
        amount: payment.amount
      });
      const status = getPaymentStateByPGTransactionStatus(transaction.status);
      return {
        success: status === 'Settled',
        errorMessage: transaction.status_reason
      };
    } catch (e) {
      return {
        success: false,
        errorMessage: e.message
      };
    }
  },
  async createRefund(input, total, order, payment, { apiKey, async }) {
    const pgClient = await pagarme.client.connect({ api_key: apiKey });

    try {
      const transaction = await pgClient.transactions.find(
        {},
        { id: Number(payment.transactionId) }
      );
      // TODO: Get bank information from the user
      // const args: Omit<TransactionRefundDefaultArgs, 'id'> &
      //   TransactionRefundDynamicArgs = {};
      // if (transaction.payment_method === 'boleto') {
      //   // Precisa de todos inputs para criar refund
      //   args = { bank_account: {} };
      // }

      if (transaction.payment_method === 'boleto') {
        throw new IllegalOperationError('pagarme-plugin.errors.boleto-refund');
      }

      await pgClient.transactions.refund(
        {},
        {
          // ...args,
          id: Number(payment.transactionId),
          amount: total,
          async: async
        }
      );

      // We need to find  the last refund to get the data of it because in the transaction doesn't return required information
      const refunds = await pgClient.refunds.find(
        {},
        {
          transaction_id: String(transaction.id)
        }
      );

      const refund = refunds[0];

      return {
        state: getRefundStateByPGRefundStatus(refund.status),
        transactionId: refund.id
      };
    } catch (e) {
      Logger.error(e.message, 'PagarmePaymentHandler');
      return {
        state: 'Failed' as const,
        metadata: {
          errorMessage: e.message
        }
      };
    }
  }
});
