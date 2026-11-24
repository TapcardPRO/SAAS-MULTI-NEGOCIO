import { randomBytes } from "node:crypto";
import { ObjectId, type Db } from "mongodb";
import { addMonths } from "@/lib/vellto-onboarding";

type ReferralDb = Db;

export async function ensureReferralCode(db: ReferralDb, businessId: ObjectId) {
  const businesses = db.collection("businesses");
  await businesses.createIndex({ referralCode: 1 }, { unique: true, sparse: true, name: "uniq_business_referral_code" });
  const business = await businesses.findOne({ _id: businessId });
  if (!business) throw new Error("Empresa não encontrada.");

  const slugSource = String(business.slug || business.name || "");
  const base = slugSource.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")
    .toUpperCase().trim().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  if (!base) throw new Error("Não foi possível criar um código a partir do nome da empresa.");

  const currentCode = typeof business.referralCode === "string" ? business.referralCode : "";
  const aliases = Array.isArray(business.referralCodeAliases) ? business.referralCodeAliases : [];
  if (currentCode === base) return base;

  const collision = await businesses.findOne({
    _id: { $ne: businessId },
    $or: [{ referralCode: base }, { referralCodeAliases: base }],
  });
  const code = collision ? `${base}-${String(businessId).slice(-5).toUpperCase()}` : base;
  const legacyCodes = [...new Set([...aliases, ...(currentCode && currentCode !== code ? [currentCode] : [])])];

  try {
    const result = await businesses.updateOne(
      { _id: businessId, referralCode: currentCode || { $exists: false } },
      { $set: { referralCode: code, referralCodeAliases: legacyCodes, updatedAt: new Date() } }
    );
    if (result.modifiedCount === 1) return code;
    const refreshed = await businesses.findOne({ _id: businessId });
    if (typeof refreshed?.referralCode === "string" && refreshed.referralCode) return refreshed.referralCode;
  } catch (error) {
    if ((error as { code?: number })?.code !== 11000) throw error;
    const uniqueCode = `${base}-${String(businessId).slice(-5).toUpperCase()}`;
    const result = await businesses.updateOne(
      { _id: businessId },
      { $set: { referralCode: uniqueCode, referralCodeAliases: legacyCodes, updatedAt: new Date() } }
    );
    if (result.modifiedCount === 1) return uniqueCode;
  }
  throw new Error("Não foi possível gerar seu código de indicação.");
}

export async function createReferralRecord(
  db: ReferralDb,
  referrerBusinessId: ObjectId,
  referredBusinessId: ObjectId,
  referralCode: string
) {
  const referrals = db.collection("vellto_referrals");
  await referrals.createIndex({ referredBusinessId: 1 }, { unique: true, name: "uniq_referred_business" });
  await referrals.createIndex({ referrerBusinessId: 1, createdAt: -1 }, { name: "referrals_by_referrer" });
  const existing = await referrals.findOne({ referredBusinessId });
  if (existing) return existing;

  try {
    await referrals.insertOne({
      referrerBusinessId,
      referredBusinessId,
      referralCode,
      status: "pending",
      rewardMonths: 1,
      createdAt: new Date(),
      creditedAt: null,
    });
  } catch (error) {
    if ((error as { code?: number })?.code !== 11000) throw error;
  }
  return referrals.findOne({ referredBusinessId });
}

// Retorna true quando não há indicação ou quando a recompensa já foi aplicada.
// O identificador da indicação é gravado na empresa junto com a extensão para
// impedir crédito duplicado mesmo se o webhook for recebido várias vezes.
export async function creditReferralReward(db: ReferralDb, referredBusinessId: ObjectId): Promise<boolean> {
  const referredBusiness = await db.collection("businesses").findOne({ _id: referredBusinessId });
  const referrerValue = referredBusiness?.referredByBusinessId;
  if (!referrerValue || !ObjectId.isValid(String(referrerValue))) return true;

  const referrerBusinessId = referrerValue instanceof ObjectId
    ? referrerValue
    : new ObjectId(String(referrerValue));
  if (String(referrerBusinessId) === String(referredBusinessId)) return true;

  const referral = await createReferralRecord(
    db,
    referrerBusinessId,
    referredBusinessId,
    String(referredBusiness.referredByCode || "")
  );
  if (!referral) return false;
  if (referral.status === "credited") return true;

  const referrer = await db.collection("businesses").findOne({ _id: referrerBusinessId });
  if (!referrer) {
    await db.collection("vellto_referrals").updateOne(
      { _id: referral._id, status: "pending" },
      { $set: { status: "invalid", invalidReason: "referrer_not_found", updatedAt: new Date() } }
    );
    return true;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const current = await db.collection("businesses").findOne({ _id: referrerBusinessId });
    if (!current) return false;
    const creditedIds = Array.isArray(current.creditedReferralIds) ? current.creditedReferralIds : [];
    if (creditedIds.some((id: unknown) => String(id) === String(referral._id))) {
      await db.collection("vellto_referrals").updateOne(
        { _id: referral._id },
        { $set: { status: "credited", creditedAt: current.billingUpdatedAt || new Date(), updatedAt: new Date() } }
      );
      return true;
    }

    const now = new Date();
    const currentExpiry = current.subscriptionEndsAt ? new Date(current.subscriptionEndsAt) : null;
    const base = currentExpiry && Number.isFinite(currentExpiry.getTime()) && currentExpiry > now ? currentExpiry : now;
    const newExpiry = addMonths(base, 1);
    const expiryFilter = current.subscriptionEndsAt === undefined
      ? { subscriptionEndsAt: { $exists: false } }
      : { subscriptionEndsAt: current.subscriptionEndsAt };

    const updated = await db.collection("businesses").updateOne(
      { _id: referrerBusinessId, creditedReferralIds: { $ne: referral._id }, ...expiryFilter },
      {
        $set: {
          active: true,
          billingStatus: "active",
          subscriptionEndsAt: newExpiry,
          billingUpdatedAt: now,
          updatedAt: now,
        },
        $addToSet: { creditedReferralIds: referral._id },
      }
    );

    if (updated.modifiedCount === 1) {
      await db.collection("vellto_referrals").updateOne(
        { _id: referral._id },
        { $set: { status: "credited", creditedAt: now, updatedAt: now, rewardMonths: 1 } }
      );
      return true;
    }
  }
  return false;
}
