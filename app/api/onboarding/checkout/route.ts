import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireOnboardingOwner } from "@/lib/vellto-onboarding-auth";
import { amountCents, isMethod, isPeriod, PERIODS } from "@/lib/vellto-onboarding";
import { mercadoPagoRequest } from "@/lib/mercado-pago";

// O CPF vai direto ao Mercado Pago e não fica salvo pela Vellto.
function validCPF(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let pos = 9; pos <= 10; pos++) {
    let sum = 0;
    for (let i = 0; i < pos; i++) sum += Number(cpf[i]) * (pos + 1 - i);
    const digit = (sum * 10) % 11;
    if ((digit === 10 ? 0 : digit) !== Number(cpf[pos])) return false;
  }
  return true;
}

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (process.env.VELLTO_ONBOARDING_PAYMENTS_ENABLED !== "true") return NextResponse.json({ message: "Pagamentos em preparação. Nenhuma cobrança foi realizada." }, { status: 503 });
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
  if (!token) return NextResponse.json({ message: "Mercado Pago não configurado." }, { status: 503 });
  // Somente credenciais de teste enquanto o fluxo não for homologado.
  if (process.env.VELLTO_ONBOARDING_LIVE_ENABLED !== "true" && process.env.VELLTO_MP_TEST_CREDENTIAL_VERIFIED !== "true")
    return NextResponse.json({ message: "Use credenciais TEST do Mercado Pago neste ambiente." }, { status: 503 });
  const auth = await requireOnboardingOwner();
  if (!auth) return NextResponse.json({ message: "Faça login para continuar." }, { status: 401 });
  const expiration = auth.business.subscriptionEndsAt
    ? new Date(auth.business.subscriptionEndsAt).getTime()
    : NaN;

  const initial =
    auth.business.active === false &&
    auth.business.billingStatus === "pending";

  const renewal =
    auth.business.active === true &&
    ["active", "past_due"].includes(String(auth.business.billingStatus)) &&
    Number.isFinite(expiration) &&
    expiration <= Date.now();

  if (!initial && !renewal)
    return NextResponse.json(
      { message: "Esta assinatura não está disponível para pagamento." },
      { status: 409 }
    );
  const body = await request.json().catch(() => ({}));
  const period = auth.business.selectedPeriod;
  const method = body.method;
  const payerCpf = String(body.payerCpf || "").replace(/\D/g, "");
  if (method === "pix" && !validCPF(payerCpf))
    return NextResponse.json({ message: "Informe um CPF válido para pagar com Pix." }, { status: 400 });
  if (!isPeriod(period) || !isMethod(method) || body.autoRenew === true)
    return NextResponse.json({ message: "Seleção inválida. Renovação automática ainda indisponível." }, { status: 400 });
  // Homologação: somente Pix com banco isolado e credencial de teste já verificada.
  // A mudança desta regra NÃO habilita o Pix na produção.
  if (method === "pix" && process.env.VELLTO_ONBOARDING_LIVE_ENABLED !== "true" &&
      (process.env.DB_NAME !== "vellto_homologacao" ||
       process.env.VELLTO_MP_TEST_CREDENTIAL_VERIFIED !== "true"))
    return NextResponse.json({ message: "Pix em testes exige banco de homologação e credencial de teste." }, { status: 503 });
  if (method === "card" && process.env.VELLTO_ONBOARDING_LIVE_ENABLED === "true" &&
      process.env.VELLTO_MP_SELLER_INSTALLMENTS_CONFIRMED !== "true")
    return NextResponse.json({ message: "Configure Parcelado Vendedor no Mercado Pago antes de habilitar cartão." }, { status: 503 });
  const cents = amountCents(period, method);
  const baseUrl = String(process.env.VELLTO_PUBLIC_URL || "").replace(/\/$/, "");
  if (!baseUrl.startsWith("https://")) return NextResponse.json({ message: "Configure VELLTO_PUBLIC_URL com uma URL pública HTTPS." }, { status: 503 });
  if (process.env.VELLTO_ONBOARDING_LIVE_ENABLED === "true" &&
      (process.env.DB_NAME === "vellto_homologacao" ||
       new URL(baseUrl).hostname !== "velltoagenda.vercel.app")) {
    return NextResponse.json(
      { message: "Pagamento real permitido somente no ambiente oficial da Vellto." },
      { status: 503 }
    );
  }
  // Não gerar outra cobrança enquanto já existir uma pendente.
  const pending = await auth.db.collection("vellto_onboarding_orders")
    .findOne(
      { businessId: auth.businessId, status: "pending" },
      { sort: { createdAt: -1 } }
    );

  if (pending) {
    if (pending.method !== method)
      return NextResponse.json(
        { message: "Já existe outro pagamento pendente para esta assinatura." },
        { status: 409 }
      );

    if (!pending.checkoutUrl && !pending.qrCode)
      return NextResponse.json(
        { message: "Seu pagamento está sendo preparado. Aguarde." },
        { status: 409 }
      );

    return NextResponse.json({
      ok: true,
      method,
      checkoutUrl: pending.checkoutUrl || "",
      qrCode: pending.qrCode || "",
      qrCodeBase64: pending.qrCodeBase64 || "",
      orderId: String(pending._id),
      expiresAt: pending.expiresAt ? new Date(pending.expiresAt).toISOString() : null,
    });
  }

  const reference = `vellto-onboard:${String(auth.businessId)}:${randomUUID()}`;
  const orderResult = await auth.db.collection("vellto_onboarding_orders").insertOne({ businessId: auth.businessId, reference, method, period, amountCents: cents, status: "pending", createdAt: new Date() });
  const orderId = orderResult.insertedId;
  try {
    const email = String(auth.user.email || "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("O proprietário precisa cadastrar um e-mail válido.");
    }

    if (method === "pix") {
      // O Mercado Pago aceita vencimento Pix entre 30 minutos e 30 dias.
      // A mesma chave é usada em reexecuções do mesmo pedido.
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      const idempotencyKey = reference.substring(reference.lastIndexOf(":") + 1);
      const payment = await mercadoPagoRequest("/v1/payments", {
        method: "POST",
        headers: { "X-Idempotency-Key": idempotencyKey },
        body: {
          transaction_amount: cents / 100,
          description: `Vellto Agenda - ${PERIODS[period].label}`,
          payment_method_id: "pix",
          payer: { email, identification: { type: "CPF", number: payerCpf } },
          external_reference: reference,
          notification_url: `${baseUrl}/api/onboarding/webhook`,
          date_of_expiration: expiresAt.toISOString(),
        },
      });
      const qrCode = String(payment.point_of_interaction?.transaction_data?.qr_code || "");
      const qrCodeBase64 = String(payment.point_of_interaction?.transaction_data?.qr_code_base64 || "");
      if (!payment.id || !qrCode) throw new Error("Mercado Pago não retornou os dados do Pix.");
      await auth.db.collection("vellto_onboarding_orders").updateOne(
        { _id: orderId },
        { $set: { paymentId: String(payment.id), qrCode, qrCodeBase64, expiresAt } }
      );
      return NextResponse.json({
        ok: true, method, orderId: String(orderId), qrCode, qrCodeBase64,
        expiresAt: expiresAt.toISOString(),
      });
    }
    const preference = await mercadoPagoRequest("/checkout/preferences", { method: "POST", body: {
      items: [{ id: `vellto-${period}`, title: `Vellto Agenda - ${PERIODS[period].label}`, quantity: 1, unit_price: cents / 100, currency_id: "BRL" }],
      payer: { email }, external_reference: reference,
      payment_methods: { excluded_payment_methods: [{ id: "pix" }], excluded_payment_types: [{ id: "ticket" }, { id: "bank_transfer" }, { id: "debit_card" }], installments: PERIODS[period].installments },
      notification_url: `${baseUrl}/api/onboarding/webhook`,
      back_urls: { success: `${baseUrl}/ativar`, failure: `${baseUrl}/ativar`, pending: `${baseUrl}/ativar` },
      auto_return: "approved",
    } });
    const checkoutUrl = String(preference.init_point || "");
    const url = new URL(checkoutUrl);
    if (
      url.protocol !== "https:" ||
      !["www.mercadopago.com.br", "www.mercadopago.com"].includes(url.hostname)
    ) throw new Error("Link de pagamento não autorizado.");

    if (!preference.id || !checkoutUrl) throw new Error("Mercado Pago não retornou o checkout.");
    await auth.db.collection("vellto_onboarding_orders").updateOne({ _id: orderId }, { $set: { preferenceId: String(preference.id), checkoutUrl } });
    return NextResponse.json({ ok: true, method, orderId: String(orderId), checkoutUrl });
  } catch (error) {
    console.error("VELLTO ONBOARDING CHECKOUT", error);
    await auth.db.collection("vellto_onboarding_orders").updateOne({ _id: orderId }, { $set: { status: "error" } });
    return NextResponse.json({ message: process.env.DB_NAME === "vellto_homologacao"
      ? `Erro Mercado Pago: ${error instanceof Error ? error.message : "desconhecido"}`
      : "Não foi possível gerar a cobrança. Confira as credenciais e tente novamente." }, { status: 502 });
  }
}
