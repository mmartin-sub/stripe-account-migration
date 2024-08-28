import { promises as fs } from "fs";
import { csvStringToMap, mapToCsvString } from "../core/csv";
import { createStripeClient } from "../core/stripe";
import { sanitizePrice } from "./sanitize/price";

export async function copyPrices(
  productsFilePath: string,
  pricesFilePath: string,
  apiKeyOldAccount: string,
  apiKeyNewAccount: string
) {
  const products = await csvStringToMap(
    await fs.readFile(productsFilePath, "utf8")
  );

  const keyMap = new Map();
  const oldAccountStripClient= createStripeClient(apiKeyOldAccount);
  const newAccountStripClient= createStripeClient(apiKeyNewAccount);

  // https://stripe.com/docs/api/prices/list
  await oldAccountStripClient
    .prices.list({
      limit: 100,
      expand: ["data.currency_options", "data.tiers"],
    })
    .autoPagingEach(async (oldPrice) => {
      const newProductId = products.get(oldPrice.product as string);

      if (!newProductId) throw Error("No matching new product_id");

      console.log('A1');
      const futurePrice = sanitizePrice(oldPrice, newProductId);
      if (futurePrice.unit_amount_decimal) {
      const newPrice = await newAccountStripClient.prices.create(
        futurePrice
      );
      console.log('A1');
      keyMap.set(oldPrice.id, newPrice.id);

            // update default price
            const oldProduct = await oldAccountStripClient.products.retrieve(oldPrice.product as string);

            if (oldProduct.default_price === oldPrice.id) {
              await newAccountStripClient.products.update(
                newProductId,
                {
                  default_price: newPrice.id,
                }
              );
            }

    }



    });

  await fs.writeFile(pricesFilePath, await mapToCsvString(keyMap));
}
