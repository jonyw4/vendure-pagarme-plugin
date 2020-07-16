import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { pagarmePaymentMethodHandler } from './payment-method-handler';
import { PagarmePostbackController } from './postback-controller';

@VendurePlugin({
  imports: [PluginCommonModule],
  controllers: [PagarmePostbackController],
  configuration: (config) => {
    config.paymentOptions.paymentMethodHandlers.push(
      pagarmePaymentMethodHandler
    );
    return config;
  }
})
export class PagarmePlugin {}
