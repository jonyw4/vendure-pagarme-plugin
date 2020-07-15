# Vendure Pagar.me Plugin

[![npm (scoped)](https://img.shields.io/npm/v/vendure-pagarme-plugin.svg)](https://www.npmjs.com/package/vendure-pagarme-plugin)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

💳 A plugin to enable Pagar.me as a payment provider for Vendure. Its a WORK IN PROGRESS. In issues you can find what need to be done.

## 🌟 Features
- A Pagar.me `PaymentMethodHandler` to createPayments

## ⚙️ Install
### 1. Install and configure Vendure
[Here](https://www.vendure.io/docs/getting-started/) you can find out how to install

### 2. Install the package
```bash
npm install vendure-pagarme-plugin --save
```

### 3. Add the handler in Vendure configuration
```typescript
import { pagarmePaymentMethodHandler } from 'vendure-pagarme-plugin';
const config: VendureConfig = {
  ...
  paymentOptions: [
    pagarmePaymentMethodHandler
  ]
}
```

### 4. Add this package in your storefront (Optional)
To create a payment with this plugin you will need to fill with metadata in `createPayment` mutation. If you use Typescript in your storefront you can use the `PagarmePaymentMethodMetadata` type to know witch fields that will be need. 😁

```typescript
import { PagarmePaymentMethodMetadata } from 'vendure-pagarme-plugin';
```

### 5. Enjoy!
It's done!

## 😍 Do you like?
*Please, consider supporting my work as a lot of effort takes place to create this repo! Thanks a lot.*

<a href="https://www.buymeacoffee.com/jonycelio" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-yellow.png" alt="Buy Me A Coffee" style="height: 51px !important;width: 217px !important;" ></a>

## 🌐 Localization
This project localization its hosted in [Crowdin](https://crowdin.com/project/vendure-pagarme-plugin).

## ❗️ License
MIT 