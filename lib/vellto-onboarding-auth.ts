import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
export async function requireOnboardingOwner() {
  const store = await cookies();
  const token = store.get("saas_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session?.userId || !ObjectId.isValid(session.userId)) return null;
  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(session.userId), role: "owner", active: { $ne: false } });
  if (!user?.businessId || !ObjectId.isValid(String(user.businessId))) return null;
  const businessId = new ObjectId(String(user.businessId));
  const business = await db.collection("businesses").findOne({ _id: businessId, signupSource: "public" });
  // O proprietario ja esta autenticado pelo token e vinculado a businessId.
  // ownerUserId pode estar ausente/desatualizado em contas criadas pelo admin.
  if (!business) return null;
  return { db, user, business, businessId };
}
