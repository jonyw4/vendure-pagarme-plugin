import { PromotionOrderAction, LanguageCode } from '@vendure/core';

export const pagarmeBoletoPromotionAction = new PromotionOrderAction({
  code: 'pagarme-boleto-discount',
  args: {
    discount: {
      type: 'int'
    }
  },
  execute(order, args) {
    // @ts-ignore
    const paymentMethod = order.customFields.pagarmePaymentMethod;
    if (paymentMethod && paymentMethod === 'boleto') {
      return -order.subTotal * (args.discount / 100);
    }
    return order.subTotal;
  },
  description: [
    {
      languageCode: LanguageCode.en,
      value:
        'Discount of {discount}% on the order with boleto payment method in Pagar.me'
    },
    {
      languageCode: LanguageCode.pt_BR,
      value:
        'Desconto de {discount}% no pedido no método de pagamento boleto usando o Pagar.me'
    }
  ]
});

export const pagarmeCreditCardPromotionAction = new PromotionOrderAction({
  code: 'pagarme-credit-card-discount',
  args: {
    discount: {
      type: 'int'
    }
  },
  execute(order, args) {
    // @ts-ignore
    const paymentMethod = order.customFields.pagarmePaymentMethod;
    if (paymentMethod && paymentMethod === 'credit_card') {
      return -order.subTotal * (args.discount / 100);
    }
    return order.subTotal;
  },
  description: [
    {
      languageCode: LanguageCode.en,
      value:
        'Discount of {discount}% on the order with credit card payment method in Pagar.me'
    },
    {
      languageCode: LanguageCode.pt_BR,
      value:
        'Desconto de {discount}% no pedido no método de pagamento cartão de crédito usando o Pagar.me'
    }
  ]
});
