import { NextResponse } from "next/server";
import { ensureReferralCode } from "@/lib/vellto-referrals";
import { requireOwnerSession } from "@/lib/tenant-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireOwnerSession();
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

    const referralCode = await ensureReferralCode(auth.db, auth.businessId);
    const referrals = await auth.db.collection("vellto_referrals")
      .find({ referrerBusinessId: auth.businessId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const referredIds = referrals.map((item) => item.referredBusinessId).filter(Boolean);
    const businesses = referredIds.length
      ? await auth.db.collection("businesses").find(
          { _id: { $in: referredIds } },
          { projection: { name: 1 } }
        ).toArray()
      : [];
    const names = new Map(businesses.map((item) => [String(item._id), String(item.name || "Novo negócio")]));

    const credited = referrals.filter((item) => item.status === "credited").length;
    const pending = referrals.filter((item) => item.status === "pending").length;
    const baseUrl = String(process.env.VELLTO_PUBLIC_URL || "https://velltoagenda.vercel.app").replace(/\/$/, "");

    return NextResponse.json({
      ok: true,
      referralCode,
      referralUrl: `${baseUrl}/cadastro?ref=${encodeURIComponent(referralCode)}`,
      stats: {
        total: referrals.length,
        credited,
        pending,
        freeMonths: credited,
      },
      referrals: referrals.map((item) => ({
        id: String(item._id),
        businessName: names.get(String(item.referredBusinessId)) || "Novo negócio",
        status: String(item.status || "pending"),
        createdAt: item.createdAt || null,
        creditedAt: item.creditedAt || null,
      })),
    });
  } catch (error) {
    console.error("VELLTO REFERRALS GET", error);
    return NextResponse.json({ ok: false, message: "Não foi possível carregar suas indicações." }, { status: 500 });
  }
}
