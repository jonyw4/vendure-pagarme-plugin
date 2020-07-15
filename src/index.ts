import { PaymentMethodHandler, LanguageCode, Logger } from '@vendure/core';
import pagarme, {
  CreateTransacaoCreditCartInput,
  CreateTransacaoBoletoInput,
  CreateTransacaoInputBase
} from 'pagarme';
import type { Unarray, Optional } from './types/utils';
import { mapTransactionStatusToPaymentStatus } from './utils';

export type PagarmePaymentMethodMetadata = Omit<
  Optional<CreateTransacaoInputBase, 'amount'>,
  | 'postback_url'
  | 'async'
  | 'capture'
  | 'boleto_expiration_date'
  | 'soft_descriptor'
  | 'boleto_instructions'
  | 'boleto_fine'
  | 'boleto_interest'
  | 'split_rules'
  | 'items'
  | 'metadata'
  | 'reference_key'
  | 'local_time'
> &
  (CreateTransacaoCreditCartInput | CreateTransacaoBoletoInput) & {
    extraMetadata?: any;
    itemsExtraInfo?: Partial<
      Pick<
        Unarray<CreateTransacaoInputBase['items']>,
        'venue' | 'tangible' | 'category'
      >
    > &
      { id: string }[];
  };

export const pagarmePaymentMethodHandler = new PaymentMethodHandler({
  code: 'pagarme',
  args: {
    apiKey: {
      type: 'string',
      label: [
        { languageCode: LanguageCode.en, value: 'API Key' },
        { languageCode: LanguageCode.pt_BR, value: 'Chave da API' }
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
          value: ''
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
          value: ''
        },
        {
          languageCode: LanguageCode.pt_BR,
          value:
            'Descrição que aparecerá na fatura depois do nome de sua empresa. Máximo de 13 caracteres, sendo alfanuméricos e espaços.'
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
          value: ''
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
          value: ''
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
          value: ''
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
          value: ''
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
          value: ''
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
          value: ''
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
    { itemsExtraInfo, extraMetadata, ...metadata }: PagarmePaymentMethodMetadata
  ) {
    const amount = metadata.amount ? metadata.amount : order.total;
    const pgClient = await pagarme.client.connect({ api_key: apiKey });

    try {
      const transaction = await pgClient.transactions.create({
        amount: amount,
        ...metadata,
        items: order.lines.map((line) => {
          let extraInfo: any = {};

          if (itemsExtraInfo) {
            const itemExtraInfo = itemsExtraInfo.find((i) => i.id === line.id);
            extraInfo = itemExtraInfo ? itemExtraInfo : {};
          }

          return {
            tangible: true,
            ...extraInfo,
            id: String(line.id),
            title: line.productVariant.name,
            unit_price: line.unitPrice,
            quantity: line.quantity
          };
        }),
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
          ...extraMetadata
        }),
        ...args
      });
      return {
        amount: amount,
        state: mapTransactionStatusToPaymentStatus(transaction.status),
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
      const status = mapTransactionStatusToPaymentStatus(transaction.status);
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
  }
});
