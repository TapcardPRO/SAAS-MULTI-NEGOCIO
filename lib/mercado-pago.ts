const API_BASE =
  "https://api.mercadopago.com";

export function hasMercadoPagoConfig(account: "legacy" | "new" = "legacy") {
  return Boolean(account === "new"
    ? process.env.VELLTO_MP_NEW_ACCESS_TOKEN
    : process.env.MERCADO_PAGO_ACCESS_TOKEN);
}

export async function mercadoPagoRequest(
  path: string,
  options: {
    method?:
      | "GET"
      | "POST"
      | "PUT";

    body?: unknown;
    headers?: Record<string, string>;
  } = {},
  account: "legacy" | "new" = "legacy"
) {
  const token = account === "new"
    ? process.env.VELLTO_MP_NEW_ACCESS_TOKEN
    : process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error(
      account === "new" ? "VELLTO_MP_NEW_ACCESS_TOKEN não configurado." : "MERCADO_PAGO_ACCESS_TOKEN não configurado."
    );
  }

  const response =
    await fetch(
      `${API_BASE}${path}`,
      {
        method:
          options.method ||
          "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
          ...options.headers,
        },

        body:
          options.body ===
          undefined
            ? undefined
            : JSON.stringify(
                options.body
              ),

        cache:
          "no-store",
      }
    );

  const data =
    await response.json();

  if (
    !response.ok
  ) {
    console.error(
      "MERCADO PAGO ERROR:",
      data
    );

    throw new Error(
      data?.message ||
      data?.error ||
      "Erro na comunicação com Mercado Pago."
    );
  }

  return data;
}

export function mapSubscriptionStatus(
  value: unknown
):
  | "trial"
  | "active"
  | "past_due"
  | "cancelled" {
  const status =
    String(
      value ||
        ""
    )
      .trim()
      .toLowerCase();

  if (
    status ===
      "authorized" ||
    status ===
      "active"
  ) {
    return "active";
  }

  if (
    status ===
      "cancelled" ||
    status ===
      "canceled"
  ) {
    return "cancelled";
  }

  if (
    status ===
      "paused"
  ) {
    return "past_due";
  }

  return "trial";
}
