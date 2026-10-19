import { NextResponse } from "next/server";
import { requireBusinessSession } from "@/lib/tenant-auth";
import { DEFAULT_PAYMENT_MESSAGE, paymentHoldMinutes } from "@/lib/vellto-manual-payment";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const auth = await requireBusinessSession();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });
  return NextResponse.json({
    enabled: auth.business.manualPrepaymentEnabled === true,
    pixKey: String(auth.business.paymentPixKey || ""),
    cardLink: String(auth.business.paymentCardLink || ""),
    template: String(auth.business.paymentMessageTemplate || DEFAULT_PAYMENT_MESSAGE),
    holdMinutes: paymentHoldMinutes(auth.business.paymentHoldMinutes),
  });
}
