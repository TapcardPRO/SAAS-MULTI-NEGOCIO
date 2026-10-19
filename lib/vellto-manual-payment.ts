import type { Db, ObjectId } from "mongodb";

export type ManualPaymentMode = "manual" | "none";

export const DEFAULT_PAYMENT_MESSAGE = [
  "Olá, {cliente}! 😊",
  "Recebemos sua solicitação de agendamento:",
  "Serviço: {servico}",
  "Data: {data} às {horario}",
  "Valor total: {valor}",
  "",
  "Para confirmar a reserva, é necessário realizar o pagamento antecipado.",
  "Pix: {pix}",
  "Cartão: {cartao}",
  "",
  "Após o pagamento, envie o comprovante aqui para conferência.",
  "O horário será confirmado somente após verificarmos o pagamento.",
].join("\n");

export const PAYMENT_HOLD_OPTIONS = [30, 60, 120] as const;

export function paymentHoldMinutes(value: unknown): number {
  const number = Number(value);
  return PAYMENT_HOLD_OPTIONS.some((minutes) => minutes === number) ? number : 60;
}

export function requiresManualPayment(business: any): boolean {
  return business?.manualPrepaymentEnabled === true;
}

/**
 * Liberacao oportunista: ocorre ao consultar agenda/disponibilidade, sem cron.
 * Nunca confirma pagamentos nem altera agendamentos ja confirmados.
 */
export async function expirePendingManualPayments(
  db: Db,
  businessId: ObjectId,
  date?: string
): Promise<number> {
  const now = new Date();
  const result = await db.collection("appointments").updateMany({
    $and: [
      { $or: [{ businessId }, { businessId: businessId.toString() }] },
      { bookingPaymentMode: "manual" },
      { paymentStatus: "awaiting_payment" },
      { status: "pendente" },
      { paymentDueAt: { $type: "date", $lte: now } },
      ...(date ? [{ date }] : []),
    ],
  } as any, {
    $set: {
      status: "cancelado",
      paymentStatus: "expired",
      paymentExpiredAt: now,
      updatedAt: now,
    },
  });
  return result.modifiedCount;
}
