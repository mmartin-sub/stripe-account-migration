import Stripe from "stripe";
import { NonNullableKey, removeNull } from "./common";

const keysToRemove: Array<keyof Stripe.Price > = [
  "id",
  "unit_amount_decimal",
  // so we keep:  unit_amount,
  "type",
  "livemode",
  "object",
  "created",
];

export function sanitizePrice(

  rawData: Stripe.Price,
  newProductId: string
): any {
  // TODO

  console.log('Original price:', rawData);
  const data:Stripe.PriceCreateParams  | Stripe.Price = removeNull(rawData);

  keysToRemove.forEach((key) => {
    delete data[key];
  });

  for (const tier of data["tiers"] || []) {
    delete (tier as any)["flat_amount_decimal"];
    delete (tier as any)["unit_amount_decimal"];
    if (tier.up_to === undefined) {
      (tier as any).up_to = "inf";
    }
  }

/*
for (let currency in data["currency_options"] ) {
  if (data["currency_options"][currency] && data["currency_options"][currency]["unit_amount_decimal"] !== undefined) {
      // Delete the key within the CurrencyOptions
      // We keep: unit_amount, it is not possible to delete it, but we can assign it to null if we want to
      delete (data["currency_options"][currency])["unit_amount_decimal"];
    // (data["currency_options"][currency])["unit_amount_decimal"]=null;
  }
}
*/


  if (data["currency_options"]) {
    delete data["currency_options"][data.currency];
  }


  if (data['custom_unit_amount']) {
    (data['custom_unit_amount'] as any)['enabled'] = true;
  }

  data["product"] = newProductId;

  console.log('Sanitazied price:', data);

  return data;
}
