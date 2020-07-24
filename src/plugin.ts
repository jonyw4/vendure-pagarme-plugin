import { PluginCommonModule, VendurePlugin, LanguageCode } from '@vendure/core';
import { pagarmePaymentMethodHandler } from './payment-method-handler';
import { PagarmePostbackController } from './postback-controller';
import {
  pagarmeBoletoPromotionAction,
  pagarmeCreditCardPromotionAction
} from './promotion-action';

@VendurePlugin({
  imports: [PluginCommonModule],
  controllers: [PagarmePostbackController],
  configuration: (config) => {
    config.customFields.Order.push({
      name: 'pagarmePaymentMethod',
      type: 'string',
      public: true,
      options: [
        {
          value: 'boleto',
          label: [{ languageCode: LanguageCode.en, value: 'Boleto' }]
        },
        {
          value: 'credit_card',
          label: [
            { languageCode: LanguageCode.en, value: 'Credit Card' },
            { languageCode: LanguageCode.pt_BR, value: 'Cartão de Crédito' }
          ]
        }
      ],
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Pagar.me Payment Method'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value: 'Método de Pagamento do Pagar.me'
        }
      ],
      description: [
        {
          languageCode: LanguageCode.en,
          value: 'Used internally by Promotion to calculate discount for order'
        },
        {
          languageCode: LanguageCode.pt_BR,
          value:
            'Usado internamente para usar a condição de promoção baseada no método de pagamento do Pagar.me'
        }
      ]
    });
    config.promotionOptions.promotionActions?.push(
      pagarmeBoletoPromotionAction
    );
    config.promotionOptions.promotionActions?.push(
      pagarmeCreditCardPromotionAction
    );
    config.paymentOptions.paymentMethodHandlers.push(
      pagarmePaymentMethodHandler
    );
    return config;
  }
})
export class PagarmePlugin {}
