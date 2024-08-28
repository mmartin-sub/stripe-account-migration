import { promises as fs } from "fs";
import { mapToCsvString } from "../core/csv";
import { createStripeClient } from "../core/stripe";
import { sanitizeProduct } from "./sanitize/product";

const limitStripe = 100;
export async function copyProducts(
  filePath: string,
  apiKeyOldAccount: string,
  apiKeyNewAccount: string
) {
  const keyMap = new Map();

  // https://stripe.com/docs/api/products/list
  await createStripeClient(apiKeyOldAccount)
    .products.list({ limit: limitStripe })
    .autoPagingEach(async (oldProduct) => {
      const newProduct = await createStripeClient(
        apiKeyNewAccount
      ).products.create(sanitizeProduct(oldProduct));

      keyMap.set(oldProduct.id, newProduct.id);
    });

  await fs.writeFile(filePath, await mapToCsvString(keyMap));
}
