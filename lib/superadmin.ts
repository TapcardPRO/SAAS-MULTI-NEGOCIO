import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function requireSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("saas_session")?.value;

  if (!token) {
    return {
      ok: false as const,
      status: 401,
      message: "Usuário não autenticado",
    };
  }

  const session = await verifySessionToken(token);

  if (!session?.userId || !ObjectId.isValid(session.userId)) {
    return {
      ok: false as const,
      status: 401,
      message: "Sessão inválida",
    };
  }

  const db = await getDb();

  const admin = await db.collection("users").findOne({
    _id: new ObjectId(session.userId),
  });

  if (!admin || admin.active === false) {
    return {
      ok: false as const,
      status: 401,
      message: "Usuário não encontrado ou inativo",
    };
  }

  if (admin.role !== "superadmin") {
    return {
      ok: false as const,
      status: 403,
      message: "Acesso exclusivo do Super Admin",
    };
  }

  return {
    ok: true as const,
    db,
    admin,
  };
}
