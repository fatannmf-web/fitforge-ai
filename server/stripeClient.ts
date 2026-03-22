import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

// Make authenticated requests to Stripe via Replit's connectors proxy
// The SDK handles identity, token refresh, and auth headers automatically.
export async function stripeRequest(
  path: string,
  options: { method?: string; body?: Record<string, any>; formData?: Record<string, string> } = {}
): Promise<any> {
  const method = options.method ?? "GET";

  let body: string | undefined;
  let headers: Record<string, string> = {};

  if (options.formData) {
    body = new URLSearchParams(options.formData).toString();
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else if (options.body) {
    body = new URLSearchParams(
      Object.entries(options.body).map(([k, v]) => [k, String(v)])
    ).toString();
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  const response = await connectors.proxy("stripe", path, {
    method,
    body: body as any,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `Stripe API error ${response.status}: ${errorText}`;
    try {
      const errJson = JSON.parse(errorText);
      errorMsg = errJson?.error?.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

// Create or find a Stripe customer for the given email/userId
export async function findOrCreateCustomer(email: string, userId: string): Promise<string> {
  // Search existing customers by email
  const search = await stripeRequest(`/v1/customers/search?query=email:'${email}'&limit=1`);
  if (search?.data?.length > 0) {
    return search.data[0].id;
  }
  const customer = await stripeRequest("/v1/customers", {
    method: "POST",
    formData: { email, "metadata[userId]": userId },
  });
  return customer.id;
}

// Create a checkout session for subscription
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await stripeRequest("/v1/checkout/sessions", {
    method: "POST",
    formData: {
      customer: customerId,
      "payment_method_types[0]": "card",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
    },
  });
  return session.url;
}

// Create a billing portal session
export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const session = await stripeRequest("/v1/billing_portal/sessions", {
    method: "POST",
    formData: { customer: customerId, return_url: returnUrl },
  });
  return session.url;
}

// Get active subscriptions for a customer
export async function getCustomerSubscriptions(customerId: string): Promise<any[]> {
  const subs = await stripeRequest(`/v1/subscriptions?customer=${customerId}&status=active&limit=1`);
  return subs?.data ?? [];
}

// Create products + prices for FitForge Pro if they don't exist
export async function ensureProProduct(): Promise<{ productId: string; monthlyPriceId: string; yearlyPriceId: string } | null> {
  try {
    const search = await stripeRequest("/v1/products/search?query=name:'FitForge+Pro'&limit=1");
    let product;
    if (search?.data?.length > 0) {
      product = search.data[0];
    } else {
      product = await stripeRequest("/v1/products", {
        method: "POST",
        formData: {
          name: "FitForge Pro",
          description: "Acces nelimitat la AI Coach, planuri de antrenament, Body Scan avansat și mai mult.",
          "metadata[app]": "fitforge",
        },
      });
    }

    // Get existing prices
    const prices = await stripeRequest(`/v1/prices?product=${product.id}&active=true`);
    const monthly = prices.data?.find((p: any) => p.recurring?.interval === "month");
    const yearly = prices.data?.find((p: any) => p.recurring?.interval === "year");

    const monthlyPrice = monthly ?? await stripeRequest("/v1/prices", {
      method: "POST",
      formData: {
        product: product.id,
        unit_amount: "999",
        currency: "eur",
        "recurring[interval]": "month",
      },
    });

    const yearlyPrice = yearly ?? await stripeRequest("/v1/prices", {
      method: "POST",
      formData: {
        product: product.id,
        unit_amount: "7999",
        currency: "eur",
        "recurring[interval]": "year",
      },
    });

    return { productId: product.id, monthlyPriceId: monthlyPrice.id, yearlyPriceId: yearlyPrice.id };
  } catch (err: any) {
    console.error("[Stripe] ensureProProduct error:", err.message);
    return null;
  }
}
